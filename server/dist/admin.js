"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboardStats = getAdminDashboardStats;
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUserRole = updateUserRole;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.getBlogPosts = getBlogPosts;
exports.getBlogPostBySlug = getBlogPostBySlug;
exports.createBlogPost = createBlogPost;
exports.updateBlogPost = updateBlogPost;
exports.deleteBlogPost = deleteBlogPost;
exports.getMessages = getMessages;
exports.createMessage = createMessage;
exports.updateMessageStatus = updateMessageStatus;
exports.getCollaboratorApplications = getCollaboratorApplications;
exports.applyAsCollaborator = applyAsCollaborator;
exports.updateCollaboratorStatus = updateCollaboratorStatus;
exports.getAnalytics = getAnalytics;
exports.getDownloadAnalytics = getDownloadAnalytics;
exports.getEbookAnalytics = getEbookAnalytics;
exports.getEbookDownloadsByPeriod = getEbookDownloadsByPeriod;
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.getTags = getTags;
exports.getTagById = getTagById;
exports.createTag = createTag;
exports.updateTag = updateTag;
exports.deleteTag = deleteTag;
exports.getComments = getComments;
exports.getCommentsByPostId = getCommentsByPostId;
exports.createComment = createComment;
exports.updateComment = updateComment;
exports.deleteComment = deleteComment;
exports.approveComment = approveComment;
exports.toggleLike = toggleLike;
exports.getPostLikeCount = getPostLikeCount;
exports.getUserLikeStatus = getUserLikeStatus;
exports.getPostLikes = getPostLikes;
exports.getRelatedPosts = getRelatedPosts;
exports.generateSitemap = generateSitemap;
exports.generateRssFeed = generateRssFeed;
exports.searchBlogPosts = searchBlogPosts;
exports.replyToMessage = replyToMessage;
exports.deleteMessage = deleteMessage;
exports.bulkMarkMessagesAsRead = bulkMarkMessagesAsRead;
exports.getMessageStats = getMessageStats;
exports.getLegalDocuments = getLegalDocuments;
exports.getLegalDocumentByType = getLegalDocumentByType;
exports.createLegalDocument = createLegalDocument;
exports.updateLegalDocument = updateLegalDocument;
exports.deleteLegalDocument = deleteLegalDocument;
exports.getLegalDocumentVersions = getLegalDocumentVersions;
exports.getMessageTemplates = getMessageTemplates;
exports.createMessageTemplate = createMessageTemplate;
exports.updateMessageTemplate = updateMessageTemplate;
exports.deleteMessageTemplate = deleteMessageTemplate;
exports.getMessageTemplateById = getMessageTemplateById;
const prisma_1 = require("./prisma");
const redis_1 = require("./redis");
async function getAdminDashboardStats() {
    const [totalUsers, totalOrders, totalRevenue, totalCourses, totalPapers, totalEbooks, totalCertificates, pendingCollaborators, unreadMessages, recentOrders, recentUsers, monthlyRevenue, totalDownloads, todayDownloads, topDownloadedPapers,] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.order.count(),
        prisma_1.prisma.order.aggregate({
            where: { paymentStatus: 'CONFIRMED' },
            _sum: { totalAmount: true },
        }),
        prisma_1.prisma.course.count({ where: { status: 'ACTIVE' } }),
        prisma_1.prisma.paper.count(),
        prisma_1.prisma.ebook.count(),
        prisma_1.prisma.certificate.count(),
        prisma_1.prisma.collaboratorApplication.count({ where: { status: 'PENDING' } }),
        prisma_1.prisma.message.count({ where: { status: 'UNREAD' } }),
        prisma_1.prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        }),
        prisma_1.prisma.user.findMany({
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
        prisma_1.prisma.downloadTracking.count(),
        prisma_1.prisma.downloadTracking.count({
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
    const dailyRevenue = await prisma_1.prisma.order.groupBy({
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
async function getAllUsers(filters) {
    const where = {};
    if (filters?.role)
        where.role = filters.role;
    if (filters?.verified !== undefined)
        where.verified = filters.verified;
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
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
        prisma_1.prisma.user.count({ where }),
    ]);
    return { users, total };
}
async function getUserById(userId) {
    return prisma_1.prisma.user.findUnique({
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
async function updateUserRole(userId, role) {
    return prisma_1.prisma.user.update({
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
async function updateUser(userId, data) {
    return prisma_1.prisma.user.update({
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
async function deleteUser(userId) {
    return prisma_1.prisma.user.delete({
        where: { id: userId },
    });
}
async function getBlogPosts(filters) {
    // Create cache key for this specific query
    const cacheKey = `blog:posts:${JSON.stringify(filters || {})}`;
    // Try to get from cache first (only for published posts without search)
    if (filters?.published && !filters?.search) {
        const cached = await (0, redis_1.getCache)(cacheKey);
        if (cached) {
            return cached;
        }
    }
    const where = {};
    if (filters?.published !== undefined)
        where.published = filters.published;
    if (filters?.categoryId)
        where.categoryId = filters.categoryId;
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
        prisma_1.prisma.blogPost.findMany({
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
        prisma_1.prisma.blogPost.count({ where }),
    ]);
    const result = { posts, total };
    // Cache published posts without search for 5 minutes
    if (filters?.published && !filters?.search) {
        await (0, redis_1.setCache)(cacheKey, result, 300);
    }
    return result;
}
async function getBlogPostBySlug(slug) {
    const cacheKey = `blog:post:${slug}`;
    // Try to get from cache first (only if published)
    const cached = await (0, redis_1.getCache)(cacheKey);
    if (cached && typeof cached === 'object' && 'published' in cached && cached.published) {
        // Still need to increment views
        await prisma_1.prisma.blogPost.update({
            where: { slug },
            data: { views: { increment: 1 } },
        });
        return cached;
    }
    const post = await prisma_1.prisma.blogPost.findUnique({
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
        await prisma_1.prisma.blogPost.update({
            where: { slug },
            data: { views: { increment: 1 } },
        });
        // Cache published posts for 10 minutes
        if (post.published) {
            await (0, redis_1.setCache)(cacheKey, post, 600);
        }
    }
    return post;
}
async function createBlogPost(data) {
    const slug = generateSlug(data.title);
    const { tagIds, ...postData } = data;
    // Determine status based on input
    let status = data.status || 'DRAFT';
    let publishedAt;
    if (data.published) {
        status = 'PUBLISHED';
        publishedAt = new Date();
    }
    else if (data.scheduledAt && data.scheduledAt > new Date()) {
        status = 'SCHEDULED';
    }
    // Calculate reading time if not provided
    const readingTime = data.readingTime || calculateReadingTime(data.content);
    const post = await prisma_1.prisma.blogPost.create({
        data: {
            ...postData,
            slug,
            published: data.published || false,
            status,
            publishedAt,
            scheduledAt: data.scheduledAt,
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
    await (0, redis_1.deleteCachePattern)('blog:posts:*');
    return post;
}
async function updateBlogPost(id, data) {
    const { tagIds, ...updateData } = data;
    const dbUpdateData = { ...updateData };
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
        }
        else {
            dbUpdateData.status = data.status || 'DRAFT';
        }
    }
    else if (data.status) {
        dbUpdateData.status = data.status;
        if (data.status === 'PUBLISHED' && !dbUpdateData.publishedAt) {
            dbUpdateData.publishedAt = new Date();
        }
    }
    if (data.scheduledAt !== undefined) {
        dbUpdateData.scheduledAt = data.scheduledAt;
        if (data.scheduledAt && data.scheduledAt > new Date() && !data.published) {
            dbUpdateData.status = 'SCHEDULED';
        }
    }
    // Handle tags update separately
    if (tagIds !== undefined) {
        // First, remove all existing tags
        await prisma_1.prisma.blogTag.deleteMany({
            where: { postId: id },
        });
        // Then add the new tags
        if (tagIds.length > 0) {
            await prisma_1.prisma.blogTag.createMany({
                data: tagIds.map((tagId) => ({
                    postId: id,
                    tagId,
                })),
            });
        }
    }
    const updatedPost = await prisma_1.prisma.blogPost.update({
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
    await (0, redis_1.deleteCachePattern)('blog:posts:*');
    await (0, redis_1.deleteCache)(`blog:post:${updatedPost.slug}`);
    return updatedPost;
}
async function deleteBlogPost(id) {
    // Get the post first to get its slug for cache invalidation
    const post = await prisma_1.prisma.blogPost.findUnique({
        where: { id },
        select: { slug: true },
    });
    const deletedPost = await prisma_1.prisma.blogPost.delete({
        where: { id },
    });
    // Invalidate caches when a post is deleted
    await (0, redis_1.deleteCachePattern)('blog:posts:*');
    if (post?.slug) {
        await (0, redis_1.deleteCache)(`blog:post:${post.slug}`);
    }
    return deletedPost;
}
function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/\u0300|\u0301|\u0302|\u0303|\u0304|\u0305|\u0306|\u0307|\u0308|\u0309|\u030A|\u030B|\u030C|\u030D|\u030E|\u030F|\u0310|\u0311|\u0312|\u0313|\u0314|\u0315|\u0316|\u0317|\u0318|\u0319|\u031A|\u031B|\u031C|\u031D|\u031E|\u031F|\u0320|\u0321|\u0322|\u0323|\u0324|\u0325|\u0326|\u0327|\u0328|\u0329|\u032A|\u032B|\u032C|\u032D|\u032E|\u032F|\u0330|\u0331|\u0332|\u0333|\u0334|\u0335|\u0336|\u0337|\u0338|\u0339|\u033A|\u033B|\u033C|\u033D|\u033E|\u033F|\u0340|\u0341|\u0342|\u0343|\u0344|\u0345|\u0346|\u0347|\u0348|\u0349|\u034A|\u034B|\u034C|\u034D|\u034E|\u034F|\u0350|\u0351|\u0352|\u0353|\u0354|\u0355|\u0356|\u0357|\u0358|\u0359|\u035A|\u035B|\u035C|\u035D|\u035E|\u035F|\u0360|\u0361|\u0362|\u0363|\u0364|\u0365|\u0366|\u0367|\u0368|\u0369|\u036A|\u036B|\u036C|\u036D|\u036E|\u036F/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}
function calculateReadingTime(content) {
    // Remove HTML tags and count words
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.split(/\s+/).length;
    // Average reading speed is 200-250 words per minute, using 225
    const readingTime = Math.ceil(words / 225);
    return readingTime;
}
async function getMessages(filters) {
    const where = {};
    if (filters?.status)
        where.status = filters.status;
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { subject: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [messages, total] = await Promise.all([
        prisma_1.prisma.message.findMany({
            where,
            skip: filters?.skip || 0,
            take: filters?.take || 20,
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.message.count({ where }),
    ]);
    return { messages, total };
}
async function createMessage(data) {
    return prisma_1.prisma.message.create({
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
async function updateMessageStatus(id, status) {
    return prisma_1.prisma.message.update({
        where: { id },
        data: { status },
    });
}
async function getCollaboratorApplications(filters) {
    const where = {};
    if (filters?.status)
        where.status = filters.status;
    if (filters?.search) {
        where.OR = [
            { fullName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { area: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [applications, total] = await Promise.all([
        prisma_1.prisma.collaboratorApplication.findMany({
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
        prisma_1.prisma.collaboratorApplication.count({ where }),
    ]);
    return { applications, total };
}
async function applyAsCollaborator(userId, data) {
    const existingApplication = await prisma_1.prisma.collaboratorApplication.findUnique({
        where: { userId },
    });
    if (existingApplication) {
        throw new Error('Application already exists');
    }
    return prisma_1.prisma.collaboratorApplication.create({
        data: {
            ...data,
            userId,
        },
    });
}
async function updateCollaboratorStatus(id, status) {
    const application = await prisma_1.prisma.collaboratorApplication.update({
        where: { id },
        data: { status },
        include: {
            user: true,
        },
    });
    if (status === 'APPROVED') {
        await prisma_1.prisma.user.update({
            where: { id: application.userId },
            data: { role: 'COLLABORATOR' },
        });
    }
    return application;
}
async function getAnalytics(period = 'month') {
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
        prisma_1.prisma.order.groupBy({
            by: ['status'],
            where: { createdAt: { gte: startDate } },
            _count: true,
        }),
        prisma_1.prisma.user.groupBy({
            by: ['role'],
            where: { createdAt: { gte: startDate } },
            _count: true,
        }),
        prisma_1.prisma.order.aggregate({
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
async function getTopSellingProducts(startDate) {
    const items = await prisma_1.prisma.orderItem.groupBy({
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
    const productsWithDetails = await Promise.all(items.map(async (item) => {
        let product = null;
        let type = '';
        if (item.paperId) {
            product = await prisma_1.prisma.paper.findUnique({
                where: { id: item.paperId },
                select: { title: true, price: true },
            });
            type = 'paper';
        }
        else if (item.courseId) {
            product = await prisma_1.prisma.course.findUnique({
                where: { id: item.courseId },
                select: { title: true, price: true },
            });
            type = 'course';
        }
        else if (item.ebookId) {
            product = await prisma_1.prisma.ebook.findUnique({
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
    }));
    return productsWithDetails.filter((p) => p.product);
}
async function calculateConversionRate(startDate) {
    const [totalOrders, completedOrders] = await Promise.all([
        prisma_1.prisma.order.count({
            where: { createdAt: { gte: startDate } },
        }),
        prisma_1.prisma.order.count({
            where: {
                createdAt: { gte: startDate },
                status: 'COMPLETED',
            },
        }),
    ]);
    return totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
}
async function getTopDownloadedPapers() {
    const topDownloads = await prisma_1.prisma.downloadTracking.groupBy({
        by: ['itemId'],
        where: { itemType: 'PAPER' },
        _count: { itemId: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: 10,
    });
    const topPapersWithDetails = await Promise.all(topDownloads.map(async (item) => {
        const paper = await prisma_1.prisma.paper.findUnique({
            where: { id: item.itemId },
            select: { id: true, title: true, authorName: true, isFree: true },
        });
        return {
            ...paper,
            downloads: item._count.itemId,
        };
    }));
    return topPapersWithDetails.filter((p) => p.id !== null);
}
async function getDownloadAnalytics(filters) {
    const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = filters?.endDate || new Date();
    const where = {
        downloadedAt: {
            gte: startDate,
            lte: endDate,
        },
        ...(filters?.itemType && { itemType: filters.itemType }),
    };
    const [totalDownloads, downloadsByDay, downloadsByItemType, topDownloadedItems, downloadsByArea, uniqueUsers,] = await Promise.all([
        // Total downloads no período
        prisma_1.prisma.downloadTracking.count({ where }),
        // Downloads por dia
        prisma_1.prisma.downloadTracking.groupBy({
            by: ['downloadedAt'],
            where,
            _count: { id: true },
            orderBy: { downloadedAt: 'asc' },
        }),
        // Downloads por tipo de item
        prisma_1.prisma.downloadTracking.groupBy({
            by: ['itemType'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),
        // Top 20 itens mais baixados
        prisma_1.prisma.downloadTracking.groupBy({
            by: ['itemId'],
            where,
            _count: { itemId: true },
            orderBy: { _count: { itemId: 'desc' } },
            take: 20,
        }),
        // Downloads por área acadêmica (apenas papers)
        getDownloadsByAcademicArea(startDate, endDate),
        // Usuários únicos que fizeram downloads
        prisma_1.prisma.downloadTracking.groupBy({
            by: ['userId'],
            where,
            _count: { userId: true },
        }),
    ]);
    // Buscar detalhes dos itens mais baixados
    const itemsWithDetails = await Promise.all(topDownloadedItems.map(async (item) => {
        let details = null;
        let itemType = '';
        // Buscar primeiro em papers
        const paper = await prisma_1.prisma.paper.findUnique({
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
        }
        else {
            // Se não for paper, pode ser ebook ou material de curso
            const ebook = await prisma_1.prisma.ebook.findUnique({
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
    }));
    // Processar downloads por dia para gráfico
    const dailyStats = processDownloadsByDay(downloadsByDay, startDate, endDate);
    return {
        summary: {
            totalDownloads,
            uniqueUsers: uniqueUsers.length,
            averagePerDay: Math.round(totalDownloads /
                Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))),
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
async function getDownloadsByAcademicArea(startDate, endDate) {
    const paperDownloads = await prisma_1.prisma.downloadTracking.findMany({
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
    if (paperIds.length === 0)
        return [];
    const areaStats = await prisma_1.prisma.paper.groupBy({
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
function processDownloadsByDay(downloads, startDate, endDate) {
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
async function getEbookAnalytics(filters) {
    const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = filters?.endDate || new Date();
    const [totalEbooks, freeEbooks, paidEbooks, ebookRevenue, ebookDownloads, topEbooksByDownloads, topEbooksByRevenue, ebooksByArea,] = await Promise.all([
        prisma_1.prisma.ebook.count(),
        prisma_1.prisma.ebook.count({ where: { price: 0 } }),
        prisma_1.prisma.ebook.count({ where: { price: { gt: 0 } } }),
        // Receita total de e-books no período
        prisma_1.prisma.orderItem.aggregate({
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
        prisma_1.prisma.downloadTracking.count({
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
        prisma_1.prisma.ebook.groupBy({
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
async function getTopEbooksByDownloads(startDate, endDate) {
    const topDownloads = await prisma_1.prisma.downloadTracking.groupBy({
        by: ['itemId'],
        where: {
            itemType: 'EBOOK',
            downloadedAt: { gte: startDate, lte: endDate },
        },
        _count: { itemId: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: 10,
    });
    const ebooksWithDetails = await Promise.all(topDownloads.map(async (item) => {
        const ebook = await prisma_1.prisma.ebook.findUnique({
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
    }));
    return ebooksWithDetails.filter((e) => e.id !== null);
}
async function getTopEbooksByRevenue(startDate, endDate) {
    const topRevenue = await prisma_1.prisma.orderItem.groupBy({
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
    const ebooksWithDetails = await Promise.all(topRevenue.map(async (item) => {
        const ebook = await prisma_1.prisma.ebook.findUnique({
            where: { id: item.ebookId },
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
    }));
    return ebooksWithDetails.filter((e) => e.id !== null);
}
async function getEbookDownloadsByPeriod(ebookId, period = 'month') {
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
    const downloads = await prisma_1.prisma.downloadTracking.groupBy({
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
async function getCategories(filters) {
    const where = {};
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { slug: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [categories, total] = await Promise.all([
        prisma_1.prisma.category.findMany({
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
        prisma_1.prisma.category.count({ where }),
    ]);
    return { categories, total };
}
async function getCategoryById(id) {
    return prisma_1.prisma.category.findUnique({
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
async function createCategory(data) {
    const slug = data.slug || generateSlug(data.name);
    return prisma_1.prisma.category.create({
        data: {
            name: data.name,
            slug,
        },
    });
}
async function updateCategory(id, data) {
    const updateData = { ...data };
    if (data.name && !data.slug) {
        updateData.slug = generateSlug(data.name);
    }
    return prisma_1.prisma.category.update({
        where: { id },
        data: updateData,
    });
}
async function deleteCategory(id) {
    return prisma_1.prisma.category.delete({
        where: { id },
    });
}
// Tag management functions
async function getTags(filters) {
    const where = {};
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { slug: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [tags, total] = await Promise.all([
        prisma_1.prisma.tag.findMany({
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
        prisma_1.prisma.tag.count({ where }),
    ]);
    return { tags, total };
}
async function getTagById(id) {
    return prisma_1.prisma.tag.findUnique({
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
async function createTag(data) {
    const slug = data.slug || generateSlug(data.name);
    return prisma_1.prisma.tag.create({
        data: {
            name: data.name,
            slug,
        },
    });
}
async function updateTag(id, data) {
    const updateData = { ...data };
    if (data.name && !data.slug) {
        updateData.slug = generateSlug(data.name);
    }
    return prisma_1.prisma.tag.update({
        where: { id },
        data: updateData,
    });
}
async function deleteTag(id) {
    return prisma_1.prisma.tag.delete({
        where: { id },
    });
}
// Comment functions
async function getComments(filters) {
    const where = {};
    if (filters?.postId)
        where.postId = filters.postId;
    if (filters?.approved !== undefined)
        where.approved = filters.approved;
    if (filters?.search) {
        where.OR = [
            { content: { contains: filters.search, mode: 'insensitive' } },
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        ];
    }
    const [comments, total] = await Promise.all([
        prisma_1.prisma.comment.findMany({
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
        prisma_1.prisma.comment.count({ where }),
    ]);
    return { comments, total };
}
async function getCommentsByPostId(postId, approved = true) {
    return prisma_1.prisma.comment.findMany({
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
async function createComment(data) {
    return prisma_1.prisma.comment.create({
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
async function updateComment(id, data) {
    return prisma_1.prisma.comment.update({
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
async function deleteComment(id) {
    return prisma_1.prisma.comment.delete({
        where: { id },
    });
}
async function approveComment(id) {
    return prisma_1.prisma.comment.update({
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
async function toggleLike(postId, userId) {
    const existingLike = await prisma_1.prisma.like.findUnique({
        where: {
            postId_userId: {
                postId,
                userId,
            },
        },
    });
    if (existingLike) {
        await prisma_1.prisma.like.delete({
            where: { id: existingLike.id },
        });
        return { liked: false };
    }
    else {
        await prisma_1.prisma.like.create({
            data: {
                postId,
                userId,
            },
        });
        return { liked: true };
    }
}
async function getPostLikeCount(postId) {
    const count = await prisma_1.prisma.like.count({
        where: { postId },
    });
    return { count };
}
async function getUserLikeStatus(postId, userId) {
    const like = await prisma_1.prisma.like.findUnique({
        where: {
            postId_userId: {
                postId,
                userId,
            },
        },
    });
    return { liked: !!like };
}
async function getPostLikes(postId) {
    const [likes, count] = await Promise.all([
        prisma_1.prisma.like.findMany({
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
        prisma_1.prisma.like.count({ where: { postId } }),
    ]);
    return { likes, count };
}
// Related posts function
async function getRelatedPosts(postId, limit = 4) {
    // Get the current post to know its category and tags
    const currentPost = await prisma_1.prisma.blogPost.findUnique({
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
    const relatedPosts = await prisma_1.prisma.blogPost.findMany({
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
async function generateSitemap(baseUrl = 'https://lneducacional.com.br') {
    const posts = await prisma_1.prisma.blogPost.findMany({
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
    const categories = await prisma_1.prisma.category.findMany({
        select: {
            slug: true,
            updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
    const tags = await prisma_1.prisma.tag.findMany({
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
async function generateRssFeed(baseUrl = 'https://lneducacional.com.br') {
    const posts = await prisma_1.prisma.blogPost.findMany({
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
async function searchBlogPosts(query) {
    const where = {};
    // Published filter
    if (query.published !== undefined)
        where.published = query.published;
    // Category filter
    if (query.categoryId)
        where.categoryId = query.categoryId;
    // Author filter
    if (query.authorId)
        where.authorId = query.authorId;
    // Date range filter
    if (query.dateFrom || query.dateTo) {
        where.createdAt = {};
        if (query.dateFrom)
            where.createdAt.gte = query.dateFrom;
        if (query.dateTo)
            where.createdAt.lte = query.dateTo;
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
    let orderBy = { createdAt: 'desc' };
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
        prisma_1.prisma.blogPost.findMany({
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
        prisma_1.prisma.blogPost.count({ where }),
    ]);
    return { posts, total, query };
}
// Enhanced Message Management Functions
async function replyToMessage(messageId, content, adminId) {
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId }
    });
    if (!message) {
        throw new Error('Message not found');
    }
    // Send email reply using email service
    const { emailService } = await Promise.resolve().then(() => __importStar(require('./services/email.service')));
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
    return prisma_1.prisma.message.update({
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
async function deleteMessage(messageId) {
    return prisma_1.prisma.message.delete({
        where: { id: messageId }
    });
}
async function bulkMarkMessagesAsRead(messageIds) {
    return prisma_1.prisma.message.updateMany({
        where: {
            id: { in: messageIds }
        },
        data: {
            status: 'READ'
        }
    });
}
async function getMessageStats() {
    const [statusStats, recentActivity, priorityStats] = await Promise.all([
        // Status statistics
        prisma_1.prisma.message.groupBy({
            by: ['status'],
            _count: true
        }),
        // Recent activity (last 30 days)
        prisma_1.prisma.$queryRaw `
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "Message"
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
        // Priority statistics
        prisma_1.prisma.message.groupBy({
            by: ['priority'],
            _count: true
        })
    ]);
    const totalMessages = await prisma_1.prisma.message.count();
    const unreadCount = await prisma_1.prisma.message.count({
        where: { status: 'UNREAD' }
    });
    const repliedCount = await prisma_1.prisma.message.count({
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
async function getLegalDocuments(filters) {
    const where = {};
    if (filters?.type) {
        where.type = filters.type.toUpperCase();
    }
    if (filters?.active !== undefined) {
        where.active = filters.active;
    }
    const [documents, total] = await Promise.all([
        prisma_1.prisma.legalDocument.findMany({
            where,
            skip: filters?.skip || 0,
            take: filters?.take || 10,
            orderBy: { updatedAt: 'desc' }
        }),
        prisma_1.prisma.legalDocument.count({ where })
    ]);
    return { documents, total };
}
async function getLegalDocumentByType(type) {
    return prisma_1.prisma.legalDocument.findFirst({
        where: {
            type: type.toUpperCase(),
            active: true
        }
    });
}
async function createLegalDocument(data) {
    // Deactivate previous version of the same type
    await prisma_1.prisma.legalDocument.updateMany({
        where: {
            type: data.type.toUpperCase(),
            active: true
        },
        data: { active: false }
    });
    // Create new version
    return prisma_1.prisma.legalDocument.create({
        data: {
            type: data.type.toUpperCase(),
            title: data.title,
            content: data.content,
            version: `v${Date.now()}`,
            publishedBy: data.publishedBy,
            active: true
        }
    });
}
async function updateLegalDocument(id, data) {
    return prisma_1.prisma.legalDocument.update({
        where: { id },
        data
    });
}
async function deleteLegalDocument(id) {
    return prisma_1.prisma.legalDocument.delete({
        where: { id }
    });
}
async function getLegalDocumentVersions(type) {
    return prisma_1.prisma.legalDocument.findMany({
        where: {
            type: type.toUpperCase()
        },
        orderBy: { createdAt: 'desc' }
    });
}
// Message Templates CRUD Functions
async function getMessageTemplates(filters) {
    const where = {};
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
        prisma_1.prisma.messageTemplate.findMany({
            where,
            skip: filters?.skip || 0,
            take: filters?.take || 10,
            orderBy: { updatedAt: 'desc' }
        }),
        prisma_1.prisma.messageTemplate.count({ where })
    ]);
    return { templates, total };
}
async function createMessageTemplate(data) {
    return prisma_1.prisma.messageTemplate.create({
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
async function updateMessageTemplate(id, data) {
    return prisma_1.prisma.messageTemplate.update({
        where: { id },
        data
    });
}
async function deleteMessageTemplate(id) {
    return prisma_1.prisma.messageTemplate.delete({
        where: { id }
    });
}
async function getMessageTemplateById(id) {
    return prisma_1.prisma.messageTemplate.findUnique({
        where: { id }
    });
}
//# sourceMappingURL=admin.js.map