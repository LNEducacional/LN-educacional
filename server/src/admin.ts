import { prisma } from './prisma';
import { getCache, setCache, deleteCache, deleteCachePattern } from './redis';

export async function getAdminDashboardStats() {
  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    totalCourses,
    totalPapers,
    totalEbooks,
    totalCertificates,
    pendingCollaborators,
    unreadMessages,
    recentOrders,
    recentUsers,
    monthlyRevenue,
    totalDownloads,
    todayDownloads,
    topDownloadedPapers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: 'CONFIRMED' },
      _sum: { totalAmount: true },
    }),
    prisma.course.count({ where: { status: 'ACTIVE' } }),
    prisma.paper.count(),
    prisma.ebook.count(),
    prisma.certificate.count(),
    prisma.collaboratorApplication.count({ where: { status: 'PENDING' } }),
    prisma.message.count({ where: { status: 'UNREAD' } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    getMonthlyRevenue(),
    prisma.downloadTracking.count(),
    prisma.downloadTracking.count({
      where: {
        downloadedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    getTopDownloadedPapers(),
  ]);

  return {
    stats: {
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCourses,
      totalPapers,
      totalEbooks,
      totalCertificates,
      pendingCollaborators,
      unreadMessages,
    },
    recentOrders,
    recentUsers,
    monthlyRevenue,
    downloads: {
      total: totalDownloads,
      today: todayDownloads,
      topPapers: topDownloadedPapers,
    },
  };
}

async function getMonthlyRevenue() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRevenue = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      paymentStatus: 'CONFIRMED',
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { totalAmount: true },
  });

  return dailyRevenue.map((day) => ({
    date: day.createdAt,
    revenue: day._sum.totalAmount || 0,
  }));
}

export async function getAllUsers(filters?: {
  role?: string;
  verified?: boolean;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.role) where.role = filters.role;
  if (filters?.verified !== undefined) where.verified = filters.verified;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            certificates: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          certificates: true,
        },
      },
    },
  });
}

export async function updateUserRole(userId: string, role: 'ADMIN' | 'STUDENT' | 'COLLABORATOR') {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: 'ADMIN' | 'STUDENT' | 'COLLABORATOR';
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          certificates: true,
        },
      },
    },
  });
}

export async function deleteUser(userId: string) {
  // Delete user and all related records in a transaction
  return prisma.$transaction(async (tx) => {
    // Delete custom paper messages first (depends on customPapers)
    await tx.customPaperMessage.deleteMany({
      where: { senderId: userId },
    });

    // Delete custom papers and their messages
    const userCustomPapers = await tx.customPaper.findMany({
      where: { userId },
      select: { id: true },
    });

    for (const paper of userCustomPapers) {
      await tx.customPaperMessage.deleteMany({
        where: { customPaperId: paper.id },
      });
    }

    await tx.customPaper.deleteMany({
      where: { userId },
    });

    // Delete course related records
    await tx.courseProgress.deleteMany({
      where: { userId },
    });

    await tx.courseEnrollment.deleteMany({
      where: { userId },
    });

    await tx.certificate.deleteMany({
      where: { userId },
    });

    // Delete library items
    await tx.library.deleteMany({
      where: { userId },
    });

    // Delete blog related records
    await tx.like.deleteMany({
      where: { userId },
    });

    await tx.comment.deleteMany({
      where: { userId },
    });

    await tx.blogPost.deleteMany({
      where: { authorId: userId },
    });

    // Delete collaborator application related records
    const userApplications = await tx.collaboratorApplication.findMany({
      where: { userId },
      select: { id: true },
    });

    for (const app of userApplications) {
      await tx.interview.deleteMany({
        where: { applicationId: app.id },
      });
      await tx.note.deleteMany({
        where: { applicationId: app.id },
      });
      await tx.evaluation.deleteMany({
        where: { applicationId: app.id },
      });
    }

    // Delete applications where user is reviewer
    await tx.collaboratorApplication.updateMany({
      where: { reviewerId: userId },
      data: { reviewerId: null },
    });

    await tx.collaboratorApplication.deleteMany({
      where: { userId },
    });

    // Delete evaluations, notes, and interviews where user is the actor
    await tx.evaluation.deleteMany({
      where: { evaluatorId: userId },
    });

    await tx.note.deleteMany({
      where: { authorId: userId },
    });

    await tx.interview.deleteMany({
      where: { interviewerId: userId },
    });

    // Update orders to remove user reference (orders can exist without user)
    await tx.order.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // Finally, delete the user
    return tx.user.delete({
      where: { id: userId },
    });
  });
}

export async function getBlogPosts(filters?: {
  published?: boolean;
  search?: string;
  categoryId?: string;
  tagIds?: string[];
  skip?: number;
  take?: number;
}) {
  // Create cache key for this specific query
  const cacheKey = `blog:posts:${JSON.stringify(filters || {})}`;

  // Try to get from cache first (only for published posts without search)
  if (filters?.published && !filters?.search) {
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const where: Record<string, unknown> = {};

  if (filters?.published !== undefined) where.published = filters.published;
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.tagIds && filters.tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: {
          in: filters.tagIds,
        },
      },
    };
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
      { excerpt: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            tags: true,
            comments: {
              where: { approved: true },
            },
            likes: true,
          },
        },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  const result = { posts, total };

  // Cache published posts without search for 5 minutes
  if (filters?.published && !filters?.search) {
    await setCache(cacheKey, result, 300);
  }

  return result;
}

export async function getBlogPostBySlug(slug: string) {
  const cacheKey = `blog:post:${slug}`;

  // Try to get from cache first (only if published)
  const cached = await getCache(cacheKey);
  if (cached && typeof cached === 'object' && 'published' in cached && cached.published) {
    // Still need to increment views
    await prisma.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });
    return cached;
  }

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: {
            where: { approved: true },
          },
          likes: true,
        },
      },
    },
  });

  if (post) {
    // Increment views
    await prisma.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    // Cache published posts for 10 minutes
    if (post.published) {
      await setCache(cacheKey, post, 600);
    }
  }

  return post;
}

export async function createBlogPost(data: {
  title: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  published?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  readingTime?: number;
}) {
  const slug = generateSlug(data.title);
  const { tagIds, ...postData } = data;

  // Determine status based on input
  let status = data.status || 'DRAFT';
  let publishedAt: Date | undefined;

  if (data.published) {
    status = 'PUBLISHED';
    publishedAt = new Date();
  }

  // Calculate reading time if not provided
  const readingTime = data.readingTime || calculateReadingTime(data.content);

  const post = await prisma.blogPost.create({
    data: {
      ...postData,
      slug,
      published: data.published || false,
      status,
      publishedAt,
      readingTime,
      tags: tagIds && tagIds.length > 0 ? {
        create: tagIds.map((tagId) => ({
          tagId,
        })),
      } : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Invalidate blog post caches when a new post is created
  await deleteCachePattern('blog:posts:*');

  return post;
}

export async function updateBlogPost(
  id: string,
  data: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImageUrl?: string;
    published?: boolean;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    categoryId?: string;
    tagIds?: string[];
    // SEO fields
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    readingTime?: number;
  }
) {
  const { tagIds, ...updateData } = data;
  const dbUpdateData: Record<string, unknown> = { ...updateData };

  if (data.title) {
    dbUpdateData.slug = generateSlug(data.title);
  }

  // Recalculate reading time if content is updated and readingTime is not explicitly provided
  if (data.content && data.readingTime === undefined) {
    dbUpdateData.readingTime = calculateReadingTime(data.content);
  }

  // Handle status changes
  if (data.published !== undefined) {
    if (data.published) {
      dbUpdateData.status = 'PUBLISHED';
      dbUpdateData.publishedAt = new Date();
    } else {
      dbUpdateData.status = data.status || 'DRAFT';
    }
  } else if (data.status) {
    dbUpdateData.status = data.status;
    if (data.status === 'PUBLISHED' && !dbUpdateData.publishedAt) {
      dbUpdateData.publishedAt = new Date();
    }
  }

  // Handle tags update separately
  if (tagIds !== undefined) {
    // First, remove all existing tags
    await prisma.blogTag.deleteMany({
      where: { postId: id },
    });

    // Then add the new tags
    if (tagIds.length > 0) {
      await prisma.blogTag.createMany({
        data: tagIds.map((tagId) => ({
          postId: id,
          tagId,
        })),
      });
    }
  }

  const updatedPost = await prisma.blogPost.update({
    where: { id },
    data: dbUpdateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Invalidate caches when a post is updated
  await deleteCachePattern('blog:posts:*');
  await deleteCache(`blog:post:${updatedPost.slug}`);

  return updatedPost;
}

export async function deleteBlogPost(id: string) {
  // Get the post first to get its slug for cache invalidation
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { slug: true },
  });

  const deletedPost = await prisma.blogPost.delete({
    where: { id },
  });

  // Invalidate caches when a post is deleted
  await deleteCachePattern('blog:posts:*');
  if (post?.slug) {
    await deleteCache(`blog:post:${post.slug}`);
  }

  return deletedPost;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /\u0300|\u0301|\u0302|\u0303|\u0304|\u0305|\u0306|\u0307|\u0308|\u0309|\u030A|\u030B|\u030C|\u030D|\u030E|\u030F|\u0310|\u0311|\u0312|\u0313|\u0314|\u0315|\u0316|\u0317|\u0318|\u0319|\u031A|\u031B|\u031C|\u031D|\u031E|\u031F|\u0320|\u0321|\u0322|\u0323|\u0324|\u0325|\u0326|\u0327|\u0328|\u0329|\u032A|\u032B|\u032C|\u032D|\u032E|\u032F|\u0330|\u0331|\u0332|\u0333|\u0334|\u0335|\u0336|\u0337|\u0338|\u0339|\u033A|\u033B|\u033C|\u033D|\u033E|\u033F|\u0340|\u0341|\u0342|\u0343|\u0344|\u0345|\u0346|\u0347|\u0348|\u0349|\u034A|\u034B|\u034C|\u034D|\u034E|\u034F|\u0350|\u0351|\u0352|\u0353|\u0354|\u0355|\u0356|\u0357|\u0358|\u0359|\u035A|\u035B|\u035C|\u035D|\u035E|\u035F|\u0360|\u0361|\u0362|\u0363|\u0364|\u0365|\u0366|\u0367|\u0368|\u0369|\u036A|\u036B|\u036C|\u036D|\u036E|\u036F/g,
      ''
    )
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function calculateReadingTime(content: string): number {
  // Remove HTML tags and count words
  const plainText = content.replace(/<[^>]*>/g, '');
  const words = plainText.split(/\s+/).length;
  // Average reading speed is 200-250 words per minute, using 225
  const readingTime = Math.ceil(words / 225);
  return readingTime;
}

export async function getMessages(filters?: {
  status?: string;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { subject: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.count({ where }),
  ]);

  return { messages, total };
}

export async function createMessage(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  metadata?: any;
}) {
  return prisma.message.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      priority: data.priority || 'NORMAL',
      category: data.category,
      metadata: data.metadata,
    },
  });
}

export async function updateMessageStatus(id: string, status: 'UNREAD' | 'READ' | 'ARCHIVED') {
  return prisma.message.update({
    where: { id },
    data: { status },
  });
}

export async function getCollaboratorApplications(filters?: {
  status?: string;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { area: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.collaboratorApplication.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.collaboratorApplication.count({ where }),
  ]);

  return { applications, total };
}

export async function applyAsCollaborator(
  userId: string,
  data: {
    fullName: string;
    email: string;
    phone: string;
    // Address fields
    zipCode?: string;
    address?: string;
    addressNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    // Professional fields
    area: string;
    education?: string;
    experience: string;
    availability: string;
    // Links and documents
    portfolioUrl?: string;
    linkedin?: string;
    resumeUrl?: string;
    portfolioFiles?: string[];
    // Form control (not saved to DB)
    acceptTerms?: boolean;
  }
) {
  // Remove fields that don't exist in DB or are not saved
  const { acceptTerms, portfolioFiles, addressNumber, neighborhood, ...dbData } = data;

  // Convert empty strings to undefined for optional fields
  const cleanData = {
    ...dbData,
    portfolioUrl: dbData.portfolioUrl || undefined,
    linkedin: dbData.linkedin || undefined,
    zipCode: dbData.zipCode || undefined,
    address: dbData.address || undefined,
    city: dbData.city || undefined,
    state: dbData.state || undefined,
    education: dbData.education || undefined,
  };

  const applicationData = {
    ...cleanData,
    userId,
    // Save portfolioFiles as JSON array
    portfolioUrls: portfolioFiles && portfolioFiles.length > 0 ? portfolioFiles : undefined,
  };

  // Always create a new application (removed update logic)
  return prisma.collaboratorApplication.create({
    data: applicationData,
  });
}

export async function updateCollaboratorStatus(
  id: string,
  status: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED'
) {
  const application = await prisma.collaboratorApplication.update({
    where: { id },
    data: { status },
    include: {
      user: true,
    },
  });

  if (status === 'APPROVED') {
    await prisma.user.update({
      where: { id: application.userId },
      data: { role: 'COLLABORATOR' },
    });
  }

  return application;
}

export async function getAnalytics(period: '7d' | '30d' | '90d' | 'day' | 'week' | 'month' | 'year' = 'month') {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case '7d':
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const [ordersData, usersData, revenueData, topProducts, conversionRate] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.user.groupBy({
      by: ['role'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: 'CONFIRMED',
      },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    getTopSellingProducts(startDate),
    calculateConversionRate(startDate),
  ]);

  return {
    period,
    orders: ordersData,
    users: usersData,
    revenue: {
      total: revenueData._sum.totalAmount || 0,
      average: revenueData._avg.totalAmount || 0,
      count: revenueData._count,
    },
    topProducts,
    conversionRate,
  };
}

async function getTopSellingProducts(startDate: Date) {
  const items = await prisma.orderItem.groupBy({
    by: ['paperId', 'courseId', 'ebookId'],
    where: {
      order: {
        createdAt: { gte: startDate },
        paymentStatus: 'CONFIRMED',
      },
    },
    _count: true,
    _sum: { price: true },
    orderBy: { _count: { price: 'desc' } },
    take: 10,
  });

  const productsWithDetails = await Promise.all(
    items.map(async (item) => {
      let product = null;
      let type = '';

      if (item.paperId) {
        product = await prisma.paper.findUnique({
          where: { id: item.paperId },
          select: { title: true, price: true },
        });
        type = 'paper';
      } else if (item.courseId) {
        product = await prisma.course.findUnique({
          where: { id: item.courseId },
          select: { title: true, price: true },
        });
        type = 'course';
      } else if (item.ebookId) {
        product = await prisma.ebook.findUnique({
          where: { id: item.ebookId },
          select: { title: true, price: true },
        });
        type = 'ebook';
      }

      return {
        product,
        type,
        salesCount: item._count,
        totalRevenue: item._sum.price || 0,
      };
    })
  );

  return productsWithDetails.filter((p) => p.product);
}

async function calculateConversionRate(startDate: Date) {
  const [totalOrders, completedOrders] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
    }),
  ]);

  return totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
}

async function getTopDownloadedPapers() {
  const topDownloads = await prisma.downloadTracking.groupBy({
    by: ['itemId'],
    where: { itemType: 'PAPER' },
    _count: { itemId: true },
    orderBy: { _count: { itemId: 'desc' } },
    take: 10,
  });

  const topPapersWithDetails = await Promise.all(
    topDownloads.map(async (item) => {
      const paper = await prisma.paper.findUnique({
        where: { id: item.itemId },
        select: { id: true, title: true, authorName: true, isFree: true },
      });
      return {
        ...paper,
        downloads: item._count.itemId,
      };
    })
  );

  return topPapersWithDetails.filter((p) => p.id !== null);
}

export async function getDownloadAnalytics(filters?: {
  startDate?: Date;
  endDate?: Date;
  itemType?: string;
  academicArea?: string;
}) {
  const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = filters?.endDate || new Date();

  const where = {
    downloadedAt: {
      gte: startDate,
      lte: endDate,
    },
    ...(filters?.itemType && { itemType: filters.itemType }),
  };

  const [
    totalDownloads,
    downloadsByDay,
    downloadsByItemType,
    topDownloadedItems,
    downloadsByArea,
    uniqueUsers,
  ] = await Promise.all([
    // Total downloads no período
    prisma.downloadTracking.count({ where }),

    // Downloads por dia
    prisma.downloadTracking.groupBy({
      by: ['downloadedAt'],
      where,
      _count: { id: true },
      orderBy: { downloadedAt: 'asc' },
    }),

    // Downloads por tipo de item
    prisma.downloadTracking.groupBy({
      by: ['itemType'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    // Top 20 itens mais baixados
    prisma.downloadTracking.groupBy({
      by: ['itemId'],
      where,
      _count: { itemId: true },
      orderBy: { _count: { itemId: 'desc' } },
      take: 20,
    }),

    // Downloads por área acadêmica (apenas papers)
    getDownloadsByAcademicArea(startDate, endDate),

    // Usuários únicos que fizeram downloads
    prisma.downloadTracking.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
    }),
  ]);

  // Buscar detalhes dos itens mais baixados
  const itemsWithDetails = await Promise.all(
    topDownloadedItems.map(async (item) => {
      let details = null;
      let itemType = '';

      // Buscar primeiro em papers
      const paper = await prisma.paper.findUnique({
        where: { id: item.itemId },
        select: {
          id: true,
          title: true,
          authorName: true,
          academicArea: true,
          isFree: true,
          paperType: true,
        },
      });

      if (paper) {
        details = paper;
        itemType = 'PAPER';
      } else {
        // Se não for paper, pode ser ebook ou material de curso
        const ebook = await prisma.ebook.findUnique({
          where: { id: item.itemId },
          select: {
            id: true,
            title: true,
            authorName: true,
            academicArea: true,
          },
        });

        if (ebook) {
          details = ebook;
          itemType = 'EBOOK';
        }
      }

      return {
        ...details,
        itemType,
        downloads: item._count.itemId,
      };
    })
  );

  // Processar downloads por dia para gráfico
  const dailyStats = processDownloadsByDay(downloadsByDay, startDate, endDate);

  return {
    summary: {
      totalDownloads,
      uniqueUsers: uniqueUsers.length,
      averagePerDay: Math.round(
        totalDownloads /
          Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      ),
      period: {
        startDate,
        endDate,
      },
    },
    charts: {
      dailyDownloads: dailyStats,
      downloadsByType: downloadsByItemType,
      downloadsByArea: downloadsByArea,
    },
    topItems: itemsWithDetails.filter((item) => item.id !== null),
    filters: {
      startDate,
      endDate,
      itemType: filters?.itemType,
      academicArea: filters?.academicArea,
    },
  };
}

async function getDownloadsByAcademicArea(startDate: Date, endDate: Date) {
  const paperDownloads = await prisma.downloadTracking.findMany({
    where: {
      itemType: 'PAPER',
      downloadedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      itemId: true,
    },
  });

  const paperIds = paperDownloads.map((d) => d.itemId);

  if (paperIds.length === 0) return [];

  const areaStats = await prisma.paper.groupBy({
    by: ['academicArea'],
    where: {
      id: { in: paperIds },
    },
    _count: { id: true },
  });

  return areaStats.map((area) => ({
    academicArea: area.academicArea,
    _count: { id: area._count.id },
  }));
}

function processDownloadsByDay(downloads: any[], startDate: Date, endDate: Date) {
  const dailyMap = new Map();

  downloads.forEach((download) => {
    const date = new Date(download.downloadedAt).toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + download._count.id);
  });

  const result = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      downloads: dailyMap.get(dateStr) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

// Ebook-specific analytics functions
export async function getEbookAnalytics(filters?: {
  startDate?: Date;
  endDate?: Date;
  academicArea?: string;
}) {
  const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = filters?.endDate || new Date();

  const [
    totalEbooks,
    freeEbooks,
    paidEbooks,
    ebookRevenue,
    ebookDownloads,
    topEbooksByDownloads,
    topEbooksByRevenue,
    ebooksByArea,
  ] = await Promise.all([
    prisma.ebook.count(),
    prisma.ebook.count({ where: { price: 0 } }),
    prisma.ebook.count({ where: { price: { gt: 0 } } }),

    // Receita total de e-books no período
    prisma.orderItem.aggregate({
      where: {
        ebookId: { not: null },
        order: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'CONFIRMED',
        },
      },
      _sum: { price: true },
      _count: true,
    }),

    // Downloads de e-books no período
    prisma.downloadTracking.count({
      where: {
        itemType: 'EBOOK',
        downloadedAt: { gte: startDate, lte: endDate },
      },
    }),

    // Top e-books por downloads
    getTopEbooksByDownloads(startDate, endDate),

    // Top e-books por receita
    getTopEbooksByRevenue(startDate, endDate),

    // E-books por área acadêmica
    prisma.ebook.groupBy({
      by: ['academicArea'],
      _count: true,
      orderBy: { _count: { academicArea: 'desc' } },
    }),
  ]);

  return {
    summary: {
      totalEbooks,
      freeEbooks,
      paidEbooks,
      totalRevenue: ebookRevenue._sum.price || 0,
      totalSales: ebookRevenue._count,
      totalDownloads: ebookDownloads,
      period: { startDate, endDate },
    },
    topEbooksByDownloads,
    topEbooksByRevenue,
    ebooksByArea,
  };
}

async function getTopEbooksByDownloads(startDate: Date, endDate: Date) {
  const topDownloads = await prisma.downloadTracking.groupBy({
    by: ['itemId'],
    where: {
      itemType: 'EBOOK',
      downloadedAt: { gte: startDate, lte: endDate },
    },
    _count: { itemId: true },
    orderBy: { _count: { itemId: 'desc' } },
    take: 10,
  });

  const ebooksWithDetails = await Promise.all(
    topDownloads.map(async (item) => {
      const ebook = await prisma.ebook.findUnique({
        where: { id: item.itemId },
        select: {
          id: true,
          title: true,
          authorName: true,
          academicArea: true,
          price: true,
          pageCount: true,
        },
      });
      return {
        ...ebook,
        downloads: item._count.itemId,
      };
    })
  );

  return ebooksWithDetails.filter((e) => e.id !== null);
}

async function getTopEbooksByRevenue(startDate: Date, endDate: Date) {
  const topRevenue = await prisma.orderItem.groupBy({
    by: ['ebookId'],
    where: {
      ebookId: { not: null },
      order: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'CONFIRMED',
      },
    },
    _sum: { price: true },
    _count: true,
    orderBy: { _sum: { price: 'desc' } },
    take: 10,
  });

  const ebooksWithDetails = await Promise.all(
    topRevenue.map(async (item) => {
      const ebook = await prisma.ebook.findUnique({
        where: { id: item.ebookId! },
        select: {
          id: true,
          title: true,
          authorName: true,
          academicArea: true,
          price: true,
          pageCount: true,
        },
      });
      return {
        ...ebook,
        totalRevenue: item._sum.price || 0,
        salesCount: item._count,
      };
    })
  );

  return ebooksWithDetails.filter((e) => e.id !== null);
}

export async function getEbookDownloadsByPeriod(
  ebookId: string,
  period: 'day' | 'week' | 'month' = 'month'
) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  const downloads = await prisma.downloadTracking.groupBy({
    by: ['downloadedAt'],
    where: {
      itemId: ebookId,
      itemType: 'EBOOK',
      downloadedAt: { gte: startDate },
    },
    _count: { id: true },
    orderBy: { downloadedAt: 'asc' },
  });

  return processDownloadsByDay(downloads, startDate, now);
}

// Category management functions
export async function getCategories(filters?: {
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return { categories, total };
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      posts: {
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { posts: true },
      },
    },
  });
}

export async function createCategory(data: {
  name: string;
  slug?: string;
}) {
  const slug = data.slug || generateSlug(data.name);

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
    },
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
  }
) {
  const updateData: Record<string, unknown> = { ...data };

  if (data.name && !data.slug) {
    updateData.slug = generateSlug(data.name);
  }

  return prisma.category.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}

// Tag management functions
export async function getTags(filters?: {
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.tag.count({ where }),
  ]);

  return { tags, total };
}

export async function getTagById(id: string) {
  return prisma.tag.findUnique({
    where: { id },
    include: {
      posts: {
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
              createdAt: true,
            },
          },
        },
        orderBy: { post: { createdAt: 'desc' } },
      },
      _count: {
        select: { posts: true },
      },
    },
  });
}

export async function createTag(data: {
  name: string;
  slug?: string;
}) {
  const slug = data.slug || generateSlug(data.name);

  return prisma.tag.create({
    data: {
      name: data.name,
      slug,
    },
  });
}

export async function updateTag(
  id: string,
  data: {
    name?: string;
    slug?: string;
  }
) {
  const updateData: Record<string, unknown> = { ...data };

  if (data.name && !data.slug) {
    updateData.slug = generateSlug(data.name);
  }

  return prisma.tag.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteTag(id: string) {
  return prisma.tag.delete({
    where: { id },
  });
}

// Comment functions
export async function getComments(filters?: {
  postId?: string;
  approved?: boolean;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.postId) where.postId = filters.postId;
  if (filters?.approved !== undefined) where.approved = filters.approved;
  if (filters?.search) {
    where.OR = [
      { content: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total };
}

export async function getCommentsByPostId(postId: string, approved = true) {
  return prisma.comment.findMany({
    where: {
      postId,
      approved,
      parentId: null, // Only top-level comments
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      replies: {
        where: { approved },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });
}

export async function createComment(data: {
  content: string;
  postId: string;
  userId: string;
  parentId?: string;
}) {
  return prisma.comment.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function updateComment(
  id: string,
  data: {
    content?: string;
    approved?: boolean;
  }
) {
  return prisma.comment.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function deleteComment(id: string) {
  return prisma.comment.delete({
    where: { id },
  });
}

export async function approveComment(id: string) {
  return prisma.comment.update({
    where: { id },
    data: { approved: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// Like functions
export async function toggleLike(postId: string, userId: string) {
  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
    return { liked: false };
  } else {
    await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
    return { liked: true };
  }
}

export async function getPostLikeCount(postId: string) {
  const count = await prisma.like.count({
    where: { postId },
  });
  return { count };
}

export async function getUserLikeStatus(postId: string, userId: string) {
  const like = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });
  return { liked: !!like };
}

export async function getPostLikes(postId: string) {
  const [likes, count] = await Promise.all([
    prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where: { postId } }),
  ]);

  return { likes, count };
}

// Related posts function
export async function getRelatedPosts(postId: string, limit = 4) {
  // Get the current post to know its category and tags
  const currentPost = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!currentPost) {
    return [];
  }

  // Find related posts based on same category or shared tags
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      AND: [
        {
          id: { not: postId }, // Exclude current post
        },
        {
          published: true,
        },
        {
          OR: [
            // Same category
            currentPost.categoryId ? {
              categoryId: currentPost.categoryId,
            } : {},
            // Shared tags
            currentPost.tags.length > 0 ? {
              tags: {
                some: {
                  tagId: {
                    in: currentPost.tags.map(t => t.tagId),
                  },
                },
              },
            } : {},
          ],
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: {
            where: { approved: true },
          },
          likes: true,
        },
      },
    },
    orderBy: [
      { views: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return relatedPosts;
}

// Sitemap generation
export async function generateSitemap(baseUrl: string = 'https://lneducacional.com.br') {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      status: 'PUBLISHED',
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const tags = await prisma.tag.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/papers</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/courses</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/ebooks</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/blog/category/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${tags.map(tag => `
  <url>
    <loc>${baseUrl}/blog/tag/${tag.slug}</loc>
    <lastmod>${tag.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')}
</urlset>`;

  return sitemap;
}

// RSS feed generation
export async function generateRssFeed(baseUrl: string = 'https://lneducacional.com.br') {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      status: 'PUBLISHED',
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20, // Latest 20 posts
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LN Educacional - Blog</title>
    <description>Artigos, dicas e conteúdos educacionais sobre trabalhos acadêmicos, metodologia científica e educação superior.</description>
    <link>${baseUrl}/blog</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>LN Educacional CMS</generator>
    <webMaster>contato@lneducacional.com.br (LN Educacional)</webMaster>
    <managingEditor>contato@lneducacional.com.br (LN Educacional)</managingEditor>
    <category>Education</category>
    <ttl>60</ttl>
    ${posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 200) + '...'}]]></description>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${post.publishedAt?.toUTCString() || post.createdAt.toUTCString()}</pubDate>
      <author>contato@lneducacional.com.br (${post.author.name})</author>
      ${post.category ? `<category><![CDATA[${post.category.name}]]></category>` : ''}
      ${post.coverImageUrl ? `<enclosure url="${post.coverImageUrl}" type="image/jpeg"/>` : ''}
      <source url="${baseUrl}/rss.xml">LN Educacional - Blog</source>
    </item>`).join('')}
  </channel>
</rss>`;

  return rss;
}

// Advanced search function for blog posts
export async function searchBlogPosts(query: {
  search?: string;
  categoryId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  authorId?: string;
  published?: boolean;
  sortBy?: 'date' | 'popularity' | 'relevance' | 'views';
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  // Published filter
  if (query.published !== undefined) where.published = query.published;

  // Category filter
  if (query.categoryId) where.categoryId = query.categoryId;

  // Author filter
  if (query.authorId) where.authorId = query.authorId;

  // Date range filter
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) (where.createdAt as any).gte = query.dateFrom;
    if (query.dateTo) (where.createdAt as any).lte = query.dateTo;
  }

  // Tags filter
  if (query.tags && query.tags.length > 0) {
    where.tags = {
      some: {
        tagId: {
          in: query.tags,
        },
      },
    };
  }

  // Full-text search filter
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } },
      { excerpt: { contains: query.search, mode: 'insensitive' } },
      { metaTitle: { contains: query.search, mode: 'insensitive' } },
      { metaDescription: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // Determine sort order
  let orderBy: any = { createdAt: 'desc' };
  const sortOrder = query.sortOrder || 'desc';

  switch (query.sortBy) {
    case 'date':
      orderBy = { publishedAt: sortOrder };
      break;
    case 'popularity':
      orderBy = [
        { likes: { _count: sortOrder } },
        { comments: { _count: sortOrder } },
        { views: sortOrder },
      ];
      break;
    case 'views':
      orderBy = { views: sortOrder };
      break;
    case 'relevance':
      // For relevance, we'll use a combination of recent activity and engagement
      orderBy = [{ views: 'desc' }, { likes: { _count: 'desc' } }, { publishedAt: 'desc' }];
      break;
    default:
      orderBy = { createdAt: sortOrder };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip: query.skip || 0,
      take: query.take || 20,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            tags: true,
            comments: {
              where: { approved: true },
            },
            likes: true,
          },
        },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total, query };
}

// Enhanced Message Management Functions

export async function replyToMessage(
  messageId: string,
  content: string,
  adminId: string
) {
  const message = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Send email reply using email service
  const { emailService } = await import('./services/email.service');

  await emailService.sendEmail({
    to: message.email,
    subject: `Re: ${message.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Resposta à sua mensagem</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Sua mensagem original:</strong>
          <p><strong>Assunto:</strong> ${message.subject}</p>
          <p>${message.message}</p>
        </div>
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px;">
          <strong>Nossa resposta:</strong>
          <div style="margin-top: 10px;">${content}</div>
        </div>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          Atenciosamente,<br>
          Equipe LN Educacional<br>
          <a href="mailto:contato@lneducacional.com.br">contato@lneducacional.com.br</a>
        </p>
      </div>
    `,
    replyTo: 'contato@lneducacional.com.br'
  });

  // Update message as replied
  return prisma.message.update({
    where: { id: messageId },
    data: {
      replied: true,
      repliedAt: new Date(),
      replyContent: content,
      status: 'READ',
      assignedTo: adminId
    }
  });
}

export async function deleteMessage(messageId: string) {
  return prisma.message.delete({
    where: { id: messageId }
  });
}

export async function bulkMarkMessagesAsRead(messageIds: string[]) {
  return prisma.message.updateMany({
    where: {
      id: { in: messageIds }
    },
    data: {
      status: 'READ'
    }
  });
}

export async function getMessageStats() {
  const [statusStats, recentActivity, priorityStats] = await Promise.all([
    // Status statistics
    prisma.message.groupBy({
      by: ['status'],
      _count: true
    }),

    // Recent activity (last 30 days)
    prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "Message"
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,

    // Priority statistics
    prisma.message.groupBy({
      by: ['priority'],
      _count: true
    })
  ]);

  const totalMessages = await prisma.message.count();
  const unreadCount = await prisma.message.count({
    where: { status: 'UNREAD' }
  });
  const repliedCount = await prisma.message.count({
    where: { replied: true }
  });

  return {
    total: totalMessages,
    unread: unreadCount,
    replied: repliedCount,
    replyRate: totalMessages > 0 ? Math.round((repliedCount / totalMessages) * 100) : 0,
    statusStats: statusStats.map(stat => ({
      status: stat.status,
      count: stat._count
    })),
    priorityStats: priorityStats.map(stat => ({
      priority: stat.priority,
      count: stat._count
    })),
    recentActivity: recentActivity.map(activity => ({
      date: activity.date,
      count: activity.count
    }))
  };
}

// Legal Documents CRUD Functions

export async function getLegalDocuments(filters?: {
  type?: string;
  active?: boolean;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.type) {
    where.type = filters.type.toUpperCase();
  }

  if (filters?.active !== undefined) {
    where.active = filters.active;
  }

  const [documents, total] = await Promise.all([
    prisma.legalDocument.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 10,
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.legalDocument.count({ where })
  ]);

  return { documents, total };
}

export async function getLegalDocumentByType(type: string) {
  return prisma.legalDocument.findFirst({
    where: {
      type: type.toUpperCase() as any,
      active: true
    }
  });
}

export async function createLegalDocument(data: {
  type: string;
  title: string;
  content: string;
  publishedBy: string;
}) {
  // Deactivate previous version of the same type
  await prisma.legalDocument.updateMany({
    where: {
      type: data.type.toUpperCase() as any,
      active: true
    },
    data: { active: false }
  });

  // Create new version
  return prisma.legalDocument.create({
    data: {
      type: data.type.toUpperCase() as any,
      title: data.title,
      content: data.content,
      version: `v${Date.now()}`,
      publishedBy: data.publishedBy,
      active: true
    }
  });
}

export async function updateLegalDocument(
  id: string,
  data: {
    title?: string;
    content?: string;
    active?: boolean;
  }
) {
  return prisma.legalDocument.update({
    where: { id },
    data
  });
}

export async function deleteLegalDocument(id: string) {
  return prisma.legalDocument.delete({
    where: { id }
  });
}

export async function getLegalDocumentVersions(type: string) {
  return prisma.legalDocument.findMany({
    where: {
      type: type.toUpperCase() as any
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Message Templates CRUD Functions

export async function getMessageTemplates(filters?: {
  category?: string;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { subject: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const [templates, total] = await Promise.all([
    prisma.messageTemplate.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 10,
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.messageTemplate.count({ where })
  ]);

  return { templates, total };
}

export async function createMessageTemplate(data: {
  name: string;
  subject: string;
  content: string;
  variables?: string[];
  category?: string;
  createdBy: string;
}) {
  return prisma.messageTemplate.create({
    data: {
      name: data.name,
      subject: data.subject,
      content: data.content,
      variables: data.variables || [],
      category: data.category,
      createdBy: data.createdBy
    }
  });
}

export async function updateMessageTemplate(
  id: string,
  data: {
    name?: string;
    subject?: string;
    content?: string;
    variables?: string[];
    category?: string;
  }
) {
  return prisma.messageTemplate.update({
    where: { id },
    data
  });
}

export async function deleteMessageTemplate(id: string) {
  return prisma.messageTemplate.delete({
    where: { id }
  });
}

export async function getMessageTemplateById(id: string) {
  return prisma.messageTemplate.findUnique({
    where: { id }
  });
}

// API Integrations Management Functions

export async function getApiIntegrations(filters?: {
  name?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.name) {
    where.name = filters.name;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [integrations, total] = await Promise.all([
    prisma.apiIntegration.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        environment: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar apiKey e apiSecret por segurança
      }
    }),
    prisma.apiIntegration.count({ where })
  ]);

  return { integrations, total };
}

export async function getApiIntegrationById(id: string) {
  return prisma.apiIntegration.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      displayName: true,
      environment: true,
      isActive: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      // Não retornar apiKey e apiSecret completos, apenas indicar que existem
      apiKey: true,
      apiSecret: true,
    }
  });
}

export async function getApiIntegrationByName(name: string) {
  return prisma.apiIntegration.findUnique({
    where: { name },
    select: {
      id: true,
      name: true,
      displayName: true,
      apiKey: true,
      apiSecret: true,
      environment: true,
      isActive: true,
      metadata: true,
    }
  });
}

export async function createApiIntegration(data: {
  name: string;
  displayName: string;
  apiKey: string;
  apiSecret?: string;
  environment?: string;
  metadata?: any;
}) {
  // Verificar se já existe uma integração com esse nome
  const existing = await prisma.apiIntegration.findUnique({
    where: { name: data.name }
  });

  if (existing) {
    throw new Error('Integration with this name already exists');
  }

  return prisma.apiIntegration.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      environment: data.environment || 'production',
      metadata: data.metadata,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      environment: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

export async function updateApiIntegration(
  id: string,
  data: {
    displayName?: string;
    apiKey?: string;
    apiSecret?: string;
    environment?: string;
    isActive?: boolean;
    metadata?: any;
  }
) {
  return prisma.apiIntegration.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      displayName: true,
      environment: true,
      isActive: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

export async function deleteApiIntegration(id: string) {
  return prisma.apiIntegration.delete({
    where: { id }
  });
}

export async function toggleApiIntegrationStatus(id: string) {
  const integration = await prisma.apiIntegration.findUnique({
    where: { id },
    select: { isActive: true }
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  return prisma.apiIntegration.update({
    where: { id },
    data: { isActive: !integration.isActive },
    select: {
      id: true,
      name: true,
      displayName: true,
      environment: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}
