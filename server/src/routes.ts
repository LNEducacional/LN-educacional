import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  addPaperToLibrary,
  createEbook,
  createOrder,
  createPaper,
  deleteEbook,
  deletePaper,
  generateBoletoUrl,
  generatePixCode,
  getAllOrders,
  getEbookById,
  getEbooks,
  getOrderById,
  getOrdersByUserId,
  getPaperById,
  getPapers,
  prisma,
  processPaymentWebhook,
  searchProducts,
  trackDownload,
  updateEbook,
  updateOrderPaymentStatus,
  updateOrderStatus,
  updatePaper,
} from './prisma';
import { deleteCachePattern, getCache, setCache } from './redis';
import { uploadFile } from './services/upload.service';
import type { IdParams, PaymentData, SlugParams } from './types/fastify';

// Shared schemas at module scope to avoid TS hoisting issues
const createPaperSchema = z.object({
  title: z.string(),
  description: z.string(),
  paperType: z.string(),
  academicArea: z.string(),
  price: z.number(),
  pageCount: z.number(),
  authorName: z.string(),
  language: z.string().optional(),
  keywords: z.string().optional(),
  previewUrl: z.string().optional(),
  fileUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  isFree: z.boolean().optional(),
});

export async function registerProductRoutes(app: FastifyInstance) {
  // Health check endpoint for monitoring
  app.get('/health', async (_request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      // Check Redis connection (optional)
      let redisStatus = 'unknown';
      try {
        await getCache('health-check');
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'disconnected';
      }

      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'connected',
          type: 'postgresql'
        },
        redis: {
          status: redisStatus
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        uptime: Math.round(process.uptime())
      };

      return reply.code(200).send(healthData);
    } catch (error) {
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Readiness check endpoint
  app.get('/ready', async (_request, reply) => {
    try {
      // More comprehensive checks for readiness
      await prisma.$queryRaw`SELECT 1`;

      return reply.code(200).send({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return reply.code(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Liveness check endpoint
  app.get('/live', async (_request, reply) => {
    return reply.code(200).send({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  });
  const paperQuerySchema = z.object({
    type: z.string().optional(),
    area: z.string().optional(),
    free: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    maxPrice: z.string().transform(Number).optional(),
    maxPages: z.string().transform(Number).optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get('/papers', async (request, reply) => {
    try {
      const query = paperQuerySchema.parse(request.query);

      // Cache key for free papers only
      if (query.free) {
        const cacheKey = `papers:free:${JSON.stringify({
          type: query.type,
          area: query.area,
          maxPrice: query.maxPrice,
          maxPages: query.maxPages,
          skip: query.skip,
          take: query.take,
        })}`;

        // Try to get from cache first
        const cached = await getCache(cacheKey);
        if (cached) {
          reply.send(cached);
          return;
        }

        // Get from database and cache result
        const result = await getPapers({
          type: query.type?.toUpperCase().replace(/-/g, '_'),
          area: query.area?.toUpperCase().replace(/-/g, '_'),
          free: query.free,
          maxPrice: query.maxPrice,
          maxPages: query.maxPages,
          skip: query.skip,
          take: query.take,
        });

        await setCache(cacheKey, result, 300);
        reply.send(result);
      } else {
        // No cache for non-free papers (they change more frequently)
        const result = await getPapers({
          type: query.type?.toUpperCase().replace(/-/g, '_'),
          area: query.area?.toUpperCase().replace(/-/g, '_'),
          free: query.free,
          maxPrice: query.maxPrice,
          maxPages: query.maxPages,
          skip: query.skip,
          take: query.take,
        });
        reply.send(result);
      }
    } catch (error: unknown) {
      console.error('❌ ERROR in GET /papers:', error);
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: IdParams }>('/papers/:id', async (request, reply) => {
    try {
      const paper = await getPaperById(request.params.id);
      if (!paper) {
        reply.status(404).send({ error: 'Paper not found' });
        return;
      }
      reply.send(paper);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: IdParams }>(
    '/papers/:id/download',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const paper = await getPaperById(request.params.id);

        if (!paper) {
          reply.status(404).send({ error: 'Paper not found' });
          return;
        }

        // Verificar se é gratuito
        if (!paper.isFree) {
          reply.status(403).send({ error: 'This paper is not free' });
          return;
        }

        // Adicionar à biblioteca do usuário
        await addPaperToLibrary(request.currentUser!.id, paper.id);

        // Registrar download para analytics
        await trackDownload(request.currentUser!.id, paper.id, 'PAPER');

        // Enhanced download response with proper headers
        reply
          .header('Content-Type', 'application/json')
          .header('Cache-Control', 'private, max-age=300') // Cache for 5 minutes
          .header('X-Download-Type', 'PAPER')
          .header('X-Paper-Id', paper.id)
          .send({
            downloadUrl: paper.fileUrl,
            paper: {
              id: paper.id,
              title: paper.title,
              pageCount: paper.pageCount,
              mimeType: 'application/pdf',
            },
            downloadedAt: new Date().toISOString(),
          });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Add streaming download route with compression
  app.get<{ Params: IdParams }>(
    '/papers/:id/stream',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const paper = await getPaperById(request.params.id);

        if (!paper) {
          reply.status(404).send({ error: 'Paper not found' });
          return;
        }

        // Verificar se é gratuito
        if (!paper.isFree) {
          reply.status(403).send({ error: 'This paper is not free' });
          return;
        }

        // Adicionar à biblioteca do usuário se ainda não estiver
        await addPaperToLibrary(request.currentUser!.id, paper.id);

        // Registrar download para analytics
        await trackDownload(request.currentUser!.id, paper.id, 'PAPER');

        // For external URLs, redirect with streaming optimizations
        if (paper.fileUrl.startsWith('http')) {
          // Set headers for optimized streaming
          reply
            .header('Content-Type', 'application/pdf')
            .header(
              'Content-Disposition',
              `attachment; filename="${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
            )
            .header('Cache-Control', 'private, max-age=3600') // Cache for 1 hour
            .header('X-Accel-Buffering', 'no') // Disable nginx buffering for streaming
            .header('X-Content-Type-Options', 'nosniff')
            .header('Accept-Ranges', 'bytes') // Enable range requests
            .header('X-Download-Type', 'STREAM')
            .header('X-Paper-Id', paper.id)
            .status(302)
            .header('Location', paper.fileUrl)
            .send();
          return;
        }

        // For local files, implement proper streaming (if needed in future)
        reply.status(501).send({ error: 'Local file streaming not implemented yet' });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // createPaperSchema declared at module scope


  // COMMENTED OUT: Duplicate route - handled by enhanced courses routes
  // Course routes are now handled in ./routes/courses.ts

  // COMMENTED OUT: Duplicate route - handled by enhanced courses routes
  // app.get<{ Params: IdParams }>('/courses/:id', async (request, reply) => {
  //   try {
  //     const course = await getCourseById(request.params.id);
  //     if (!course) {
  //       reply.status(404).send({ error: 'Course not found' });
  //       return;
  //     }
  //     reply.send(course);
  //   } catch (error: unknown) {
  //     reply.status(400).send({ error: (error as Error).message });
  //   }
  // });

  // COMMENTED OUT: Admin course routes - handled by enhanced courses routes
  // Admin course routes are now handled in ./routes/courses.ts

  const ebookQuerySchema = z.object({
    area: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get('/ebooks', async (request, reply) => {
    try {
      const query = ebookQuerySchema.parse(request.query);

      // Criar chave de cache baseada nos parâmetros de consulta
      const cacheKey = `ebooks:list:${JSON.stringify({
        area: query.area?.toUpperCase().replace(/-/g, '_'),
        skip: query.skip || 0,
        take: query.take || 20,
      })}`;

      // Tentar buscar do cache primeiro
      const { getCache, setCache } = await import('./redis');
      const cachedResult = await getCache(cacheKey);

      if (cachedResult) {
        reply.send(cachedResult);
        return;
      }

      // Se não estiver no cache, buscar do banco
      const result = await getEbooks({
        area: query.area?.toUpperCase().replace(/-/g, '_'),
        skip: query.skip,
        take: query.take,
      });

      // Armazenar no cache por 5 minutos
      await setCache(cacheKey, result, 300);

      reply.send(result);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: IdParams }>('/ebooks/:id', async (request, reply) => {
    try {
      const ebookId = request.params.id;
      const cacheKey = `ebook:${ebookId}`;

      // Tentar buscar do cache primeiro
      const { getCache, setCache } = await import('./redis');
      const cachedEbook = await getCache(cacheKey);

      if (cachedEbook) {
        reply.send(cachedEbook);
        return;
      }

      // Se não estiver no cache, buscar do banco
      const ebook = await getEbookById(ebookId);
      if (!ebook) {
        reply.status(404).send({ error: 'Ebook not found' });
        return;
      }

      // Armazenar no cache por 10 minutos
      await setCache(cacheKey, ebook, 600);

      reply.send(ebook);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: IdParams }>(
    '/ebooks/:id/download',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const ebook = await getEbookById(request.params.id);

        if (!ebook) {
          reply.status(404).send({ error: 'Ebook not found' });
          return;
        }

        // Verificar se o usuário comprou o e-book (gratuito ou através de pedido)
        const { hasUserPurchasedEbook } = await import('./prisma');
        const hasPurchased = await hasUserPurchasedEbook(request.currentUser!.id, ebook.id);

        if (!hasPurchased && ebook.price > 0) {
          reply.status(403).send({ error: 'You need to purchase this ebook first' });
          return;
        }

        // Adicionar à biblioteca do usuário
        const { addEbookToLibrary } = await import('./prisma');
        await addEbookToLibrary(request.currentUser!.id, ebook.id);

        // Registrar download para analytics
        await trackDownload(request.currentUser!.id, ebook.id, 'EBOOK');

        // Enhanced download response with proper headers
        reply
          .header('Content-Type', 'application/json')
          .header('Cache-Control', 'private, max-age=300') // Cache for 5 minutes
          .header('X-Download-Type', 'EBOOK')
          .header('X-Ebook-Id', ebook.id)
          .send({
            downloadUrl: ebook.fileUrl,
            ebook: {
              id: ebook.id,
              title: ebook.title,
              pageCount: ebook.pageCount,
              authorName: ebook.authorName,
              mimeType: 'application/pdf',
            },
            downloadedAt: new Date().toISOString(),
          });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createEbookSchema = z.object({
    title: z.string(),
    description: z.string(),
    academicArea: z.string(),
    authorName: z.string(),
    price: z.number(),
    pageCount: z.number(),
    fileUrl: z.string(),
    coverUrl: z.string().optional(),
  });

  // Get all ebooks (Admin)
  app.get(
    '/admin/ebooks',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const query = request.query as any;

      const where: any = {};

      if (query.search) {
        where.title = {
          contains: query.search,
          mode: 'insensitive',
        };
      }

      if (query.area && query.area !== 'all') {
        where.academicArea = query.area.toUpperCase();
      }

      const ebooks = await prisma.ebook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      reply.send(ebooks);
    }
  );

  // Get single ebook (Admin)
  app.get<{ Params: IdParams }>(
    '/admin/ebooks/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const ebook = await prisma.ebook.findUnique({
        where: { id: request.params.id },
      });

      if (!ebook) {
        return reply.status(404).send({ error: 'Ebook not found' });
      }

      reply.send(ebook);
    }
  );

  app.post(
    '/admin/ebooks',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createEbookSchema.parse(request.body);
        const ebook = await createEbook({
          ...data,
          academicArea: data.academicArea.toUpperCase().replace(/-/g, '_'),
        });

        // Invalidar cache de listagem de e-books após criação
        const { deleteCachePattern } = await import('./redis');
        await deleteCachePattern('ebooks:list:*');

        reply.status(201).send(ebook);
      } catch (error: unknown) {
        // Handle validation errors specifically
        if (error instanceof Error && error.name === 'EbookValidationError') {
          reply.status(422).send({
            error: error.message,
            field: (error as any).field,
            type: 'validation_error',
          });
          return;
        }

        // Handle Zod validation errors
        if (error instanceof Error && error.name === 'ZodError') {
          reply.status(400).send({
            error: 'Invalid input data',
            details: error.message,
            type: 'schema_error',
          });
          return;
        }

        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/ebooks/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createEbookSchema.partial().parse(request.body);
        const ebook = await updateEbook(request.params.id, {
          ...data,
          academicArea: data.academicArea?.toUpperCase().replace(/-/g, '_'),
        });

        // Invalidar cache do e-book específico e listagem após atualização
        const { deleteCache, deleteCachePattern } = await import('./redis');
        await deleteCache(`ebook:${request.params.id}`);
        await deleteCachePattern('ebooks:list:*');

        reply.send(ebook);
      } catch (error: unknown) {
        // Handle validation errors specifically
        if (error instanceof Error && error.name === 'EbookValidationError') {
          reply.status(422).send({
            error: error.message,
            field: (error as any).field,
            type: 'validation_error',
          });
          return;
        }

        // Handle Zod validation errors
        if (error instanceof Error && error.name === 'ZodError') {
          reply.status(400).send({
            error: 'Invalid input data',
            details: error.message,
            type: 'schema_error',
          });
          return;
        }

        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/ebooks/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteEbook(request.params.id);

        // Invalidar cache do e-book específico e listagem após deleção
        const { deleteCache, deleteCachePattern } = await import('./redis');
        await deleteCache(`ebook:${request.params.id}`);
        await deleteCachePattern('ebooks:list:*');

        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const searchSchema = z.object({
    q: z.string().min(2),
    type: z.enum(['paper', 'course', 'ebook']).optional(),
  });

  app.get('/search', async (request, reply) => {
    try {
      const query = searchSchema.parse(request.query);
      const results = await searchProducts(query.q, query.type);
      reply.send(results);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });
}

export async function registerOrderRoutes(app: FastifyInstance) {
  const checkoutSchema = z.object({
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        price: z.number(),
        type: z.enum(['paper', 'course', 'ebook']),
      })
    ),
    customer: z.object({
      name: z.string(),
      email: z.string().email(),
      cpfCnpj: z.string(),
      phone: z.string().optional(),
    }),
    paymentMethod: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD']),
  });

  app.post('/checkout', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const data = checkoutSchema.parse(request.body);

      const orderItems = data.items.map((item) => ({
        title: item.title,
        description: item.description,
        price: item.price,
        paperId: item.type === 'paper' ? item.id : undefined,
        courseId: item.type === 'course' ? item.id : undefined,
        ebookId: item.type === 'ebook' ? item.id : undefined,
      }));

      const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);

      const order = await createOrder({
        userId: request.currentUser!.id,
        items: orderItems,
        totalAmount,
        paymentMethod: data.paymentMethod,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        customerCpfCnpj: data.customer.cpfCnpj,
        customerPhone: data.customer.phone,
      });

      const paymentData: PaymentData = { orderId: order.id };

      if (data.paymentMethod === 'PIX') {
        paymentData.pixCode = await generatePixCode(order.id);
        paymentData.paymentMethod = 'PIX';
      } else if (data.paymentMethod === 'BOLETO') {
        paymentData.boletoUrl = await generateBoletoUrl(order.id);
        paymentData.paymentMethod = 'BOLETO';
      } else {
        paymentData.paymentMethod = data.paymentMethod;
        paymentData.redirectUrl = `https://payment.lneducacional.com.br/process/${order.id}`;
      }

      reply.status(201).send({
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items,
        },
        payment: paymentData,
      });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: IdParams }>(
    '/orders/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const order = await getOrderById(request.params.id);

        if (!order) {
          reply.status(404).send({ error: 'Order not found' });
          return;
        }

        if (order.userId !== request.currentUser!.id && request.currentUser!.role !== 'ADMIN') {
          reply.status(403).send({ error: 'Forbidden' });
          return;
        }

        reply.send(order);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const webhookSchema = z.object({
    orderId: z.string(),
    status: z.enum(['paid', 'failed', 'canceled']),
    paymentMethod: z.string(),
    timestamp: z.string().optional(),
    signature: z.string().optional(),
  });

  app.post('/webhooks/payment', async (request, reply) => {
    try {
      const data = webhookSchema.parse(request.body);

      const order = await processPaymentWebhook({
        orderId: data.orderId,
        status: data.status,
        paymentMethod: data.paymentMethod,
      });

      reply.send({ success: true, orderId: order.id });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  const orderQuerySchema = z.object({
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get('/student/orders', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = orderQuerySchema.parse(request.query);

      const result = await getOrdersByUserId(request.currentUser!.id, {
        status: query.status?.toUpperCase(),
        skip: query.skip,
        take: query.take,
      });

      reply.send(result);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get(
    '/admin/orders',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = orderQuerySchema.parse(request.query);

        const result = await getAllOrders({
          status: query.status?.toUpperCase(),
          paymentStatus: query.paymentStatus?.toUpperCase(),
          skip: query.skip,
          take: query.take,
        });

        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/orders/:id/status',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const statusSchema = z.object({
          status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED']),
        });

        const data = statusSchema.parse(request.body);
        const order = await updateOrderStatus(request.params.id, data.status);

        reply.send(order);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/orders/:id/payment-status',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const paymentStatusSchema = z.object({
          paymentStatus: z.enum([
            'PENDING',
            'PROCESSING',
            'PAID',
            'CONFIRMED',
            'OVERDUE',
            'REFUNDED',
            'FAILED',
            'CANCELED',
          ]),
        });

        const data = paymentStatusSchema.parse(request.body);
        const order = await updateOrderPaymentStatus(request.params.id, data.paymentStatus);

        reply.send(order);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );
}

export async function registerStudentRoutes(app: FastifyInstance) {
  const {
    getStudentDashboard,
    getStudentCourses,
    getStudentLibrary,
    getStudentCertificates,
    generateCertificateQRCode,
    completeCourse,
    getStudentProfile,
    updateStudentProfile,
    verifyCertificate,
  } = await import('./student');

  app.get('/student/dashboard', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const dashboard = await getStudentDashboard(request.currentUser!.id);
      reply.send(dashboard);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get('/student/courses', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const courses = await getStudentCourses(request.currentUser!.id);
      reply.send({ courses });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get('/student/library', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const library = await getStudentLibrary(request.currentUser!.id);
      reply.send({ items: library });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get(
    '/student/purchases/ebooks',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const { getEbooksByUserId } = await import('./prisma');
        const ebooks = await getEbooksByUserId(request.currentUser!.id);
        reply.send({ ebooks });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get('/student/certificates', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const certificates = await getStudentCertificates(request.currentUser!.id);
      reply.send({ certificates });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: IdParams }>(
    '/student/certificates/:id/qr',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const certificate = await prisma.certificate.findUnique({
          where: { id: request.params.id },
        });

        if (!certificate) {
          reply.status(404).send({ error: 'Certificate not found' });
          return;
        }

        if (certificate.userId !== request.currentUser!.id) {
          reply.status(403).send({ error: 'Forbidden' });
          return;
        }

        let qrCodeUrl = certificate.qrCodeUrl;

        if (!qrCodeUrl) {
          qrCodeUrl = await generateCertificateQRCode(certificate.id);
        }

        reply.send({ qrCodeUrl });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const completeCourseSchema = z.object({
    grade: z.number().min(0).max(100),
  });

  app.post<{ Params: IdParams }>(
    '/student/courses/:id/complete',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const data = completeCourseSchema.parse(request.body);
        const certificate = await completeCourse(
          request.currentUser!.id,
          request.params.id,
          data.grade
        );
        reply.status(201).send({ certificate });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get('/student/profile', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const profile = await getStudentProfile(request.currentUser!.id);
      reply.send(profile);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  const updateProfileSchema = z
    .object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8).optional(),
    })
    .refine(
      (data) => {
        if (data.newPassword && !data.currentPassword) {
          return false;
        }
        return true;
      },
      {
        message: 'Current password is required to change password',
      }
    );

  app.put('/student/profile', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const data = updateProfileSchema.parse(request.body);
      const profile = await updateStudentProfile(request.currentUser!.id, data);
      reply.send(profile);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: { number: string } }>(
    '/certificates/verify/:number',
    async (request, reply) => {
      try {
        const result = await verifyCertificate(request.params.number);
        reply.send(result);
      } catch (_error: unknown) {
        reply.status(404).send({ error: 'Certificate not found', valid: false });
      }
    }
  );
}

export async function registerAdminRoutes(app: FastifyInstance) {
  const {
    getAdminDashboardStats,
    getAllUsers,
    getUserById,
    updateUser,
    updateUserRole,
    deleteUser,
    getBlogPosts,
    getBlogPostBySlug,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    getMessages,
    createMessage,
    updateMessageStatus,
    // Enhanced message functions
    replyToMessage,
    deleteMessage,
    bulkMarkMessagesAsRead,
    getMessageStats,
    // Legal documents functions
    getLegalDocuments,
    getLegalDocumentByType,
    createLegalDocument,
    updateLegalDocument,
    deleteLegalDocument,
    getLegalDocumentVersions,
    // Message templates functions
    getMessageTemplates,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    getMessageTemplateById,
    getCollaboratorApplications,
    applyAsCollaborator,
    updateCollaboratorStatus,
    getAnalytics,
    getEbookAnalytics,
    getEbookDownloadsByPeriod,
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag,
    getComments,
    getCommentsByPostId,
    createComment,
    updateComment,
    deleteComment,
    approveComment,
    toggleLike,
    getPostLikeCount,
    getUserLikeStatus,
    getPostLikes,
    getRelatedPosts,
    generateSitemap,
    generateRssFeed,
    searchBlogPosts,
  } = await import('./admin');

  app.get(
    '/admin/dashboard/stats',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (_request, reply) => {
      try {
        const stats = await getAdminDashboardStats();
        reply.send(stats);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const usersQuerySchema = z.object({
    role: z.string().optional(),
    verified: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/users',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = usersQuerySchema.parse(request.query);
        const result = await getAllUsers({
          role: query.role?.toUpperCase(),
          verified: query.verified,
          search: query.search,
          skip: query.skip,
          take: query.take,
        });
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const updateRoleSchema = z.object({
    role: z.enum(['ADMIN', 'STUDENT', 'COLLABORATOR']),
  });

  app.get<{ Params: IdParams }>(
    '/admin/users/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const user = await getUserById(request.params.id);
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }
        reply.send(user);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const updateUserSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(['ADMIN', 'STUDENT', 'COLLABORATOR']).optional(),
  });

  app.put<{ Params: IdParams }>(
    '/admin/users/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = updateUserSchema.parse(request.body);
        const user = await updateUser(request.params.id, data);
        reply.send(user);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/users/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteUser(request.params.id);
        reply.status(204).send();
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/users/:id/role',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = updateRoleSchema.parse(request.body);
        const user = await updateUserRole(request.params.id, data.role);
        reply.send(user);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const blogQuerySchema = z.object({
    published: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    tagIds: z.string().optional().transform((val) => val ? val.split(',') : undefined),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/blog',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = blogQuerySchema.parse(request.query);
        const result = await getBlogPosts(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createBlogSchema = z.object({
    title: z.string(),
    content: z.string(),
    excerpt: z.string().optional(),
    coverImageUrl: z.string().optional(),
    published: z.boolean().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
    scheduledAt: z.string().transform((val) => val ? new Date(val) : undefined).optional(),
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
  });

  app.post(
    '/admin/blog',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createBlogSchema.parse(request.body);
        const post = await createBlogPost({
          ...data,
          authorId: request.currentUser!.id,
        });
        reply.status(201).send(post);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Upload image for blog
  app.post(
    '/admin/blog/upload-image',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate image file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            error: 'Invalid file type. Only JPEG, PNG and WebP are allowed.'
          });
        }

        // Validate file size (5MB max)
        const buffer = await data.toBuffer();
        if (buffer.length > 5 * 1024 * 1024) {
          return reply.status(400).send({
            error: 'File too large. Maximum size is 5MB.'
          });
        }

        const uploaded = await uploadFile(data, 'blog-images');
        reply.send({
          url: uploaded.url,
          size: uploaded.size,
          mimetype: uploaded.mimetype
        });
      } catch (error: unknown) {
        reply.status(500).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/blog/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createBlogSchema.partial().parse(request.body);
        const post = await updateBlogPost(request.params.id, data);
        reply.send(post);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/blog/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteBlogPost(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: IdParams }>(
    '/admin/blog/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: request.params.id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            category: true,
            tags: {
              include: {
                tag: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        });

        if (!post) {
          return reply.status(404).send({ error: 'Post not found' });
        }

        reply.send(post);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.patch<{ Params: IdParams }>(
    '/admin/blog/:id/publish',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: request.params.id },
        });

        if (!post) {
          return reply.status(404).send({ error: 'Post not found' });
        }

        const updatedPost = await prisma.blogPost.update({
          where: { id: request.params.id },
          data: {
            published: !post.published,
            publishedAt: !post.published ? new Date() : null,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        reply.send(updatedPost);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get('/blog', async (request, reply) => {
    try {
      const query = blogQuerySchema.parse(request.query);
      const result = await getBlogPosts({ ...query, published: true });
      reply.send(result);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get<{ Params: SlugParams }>('/blog/:slug', async (request, reply) => {
    try {
      const post = await getBlogPostBySlug(request.params.slug);
      if (!post) {
        reply.status(404).send({ error: 'Post not found' });
        return;
      }
      reply.send(post);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Advanced search endpoint for blog posts
  const advancedSearchSchema = z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    tagIds: z.string().optional().transform((val) => val ? val.split(',') : undefined),
    dateFrom: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    dateTo: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    authorId: z.string().optional(),
    published: z.string().optional().transform((val) => val === 'true'),
    sortBy: z.enum(['date', 'popularity', 'relevance', 'views']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get('/blog/search', async (request, reply) => {
    try {
      const query = advancedSearchSchema.parse(request.query);
      const result = await searchBlogPosts({
        ...query,
        tags: query.tagIds,
        published: query.published !== undefined ? query.published : true, // Default to published for public endpoint
      });
      reply.send(result);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get('/admin/blog/search',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = advancedSearchSchema.parse(request.query);
        const result = await searchBlogPosts({
          ...query,
          tags: query.tagIds,
        });
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const contactSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
    message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
    website: z.string().optional(), // Honeypot field
    acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
    captchaToken: z.string().optional(),
  });

  app.post('/contact', async (request, reply) => {
    try {
      // Import services
      const { antiSpamService } = await import('./services/anti-spam.service.js');
      const { notificationService } = await import('./services/notification.service.js');
      const { autoReplyService } = await import('./services/auto-reply.service.js');

      // Get client IP and user agent
      const clientIP = request.ip ||
                      request.headers['x-forwarded-for'] as string ||
                      request.headers['x-real-ip'] as string ||
                      request.socket.remoteAddress ||
                      '127.0.0.1';

      const userAgent = request.headers['user-agent'] || '';

      // Parse and validate input data
      const data = contactSchema.parse(request.body);

      // Anti-spam check
      const spamCheck = await antiSpamService.checkMessage({
        ip: clientIP,
        email: data.email,
        name: data.name,
        message: data.message,
        subject: data.subject,
        honeypot: data.website, // Honeypot field
        userAgent,
      });

      // Handle spam detection
      if (spamCheck.isSpam) {
        console.log(`Spam detected from IP ${clientIP}:`, spamCheck.reasons);

        if (spamCheck.action === 'block') {
          return reply.status(429).send({
            error: 'Request blocked due to suspicious activity',
            retryAfter: 3600 // 1 hour
          });
        }

        if (spamCheck.action === 'challenge') {
          return reply.status(400).send({
            error: 'Please complete the security verification',
            requiresCaptcha: true
          });
        }
      }

      // Create message in database
      const messageData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        metadata: {
          ip: clientIP,
          userAgent,
          spamScore: spamCheck.confidence,
          timestamp: new Date().toISOString(),
        }
      };

      const message = await createMessage(messageData);

      // Send notifications (non-blocking)
      notificationService.notifyNewMessage(message).catch(error => {
        console.error('Failed to send notifications:', error);
      });

      // Send auto-reply (non-blocking)
      autoReplyService.processAutoReply({
        id: message.id,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        phone: data.phone,
      }).catch(error => {
        console.error('Failed to send auto-reply:', error);
      });

      reply.status(201).send({
        success: true,
        messageId: message.id,
        message: 'Mensagem enviada com sucesso! Retornaremos o contato em breve.'
      });

    } catch (error: unknown) {
      console.error('Contact form error:', error);

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Dados inválidos',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }

      reply.status(500).send({
        error: 'Erro interno do servidor. Tente novamente.'
      });
    }
  });

  const messagesQuerySchema = z.object({
    status: z.string().optional(),
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/messages',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = messagesQuerySchema.parse(request.query);
        const result = await getMessages({
          status: query.status?.toUpperCase(),
          search: query.search,
          skip: query.skip,
          take: query.take,
        });
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const messageStatusSchema = z.object({
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']),
  });

  app.put<{ Params: IdParams }>(
    '/admin/messages/:id/status',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = messageStatusSchema.parse(request.body);
        const message = await updateMessageStatus(request.params.id, data.status);
        reply.send(message);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Enhanced message endpoints

  // Reply to message
  const replyMessageSchema = z.object({
    content: z.string().min(10, 'Reply content must be at least 10 characters'),
    templateId: z.string().optional(),
  });

  app.post<{ Params: IdParams }>(
    '/admin/messages/:id/reply',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = replyMessageSchema.parse(request.body);
        const message = await replyToMessage(
          request.params.id,
          data.content,
          request.currentUser!.id
        );
        reply.send({ success: true, message });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Delete message
  app.delete<{ Params: IdParams }>(
    '/admin/messages/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteMessage(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Bulk mark messages as read
  const bulkReadSchema = z.object({
    messageIds: z.array(z.string()).min(1, 'At least one message ID is required'),
  });

  app.patch(
    '/admin/messages/bulk-read',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = bulkReadSchema.parse(request.body);
        const result = await bulkMarkMessagesAsRead(data.messageIds);
        reply.send({ success: true, updated: result.count });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Get message statistics
  app.get(
    '/admin/messages/stats',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (_request, reply) => {
      try {
        const stats = await getMessageStats();
        reply.send(stats);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Legal Documents endpoints

  // Get legal document by type (public endpoint)
  app.get<{ Params: { type: string } }>(
    '/legal/:type',
    async (request, reply) => {
      try {
        const document = await getLegalDocumentByType(request.params.type);
        if (!document) {
          reply.status(404).send({ error: 'Document not found' });
          return;
        }
        reply.send(document);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Admin legal documents CRUD
  const legalDocumentQuerySchema = z.object({
    type: z.string().optional(),
    active: z.string().transform((val) => val === 'true').optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/legal',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = legalDocumentQuerySchema.parse(request.query);
        const result = await getLegalDocuments({
          type: query.type,
          active: query.active,
          skip: query.skip,
          take: query.take,
        });
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createLegalDocumentSchema = z.object({
    type: z.enum(['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COOKIES_POLICY', 'LGPD_COMPLIANCE']),
    title: z.string().min(1),
    content: z.string().min(10),
  });

  app.post(
    '/admin/legal',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createLegalDocumentSchema.parse(request.body);
        const document = await createLegalDocument({
          ...data,
          publishedBy: request.currentUser!.id,
        });
        reply.status(201).send(document);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const updateLegalDocumentSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(10).optional(),
    active: z.boolean().optional(),
  });

  app.put<{ Params: IdParams }>(
    '/admin/legal/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = updateLegalDocumentSchema.parse(request.body);
        const document = await updateLegalDocument(request.params.id, data);
        reply.send(document);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/legal/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteLegalDocument(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Get document versions history
  app.get<{ Params: { type: string } }>(
    '/admin/legal/:type/versions',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const versions = await getLegalDocumentVersions(request.params.type);
        reply.send({ versions });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Message Templates endpoints
  const messageTemplateQuerySchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/message-templates',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = messageTemplateQuerySchema.parse(request.query);
        const result = await getMessageTemplates(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createMessageTemplateSchema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    content: z.string().min(10),
    variables: z.array(z.string()).optional(),
    category: z.string().optional(),
  });

  app.post(
    '/admin/message-templates',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createMessageTemplateSchema.parse(request.body);
        const template = await createMessageTemplate({
          ...data,
          createdBy: request.currentUser!.id,
        });
        reply.status(201).send(template);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: IdParams }>(
    '/admin/message-templates/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const template = await getMessageTemplateById(request.params.id);
        if (!template) {
          reply.status(404).send({ error: 'Template not found' });
          return;
        }
        reply.send(template);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const updateMessageTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    content: z.string().min(10).optional(),
    variables: z.array(z.string()).optional(),
    category: z.string().optional(),
  });

  app.put<{ Params: IdParams }>(
    '/admin/message-templates/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = updateMessageTemplateSchema.parse(request.body);
        const template = await updateMessageTemplate(request.params.id, data);
        reply.send(template);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/message-templates/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteMessageTemplate(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const collaboratorApplicationSchema = z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    area: z.string(),
    experience: z.string(),
    availability: z.string(),
    resumeUrl: z.string().optional(),
  });

  app.post('/collaborator/apply', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const data = collaboratorApplicationSchema.parse(request.body);
      const application = await applyAsCollaborator(request.currentUser!.id, data);
      reply.status(201).send(application);
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  const collaboratorsQuerySchema = z.object({
    status: z.string().optional(),
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/collaborators',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = collaboratorsQuerySchema.parse(request.query);
        const result = await getCollaboratorApplications({
          status: query.status?.toUpperCase(),
          search: query.search,
          skip: query.skip,
          take: query.take,
        });
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const collaboratorStatusSchema = z.object({
    status: z.enum(['PENDING', 'INTERVIEWING', 'APPROVED', 'REJECTED']),
  });

  app.put<{ Params: IdParams }>(
    '/admin/collaborators/:id/status',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = collaboratorStatusSchema.parse(request.body);
        const application = await updateCollaboratorStatus(request.params.id, data.status);
        reply.send(application);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Novos endpoints de colaborador

  // Upload de documentos
  app.post('/collaborator/upload',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            error: 'Invalid file type. Only PDF and DOC files are allowed.'
          });
        }

        // Validate file size (10MB max)
        const buffer = await data.toBuffer();
        if (buffer.length > 10 * 1024 * 1024) {
          return reply.status(400).send({
            error: 'File too large. Maximum size is 10MB.'
          });
        }

        const uploaded = await uploadFile(data, 'collaborator-docs');
        reply.send({
          url: uploaded.url,
          size: uploaded.size,
          mimetype: uploaded.mimetype
        });
      } catch (error: unknown) {
        reply.status(500).send({ error: (error as Error).message });
      }
    }
  );

  // Verificar status da aplicação (público)
  app.get<{ Params: IdParams; Querystring: { email: string } }>(
    '/collaborator/application/status/:id',
    async (request, reply) => {
      try {
        const { email } = request.query;
        const application = await prisma.collaboratorApplication.findFirst({
          where: { id: request.params.id, email },
          select: { status: true, stage: true, createdAt: true }
        });

        if (!application) {
          return reply.status(404).send({ error: 'Application not found' });
        }

        reply.send(application);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Portal do Colaborador - Perfil
  app.get('/collaborator/profile',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const application = await prisma.collaboratorApplication.findUnique({
          where: { userId: request.currentUser!.id },
          include: {
            evaluations: {
              select: {
                totalScore: true,
                recommendation: true,
                createdAt: true
              }
            },
            interviews: {
              orderBy: { scheduledAt: 'desc' },
              take: 5
            }
          }
        });

        if (!application) {
          return reply.status(404).send({ error: 'Application not found' });
        }

        reply.send(application);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Endpoints administrativos avançados

  // Dashboard Analytics
  app.get('/admin/collaborators/analytics',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (_request, reply) => {
      try {
        const [
          totalApplications,
          applicationsByStatus,
          applicationsByStage,
          recentApplications
        ] = await Promise.all([
          prisma.collaboratorApplication.count(),
          prisma.collaboratorApplication.groupBy({
            by: ['status'],
            _count: true
          }),
          prisma.collaboratorApplication.groupBy({
            by: ['stage'],
            _count: true
          }),
          prisma.collaboratorApplication.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
          })
        ]);

        reply.send({
          totalApplications,
          applicationsByStatus,
          applicationsByStage,
          recentApplications
        });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Avaliação de Candidato
  const evaluationSchema = z.object({
    experienceScore: z.number().min(0).max(10),
    skillsScore: z.number().min(0).max(10),
    educationScore: z.number().min(0).max(10),
    culturalFitScore: z.number().min(0).max(10),
    recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE', 'STRONG_NO_HIRE']),
    comments: z.string()
  });

  app.post<{ Params: IdParams }>(
    '/admin/collaborators/:id/evaluate',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = evaluationSchema.parse(request.body);
        const totalScore = Math.round(
          (data.experienceScore + data.skillsScore + data.educationScore + data.culturalFitScore) / 4
        );

        const evaluation = await prisma.evaluation.create({
          data: {
            applicationId: request.params.id,
            evaluatorId: request.currentUser!.id,
            totalScore,
            ...data
          }
        });

        // Atualizar score médio na aplicação
        const avgScore = await prisma.evaluation.aggregate({
          where: { applicationId: request.params.id },
          _avg: { totalScore: true }
        });

        await prisma.collaboratorApplication.update({
          where: { id: request.params.id },
          data: { score: Math.round(avgScore._avg.totalScore || 0) }
        });

        reply.send(evaluation);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Agendar Entrevista
  const interviewSchema = z.object({
    scheduledAt: z.string().datetime(),
    duration: z.number().min(15).max(180),
    type: z.enum(['PHONE_SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'FINAL']),
    location: z.string().optional(),
    meetingUrl: z.string().url().optional(),
    interviewerId: z.string()
  });

  app.post<{ Params: IdParams }>(
    '/admin/collaborators/:id/interview',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = interviewSchema.parse(request.body);

        const interview = await prisma.interview.create({
          data: {
            applicationId: request.params.id,
            scheduledAt: new Date(data.scheduledAt),
            duration: data.duration,
            type: data.type,
            location: data.location,
            meetingUrl: data.meetingUrl,
            interviewerId: data.interviewerId
          }
        });

        // Atualizar stage da aplicação
        await prisma.collaboratorApplication.update({
          where: { id: request.params.id },
          data: { stage: 'INTERVIEW' }
        });

        reply.send(interview);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Bulk Actions
  const bulkSchema = z.object({
    ids: z.array(z.string()),
    action: z.enum(['UPDATE_STATUS', 'UPDATE_STAGE', 'DELETE']),
    payload: z.any()
  });

  app.post('/admin/collaborators/bulk',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const { ids, action, payload } = bulkSchema.parse(request.body);

        let affectedCount = 0;

        switch (action) {
          case 'UPDATE_STATUS':
            const statusResult = await prisma.collaboratorApplication.updateMany({
              where: { id: { in: ids } },
              data: { status: payload.status }
            });
            affectedCount = statusResult.count;
            break;
          case 'UPDATE_STAGE':
            const stageResult = await prisma.collaboratorApplication.updateMany({
              where: { id: { in: ids } },
              data: { stage: payload.stage }
            });
            affectedCount = stageResult.count;
            break;
          case 'DELETE':
            const deleteResult = await prisma.collaboratorApplication.deleteMany({
              where: { id: { in: ids } }
            });
            affectedCount = deleteResult.count;
            break;
        }

        reply.send({ success: true, affectedCount });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const analyticsSchema = z.object({
    period: z.enum(['7d', '30d', '90d', 'day', 'week', 'month', 'year']).optional(),
  });

  app.get(
    '/admin/analytics',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = analyticsSchema.parse(request.query);
        const analytics = await getAnalytics(query.period);
        reply.send(analytics);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const downloadAnalyticsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    itemType: z.string().optional(),
    academicArea: z.string().optional(),
  });

  app.get(
    '/admin/analytics/downloads',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = downloadAnalyticsSchema.parse(request.query);
        const filters = {
          ...(query.startDate && { startDate: new Date(query.startDate) }),
          ...(query.endDate && { endDate: new Date(query.endDate) }),
          ...(query.itemType && { itemType: query.itemType }),
          ...(query.academicArea && { academicArea: query.academicArea }),
        };

        const { getDownloadAnalytics } = await import('./admin');
        const analytics = await getDownloadAnalytics(filters);
        reply.send(analytics);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const ebookAnalyticsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    academicArea: z.string().optional(),
  });

  app.get(
    '/admin/analytics/ebooks',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = ebookAnalyticsSchema.parse(request.query);
        const filters = {
          ...(query.startDate && { startDate: new Date(query.startDate) }),
          ...(query.endDate && { endDate: new Date(query.endDate) }),
          ...(query.academicArea && { academicArea: query.academicArea }),
        };
        const analytics = await getEbookAnalytics(filters);
        reply.send(analytics);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const ebookDownloadSchema = z.object({
    ebookId: z.string(),
    period: z.enum(['day', 'week', 'month']).optional(),
  });

  app.get(
    '/admin/analytics/ebooks/downloads',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = ebookDownloadSchema.parse(request.query);
        const downloads = await getEbookDownloadsByPeriod(query.ebookId, query.period);
        reply.send(downloads);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Category routes
  const categoryQuerySchema = z.object({
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/categories',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = categoryQuerySchema.parse(request.query);
        const result = await getCategories(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get(
    '/categories',
    async (request, reply) => {
      try {
        const query = categoryQuerySchema.parse(request.query);
        const result = await getCategories(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: IdParams }>(
    '/admin/categories/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const category = await getCategoryById(request.params.id);
        if (!category) {
          reply.status(404).send({ error: 'Category not found' });
          return;
        }
        reply.send(category);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createCategorySchema = z.object({
    name: z.string(),
    slug: z.string().optional(),
  });

  app.post(
    '/admin/categories',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createCategorySchema.parse(request.body);
        const category = await createCategory(data);
        reply.status(201).send(category);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/categories/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createCategorySchema.partial().parse(request.body);
        const category = await updateCategory(request.params.id, data);
        reply.send(category);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/categories/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteCategory(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Tag routes
  const tagQuerySchema = z.object({
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/tags',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = tagQuerySchema.parse(request.query);
        const result = await getTags(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get(
    '/tags',
    async (request, reply) => {
      try {
        const query = tagQuerySchema.parse(request.query);
        const result = await getTags(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: IdParams }>(
    '/admin/tags/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const tag = await getTagById(request.params.id);
        if (!tag) {
          reply.status(404).send({ error: 'Tag not found' });
          return;
        }
        reply.send(tag);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createTagSchema = z.object({
    name: z.string(),
    slug: z.string().optional(),
  });

  app.post(
    '/admin/tags',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createTagSchema.parse(request.body);
        const tag = await createTag(data);
        reply.status(201).send(tag);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/tags/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createTagSchema.partial().parse(request.body);
        const tag = await updateTag(request.params.id, data);
        reply.send(tag);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/tags/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteTag(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Comment routes
  const commentQuerySchema = z.object({
    postId: z.string().optional(),
    approved: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/comments',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = commentQuerySchema.parse(request.query);
        const result = await getComments(query);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: { postId: string } }>(
    '/blog/:postId/comments',
    async (request, reply) => {
      try {
        const comments = await getCommentsByPostId(request.params.postId);
        reply.send({ comments });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const createCommentSchema = z.object({
    content: z.string().min(1),
    postId: z.string(),
    parentId: z.string().optional(),
  });

  app.post(
    '/blog/comments',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const data = createCommentSchema.parse(request.body);
        const comment = await createComment({
          ...data,
          userId: request.currentUser!.id,
        });
        reply.status(201).send(comment);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  const updateCommentSchema = z.object({
    content: z.string().min(1).optional(),
    approved: z.boolean().optional(),
  });

  app.put<{ Params: IdParams }>(
    '/admin/comments/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = updateCommentSchema.parse(request.body);
        const comment = await updateComment(request.params.id, data);
        reply.send(comment);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/comments/:id/approve',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const comment = await approveComment(request.params.id);
        reply.send(comment);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/comments/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        await deleteComment(request.params.id);
        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Like routes
  app.post<{ Params: { postId: string } }>(
    '/blog/:postId/like',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const result = await toggleLike(request.params.postId, request.currentUser!.id);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: { postId: string } }>(
    '/blog/:postId/likes',
    async (request, reply) => {
      try {
        const result = await getPostLikes(request.params.postId);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: { postId: string } }>(
    '/blog/:postId/likes/count',
    async (request, reply) => {
      try {
        const result = await getPostLikeCount(request.params.postId);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get<{ Params: { postId: string } }>(
    '/blog/:postId/likes/status',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const result = await getUserLikeStatus(request.params.postId, request.currentUser!.id);
        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Related posts route
  app.get<{ Params: { postId: string } }>(
    '/blog/:postId/related',
    async (request, reply) => {
      try {
        const limit = request.query && typeof request.query === 'object' && 'limit' in request.query
          ? Number(request.query.limit) || 4
          : 4;

        const relatedPosts = await getRelatedPosts(request.params.postId, limit);
        reply.send({ posts: relatedPosts });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // SEO routes - Sitemap and RSS (public routes)
  app.get('/sitemap.xml', async (request, reply) => {
    try {
      const baseUrl = request.headers.host
        ? `${request.protocol}://${request.headers.host}`
        : 'https://lneducacional.com.br';

      const sitemap = await generateSitemap(baseUrl);

      reply
        .header('Content-Type', 'application/xml')
        .header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
        .send(sitemap);
    } catch (error: unknown) {
      reply.status(500).send({ error: (error as Error).message });
    }
  });

  app.get('/rss.xml', async (request, reply) => {
    try {
      const baseUrl = request.headers.host
        ? `${request.protocol}://${request.headers.host}`
        : 'https://lneducacional.com.br';

      const rss = await generateRssFeed(baseUrl);

      reply
        .header('Content-Type', 'application/rss+xml')
        .header('Cache-Control', 'public, max-age=1800') // Cache for 30 minutes
        .send(rss);
    } catch (error: unknown) {
      reply.status(500).send({ error: (error as Error).message });
    }
  });

  app.get('/feed', async (request, reply) => {
    try {
      const baseUrl = request.headers.host
        ? `${request.protocol}://${request.headers.host}`
        : 'https://lneducacional.com.br';

      const rss = await generateRssFeed(baseUrl);

      reply
        .header('Content-Type', 'application/rss+xml')
        .header('Cache-Control', 'public, max-age=1800') // Cache for 30 minutes
        .send(rss);
    } catch (error: unknown) {
      reply.status(500).send({ error: (error as Error).message });
    }
  });

  // ===================================================================
  // ADMIN: PAPERS ROUTES
  // ===================================================================

  // Admin: List all papers (including free papers)
  const adminPaperQuerySchema = z.object({
    type: z.string().optional(),
    area: z.string().optional(),
    free: z.string().transform(val => val === 'true').optional(),
    skip: z.string().transform(Number).optional(),
    take: z.string().transform(Number).optional(),
  });

  app.get(
    '/admin/papers',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = adminPaperQuerySchema.parse(request.query);

        const result = await getPapers({
          type: query.type?.toUpperCase().replace(/-/g, '_'),
          area: query.area?.toUpperCase().replace(/-/g, '_'),
          free: query.free,
          skip: query.skip || 0,
          take: query.take || 20,
        });

        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Admin: Get single paper by ID
  app.get<{ Params: IdParams }>(
    '/admin/papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const paper = await getPaperById(request.params.id);
        if (!paper) {
          reply.status(404).send({ error: 'Paper not found' });
          return;
        }
        reply.send(paper);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.post(
    '/admin/papers',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createPaperSchema.parse(request.body);
        const paper = await createPaper({
          ...data,
          paperType: data.paperType.toUpperCase().replace(/-/g, '_'),
          academicArea: data.academicArea.toUpperCase().replace(/-/g, '_'),
        });

        // Invalidate cache if it's a free paper
        if (data.isFree) {
          await deleteCachePattern('papers:free:*');
        }

        reply.status(201).send(paper);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.put<{ Params: IdParams }>(
    '/admin/papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createPaperSchema.partial().parse(request.body);

        // Get current paper to check if it was free before update
        const currentPaper = await getPaperById(request.params.id);

        const paper = await updatePaper(request.params.id, {
          ...data,
          paperType: data.paperType?.toUpperCase().replace(/-/g, '_'),
          academicArea: data.academicArea?.toUpperCase().replace(/-/g, '_'),
        });

        // Invalidate cache if current paper is free or being updated to free
        if (currentPaper?.isFree || data.isFree) {
          await deleteCachePattern('papers:free:*');
        }

        reply.send(paper);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  app.delete<{ Params: IdParams }>(
    '/admin/papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        // Get current paper to check if it's free before deletion
        const currentPaper = await getPaperById(request.params.id);

        await deletePaper(request.params.id);

        // Invalidate cache if the deleted paper was free
        if (currentPaper?.isFree) {
          await deleteCachePattern('papers:free:*');
        }

        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // ===================================================================
  // ADMIN: FREE PAPERS ROUTES (aliases for /admin/papers?free=true)
  // ===================================================================

  // Admin: List free papers only
  app.get(
    '/admin/free-papers',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = adminPaperQuerySchema.parse(request.query);

        const result = await getPapers({
          type: query.type?.toUpperCase().replace(/-/g, '_'),
          area: query.area?.toUpperCase().replace(/-/g, '_'),
          free: true, // Force free papers only
          skip: query.skip || 0,
          take: query.take || 20,
        });

        reply.send(result);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Admin: Get single free paper by ID
  app.get<{ Params: IdParams }>(
    '/admin/free-papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const paper = await getPaperById(request.params.id);
        if (!paper) {
          reply.status(404).send({ error: 'Paper not found' });
          return;
        }
        if (!paper.isFree) {
          reply.status(400).send({ error: 'This paper is not free' });
          return;
        }
        reply.send(paper);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Admin: Create free paper (POST /admin/free-papers)
  app.post(
    '/admin/free-papers',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createPaperSchema.parse(request.body);
        const paper = await createPaper({
          ...data,
          paperType: data.paperType.toUpperCase().replace(/-/g, '_'),
          academicArea: data.academicArea.toUpperCase().replace(/-/g, '_'),
          isFree: true, // Force free
          price: 0, // Force price to 0 for free papers
        });

        // Invalidate free papers cache
        await deleteCachePattern('papers:free:*');

        reply.status(201).send(paper);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Admin: Update free paper (PUT /admin/free-papers/:id)
  app.put<{ Params: IdParams }>(
    '/admin/free-papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const data = createPaperSchema.partial().parse(request.body);

        // Verify paper exists and is free
        const currentPaper = await getPaperById(request.params.id);
        if (!currentPaper) {
          reply.status(404).send({ error: 'Paper not found' });
          return;
        }
        if (!currentPaper.isFree) {
          reply.status(400).send({ error: 'This paper is not free' });
          return;
        }

        const paper = await updatePaper(request.params.id, {
          ...data,
          paperType: data.paperType?.toUpperCase().replace(/-/g, '_'),
          academicArea: data.academicArea?.toUpperCase().replace(/-/g, '_'),
          isFree: true, // Maintain free status
          price: 0, // Force price to 0
        });

        // Invalidate free papers cache
        await deleteCachePattern('papers:free:*');

        reply.send(paper);
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Admin: Delete free paper (DELETE /admin/free-papers/:id)
  app.delete<{ Params: IdParams }>(
    '/admin/free-papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        // Verify paper exists and is free
        const currentPaper = await getPaperById(request.params.id);
        if (!currentPaper) {
          reply.status(404).send({ error: 'Paper not found' });
          return;
        }
        if (!currentPaper.isFree) {
          reply.status(400).send({ error: 'This paper is not free' });
          return;
        }

        await deletePaper(request.params.id);

        // Invalidate free papers cache
        await deleteCachePattern('papers:free:*');

        reply.send({ success: true });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // ===================================================================
  // END: ADMIN FREE PAPERS ROUTES
  // ===================================================================
}

export async function registerCustomPapersRoutes(app: FastifyInstance) {
  const customPapersRoutes = (await import('./routes/custom-papers')).default;
  const adminCustomPapersRoutes = (await import('./routes/admin/custom-papers')).default;

  await app.register(customPapersRoutes);
  await app.register(adminCustomPapersRoutes);
}

export async function registerEnhancedCoursesRoutes(app: FastifyInstance) {
  const coursesRoutes = (await import('./routes/courses')).default;
  await app.register(coursesRoutes);
}

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  const analyticsRoutes = (await import('./routes/analytics')).default;
  await app.register(analyticsRoutes);
}

export async function registerNewsletterRoutes(app: FastifyInstance) {
  const newsletterRoutes = (await import('./routes/newsletter')).default;
  await app.register(newsletterRoutes);
}

export async function registerAllRoutes(app: FastifyInstance) {
  await registerProductRoutes(app);
  await registerOrderRoutes(app);
  await registerStudentRoutes(app);
  await registerAdminRoutes(app);
  await registerCustomPapersRoutes(app);
  await registerEnhancedCoursesRoutes(app);
  await registerAnalyticsRoutes(app);
  await registerNewsletterRoutes(app);
}
