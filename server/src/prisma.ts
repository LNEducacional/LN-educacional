import {
  type AcademicArea,
  type Course,
  type CourseStatus,
  type Ebook,
  type OrderStatus,
  type Paper,
  type PaperType,
  type PaymentMethod,
  type PaymentStatus,
  type Prisma,
  PrismaClient,
} from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getPapers(filters: {
  type?: string;
  area?: string;
  free?: boolean;
  maxPrice?: number;
  maxPages?: number;
  skip?: number;
  take?: number;
}) {
  console.log('\n🔍 [getPapers] START - Received filters:', JSON.stringify(filters, null, 2));

  const where: Prisma.PaperWhereInput = {};

  if (filters.type) {
    where.paperType = filters.type as PaperType;
    console.log('📝 [getPapers] Filter: paperType =', filters.type);
  }
  if (filters.area) {
    where.academicArea = filters.area as AcademicArea;
    console.log('📝 [getPapers] Filter: academicArea =', filters.area);
  }
  if (filters.free !== undefined) {
    where.isFree = filters.free;
    console.log('📝 [getPapers] Filter: isFree =', filters.free);
  }
  if (filters.maxPrice) {
    where.price = { lte: filters.maxPrice };
    console.log('📝 [getPapers] Filter: price <= ', filters.maxPrice);
  }
  if (filters.maxPages) {
    where.pageCount = { lte: filters.maxPages };
    console.log('📝 [getPapers] Filter: pageCount <=', filters.maxPages);
  }

  console.log('🎯 [getPapers] Final WHERE clause:', JSON.stringify(where, null, 2));
  console.log('📊 [getPapers] Query params: skip =', filters.skip || 0, ', take =', filters.take || 20);

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      skip: filters.skip || 0,
      take: filters.take || 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paper.count({ where }),
  ]);

  console.log('✅ [getPapers] Query completed!');
  console.log('📈 [getPapers] Total count:', total);
  console.log('📦 [getPapers] Papers returned:', papers.length);
  if (papers.length > 0) {
    console.log('📄 [getPapers] First paper:', {
      id: papers[0].id,
      title: papers[0].title,
      isFree: papers[0].isFree,
      price: papers[0].price
    });
  } else {
    console.log('⚠️  [getPapers] NO PAPERS FOUND!');
  }
  console.log('✅ [getPapers] END\n');

  return { papers, total };
}

export async function getPaperById(id: string) {
  return prisma.paper.findUnique({
    where: { id },
  });
}

export async function createPaper(data: {
  title: string;
  description: string;
  paperType: string;
  academicArea: string;
  price: number;
  pageCount: number;
  authorName: string;
  language?: string;
  keywords?: string;
  previewUrl?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  isFree?: boolean;
}) {
  return prisma.paper.create({
    data: {
      ...data,
      paperType: data.paperType as PaperType,
      academicArea: data.academicArea as AcademicArea,
    },
  });
}

export async function updatePaper(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    paperType: string;
    academicArea: string;
    price: number;
    pageCount: number;
    authorName: string;
    language: string;
    keywords: string;
    previewUrl: string;
    fileUrl: string;
    thumbnailUrl: string;
    isFree: boolean;
  }>
) {
  const updateData: Prisma.PaperUpdateInput = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'paperType' && value) {
      updateData.paperType = value as PaperType;
    } else if (key === 'academicArea' && value) {
      updateData.academicArea = value as AcademicArea;
    } else if (value !== undefined) {
      (updateData as any)[key] = value;
    }
  });

  return prisma.paper.update({
    where: { id },
    data: updateData,
  });
}

export async function deletePaper(id: string) {
  return prisma.paper.delete({
    where: { id },
  });
}

export async function addPaperToLibrary(userId: string, paperId: string) {
  // Verificar se já existe
  const existing = await prisma.library.findFirst({
    where: {
      userId,
      itemId: paperId,
      itemType: 'PAPER',
    },
  });

  if (existing) {
    return existing;
  }

  // Adicionar à biblioteca
  return prisma.library.create({
    data: {
      userId,
      itemType: 'PAPER',
      itemId: paperId,
      downloadUrl: `https://download.lneducacional.com.br/papers/${paperId}`,
      expiresAt: null, // Papers gratuitos não expiram
    },
  });
}

export async function trackDownload(userId: string, itemId: string, itemType: string) {
  return prisma.downloadTracking.create({
    data: {
      userId,
      itemId,
      itemType,
    },
  });
}

export async function getCourses(filters: {
  area?: string;
  status?: string;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.CourseWhereInput = {};

  if (filters.area) where.academicArea = filters.area as AcademicArea;
  if (filters.status) where.status = filters.status as CourseStatus;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: filters.skip || 0,
      take: filters.take || 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total };
}

export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
  });
}

export async function createCourse(data: {
  title: string;
  description: string;
  academicArea: string;
  instructorName: string;
  instructorBio?: string;
  price: number;
  duration: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  status?: string;
}) {
  return prisma.course.create({
    data: {
      ...data,
      academicArea: data.academicArea.toUpperCase() as AcademicArea,
      status: (data.status?.toUpperCase() || 'ACTIVE') as CourseStatus,
    },
  });
}

export async function updateCourse(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    academicArea: string;
    instructorName: string;
    instructorBio: string;
    price: number;
    duration: number;
    thumbnailUrl: string;
    videoUrl: string;
    status: string;
  }>
) {
  const updateData: Prisma.CourseUpdateInput = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'academicArea' && value) {
      updateData.academicArea = (value as string).toUpperCase() as AcademicArea;
    } else if (key === 'status' && value) {
      updateData.status = (value as string).toUpperCase() as CourseStatus;
    } else if (value !== undefined) {
      (updateData as any)[key] = value;
    }
  });

  return prisma.course.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCourse(id: string) {
  // Delete all related records in a transaction
  return prisma.$transaction(async (tx) => {
    // Delete enrollments
    await tx.courseEnrollment.deleteMany({
      where: { courseId: id },
    });

    // Delete certificates
    await tx.certificate.deleteMany({
      where: { courseId: id },
    });

    // Delete order items
    await tx.orderItem.deleteMany({
      where: { courseId: id },
    });

    // Delete course progress for all lessons in this course's modules
    const modules = await tx.courseModule.findMany({
      where: { courseId: id },
      select: {
        lessons: {
          select: { id: true },
        },
      },
    });

    const lessonIds = modules.flatMap(m => m.lessons.map(l => l.id));
    if (lessonIds.length > 0) {
      await tx.courseProgress.deleteMany({
        where: { lessonId: { in: lessonIds } },
      });
    }

    // Delete modules (and their lessons will be deleted via cascade)
    await tx.courseModule.deleteMany({
      where: { courseId: id },
    });

    // Finally, delete the course
    return tx.course.delete({
      where: { id },
    });
  });
}

export async function getEbooks(filters: { area?: string; skip?: number; take?: number }) {
  const where: Prisma.EbookWhereInput = {};

  if (filters.area) where.academicArea = filters.area as AcademicArea;

  const [ebooks, total] = await Promise.all([
    prisma.ebook.findMany({
      where,
      skip: filters.skip || 0,
      take: filters.take || 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        academicArea: true,
        authorName: true,
        price: true,
        pageCount: true,
        coverUrl: true,
        createdAt: true,
        // Excluir fileUrl da listagem pública por segurança
      },
    }),
    prisma.ebook.count({ where }),
  ]);

  return { ebooks, total };
}

export async function getEbookById(id: string) {
  return prisma.ebook.findUnique({
    where: { id },
  });
}

export async function createEbook(data: {
  title: string;
  description: string;
  academicArea: string;
  authorName: string;
  price: number;
  pageCount: number;
  fileUrl: string;
  coverUrl?: string;
}) {
  const { validateEbookData, sanitizeEbookData, EbookValidationError } = await import(
    './validations/ebook'
  );

  // Sanitize input data
  const sanitizedData = sanitizeEbookData(data);

  // Validate business rules
  validateEbookData(sanitizedData);

  // Check for duplicate title (case-insensitive)
  const existingEbook = await prisma.ebook.findFirst({
    where: {
      title: {
        equals: sanitizedData.title,
        mode: 'insensitive',
      },
    },
  });

  if (existingEbook) {
    throw new EbookValidationError('An ebook with this title already exists', 'title');
  }

  // Check for duplicate file URL
  const existingFileUrl = await prisma.ebook.findFirst({
    where: {
      fileUrl: sanitizedData.fileUrl,
    },
  });

  if (existingFileUrl) {
    throw new EbookValidationError('An ebook with this file URL already exists', 'fileUrl');
  }

  return prisma.ebook.create({
    data: {
      ...sanitizedData,
      academicArea: sanitizedData.academicArea as AcademicArea,
    },
  });
}

export async function updateEbook(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    academicArea: string;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string;
  }>
) {
  const { updateEbookValidationSchema, sanitizeEbookData, EbookValidationError } = await import(
    './validations/ebook'
  );

  // Verify ebook exists
  const existingEbook = await prisma.ebook.findUnique({
    where: { id },
  });

  if (!existingEbook) {
    throw new EbookValidationError('Ebook not found', 'id');
  }

  // Sanitize input data
  const sanitizedData = sanitizeEbookData(data);

  // Validate schema
  const result = updateEbookValidationSchema.safeParse(sanitizedData);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new EbookValidationError(firstError.message, firstError.path[0] as string);
  }

  // Check for duplicate title (case-insensitive) - only if title is being updated
  if (sanitizedData.title && sanitizedData.title !== existingEbook.title) {
    const duplicateTitle = await prisma.ebook.findFirst({
      where: {
        id: { not: id },
        title: {
          equals: sanitizedData.title,
          mode: 'insensitive',
        },
      },
    });

    if (duplicateTitle) {
      throw new EbookValidationError('An ebook with this title already exists', 'title');
    }
  }

  // Check for duplicate file URL - only if fileUrl is being updated
  if (sanitizedData.fileUrl && sanitizedData.fileUrl !== existingEbook.fileUrl) {
    const duplicateFileUrl = await prisma.ebook.findFirst({
      where: {
        id: { not: id },
        fileUrl: sanitizedData.fileUrl,
      },
    });

    if (duplicateFileUrl) {
      throw new EbookValidationError('An ebook with this file URL already exists', 'fileUrl');
    }
  }

  // Apply business validations if relevant fields are being updated
  if (
    sanitizedData.title ||
    sanitizedData.description ||
    sanitizedData.academicArea ||
    sanitizedData.authorName ||
    sanitizedData.price !== undefined ||
    sanitizedData.pageCount !== undefined ||
    sanitizedData.fileUrl ||
    sanitizedData.coverUrl
  ) {
    // Merge with existing data for complete validation
    const completeData = {
      title: sanitizedData.title ?? existingEbook.title,
      description: sanitizedData.description ?? existingEbook.description,
      academicArea: sanitizedData.academicArea ?? existingEbook.academicArea,
      authorName: sanitizedData.authorName ?? existingEbook.authorName,
      price: sanitizedData.price ?? existingEbook.price,
      pageCount: sanitizedData.pageCount ?? existingEbook.pageCount,
      fileUrl: sanitizedData.fileUrl ?? existingEbook.fileUrl,
      coverUrl: sanitizedData.coverUrl ?? existingEbook.coverUrl ?? undefined,
    };

    const { validateEbookData } = await import('./validations/ebook');
    validateEbookData(completeData);
  }

  const updateData: Prisma.EbookUpdateInput = {};
  Object.entries(sanitizedData).forEach(([key, value]) => {
    if (key === 'academicArea' && value) {
      updateData.academicArea = value as AcademicArea;
    } else if (value !== undefined) {
      (updateData as any)[key] = value;
    }
  });

  return prisma.ebook.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteEbook(id: string) {
  return prisma.ebook.delete({
    where: { id },
  });
}

export async function getEbooksByUserId(userId: string) {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        status: 'COMPLETED',
        paymentStatus: 'CONFIRMED',
      },
      ebookId: { not: null },
    },
    select: {
      ebook: {
        select: {
          id: true,
          title: true,
          description: true,
          academicArea: true,
          authorName: true,
          price: true,
          pageCount: true,
          coverUrl: true,
          createdAt: true,
          // Incluir fileUrl para usuários que compraram
          fileUrl: true,
        },
      },
    },
  });

  return orderItems.map((item) => item.ebook).filter(Boolean);
}

export async function hasUserPurchasedEbook(userId: string, ebookId: string): Promise<boolean> {
  // First check if it's a free ebook
  const ebook = await prisma.ebook.findUnique({
    where: { id: ebookId },
    select: { price: true },
  });

  if (!ebook) return false;
  if (ebook.price === 0) return true; // Free ebooks are always accessible

  // Check if user has a confirmed purchase
  const purchase = await prisma.orderItem.findFirst({
    where: {
      ebookId,
      order: {
        userId,
        status: 'COMPLETED',
        paymentStatus: 'CONFIRMED',
      },
    },
    select: {
      id: true, // Apenas o ID é suficiente para verificar existência
    },
  });

  return !!purchase;
}

export async function addEbookToLibrary(userId: string, ebookId: string) {
  // Check if ebook already exists in user's library
  const existingItem = await prisma.library.findFirst({
    where: {
      userId,
      itemType: 'EBOOK',
      itemId: ebookId,
    },
  });

  if (existingItem) {
    return existingItem; // Already in library
  }

  // Get ebook to generate download URL
  const ebook = await prisma.ebook.findUnique({
    where: { id: ebookId },
  });

  if (!ebook) {
    throw new Error('Ebook not found');
  }

  // Add to library
  return prisma.library.create({
    data: {
      userId,
      itemType: 'EBOOK',
      itemId: ebookId,
      downloadUrl: ebook.fileUrl,
      // Free ebooks don't expire, paid ones expire after 1 year
      expiresAt: ebook.price === 0 ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function searchProducts(query: string, type?: 'paper' | 'course' | 'ebook') {
  const searchCondition: any = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
  };

  const results: {
    papers?: Paper[];
    courses?: Course[];
    ebooks?: Ebook[];
  } = {};

  if (!type || type === 'paper') {
    results.papers = await prisma.paper.findMany({
      where: searchCondition,
      take: 10,
    });
  }

  if (!type || type === 'course') {
    results.courses = await prisma.course.findMany({
      where: searchCondition,
      take: 10,
    });
  }

  if (!type || type === 'ebook') {
    results.ebooks = await prisma.ebook.findMany({
      where: searchCondition,
      take: 10,
    });
  }

  return results;
}

export async function createOrder(data: {
  userId?: string;
  items: Array<{
    title: string;
    description?: string;
    price: number;
    paperId?: string;
    courseId?: string;
    ebookId?: string;
  }>;
  totalAmount: number;
  paymentMethod?: string;
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  customerPhone?: string;
}) {
  return prisma.order.create({
    data: {
      userId: data.userId,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod as PaymentMethod,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerCpfCnpj: data.customerCpfCnpj,
      customerPhone: data.customerPhone,
      items: {
        create: data.items.map((item) => ({
          title: item.title,
          description: item.description,
          price: item.price,
          paperId: item.paperId,
          courseId: item.courseId,
          ebookId: item.ebookId,
        })),
      },
    },
    include: {
      items: {
        include: {
          paper: true,
          course: true,
          ebook: true,
        },
      },
    },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          paper: true,
          course: true,
          ebook: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export async function getOrdersByUserId(
  userId: string,
  filters?: {
    status?: string;
    skip?: number;
    take?: number;
  }
) {
  const where: Prisma.OrderWhereInput = { userId };
  if (filters?.status) where.status = filters.status as OrderStatus;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function getAllOrders(filters?: {
  status?: string;
  paymentStatus?: string;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.OrderWhereInput = {};
  if (filters?.status) where.status = filters.status as OrderStatus;
  if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus as PaymentStatus;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({
    where: { id },
    data: {
      status: status as OrderStatus,
      updatedAt: new Date(),
    },
  });
}

export async function updateOrderPaymentStatus(
  id: string,
  paymentStatus: string,
  paymentData?: {
    pixCode?: string;
    boletoUrl?: string;
  }
) {
  return prisma.order.update({
    where: { id },
    data: {
      paymentStatus: paymentStatus as PaymentStatus,
      pixCode: paymentData?.pixCode,
      boletoUrl: paymentData?.boletoUrl,
      updatedAt: new Date(),
    },
  });
}

export async function generatePixCode(orderId: string): Promise<string> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${orderId}52040000530398654${(order.totalAmount / 100).toFixed(2).padStart(10, '0')}5802BR5913LN_EDUCACIONAL6009SAO_PAULO62070503***6304`;

  await updateOrderPaymentStatus(orderId, 'PENDING', { pixCode });
  return pixCode;
}

export async function generateBoletoUrl(orderId: string): Promise<string> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  const boletoUrl = `https://boleto.lneducacional.com.br/${orderId}`;

  await updateOrderPaymentStatus(orderId, 'PENDING', { boletoUrl });
  return boletoUrl;
}

export async function processPaymentWebhook(data: {
  orderId: string;
  status: 'paid' | 'failed' | 'canceled';
  paymentMethod: string;
}) {
  const order = await getOrderById(data.orderId);
  if (!order) throw new Error('Order not found');

  if (data.status === 'paid') {
    const libraryItems = order.items
      .map((item) => {
        const itemId = item.paperId || item.ebookId || item.courseId;
        if (itemId && order.userId) {
          return prisma.library.create({
            data: {
              userId: order.userId,
              itemType: item.paperId ? 'PAPER' : item.ebookId ? 'EBOOK' : 'COURSE_MATERIAL',
              itemId,
              downloadUrl: `https://download.lneducacional.com.br/${itemId}`,
            },
          });
        }
        return null;
      })
      .filter(Boolean);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          updatedAt: new Date(),
        },
      }),
      ...(libraryItems.filter(Boolean) as any),
    ]);

    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: 'COMPLETED',
        paymentStatus: 'CONFIRMED',
      },
    });
  } else if (data.status === 'failed') {
    await updateOrderPaymentStatus(data.orderId, 'FAILED');
    await updateOrderStatus(data.orderId, 'CANCELED');
  } else if (data.status === 'canceled') {
    await updateOrderPaymentStatus(data.orderId, 'CANCELED');
    await updateOrderStatus(data.orderId, 'CANCELED');
  }

  return order;
}

export default prisma;
