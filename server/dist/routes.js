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
exports.registerProductRoutes = registerProductRoutes;
exports.registerOrderRoutes = registerOrderRoutes;
exports.registerStudentRoutes = registerStudentRoutes;
exports.registerAdminRoutes = registerAdminRoutes;
exports.registerCustomPapersRoutes = registerCustomPapersRoutes;
exports.registerEnhancedCoursesRoutes = registerEnhancedCoursesRoutes;
exports.registerAnalyticsRoutes = registerAnalyticsRoutes;
exports.registerNewsletterRoutes = registerNewsletterRoutes;
exports.registerAllRoutes = registerAllRoutes;
const zod_1 = require("zod");
const prisma_1 = require("./prisma");
const redis_1 = require("./redis");
const upload_service_1 = require("./services/upload.service");
// Shared schemas at module scope to avoid TS hoisting issues
const createPaperSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    paperType: zod_1.z.string(),
    academicArea: zod_1.z.string(),
    price: zod_1.z.number(),
    pageCount: zod_1.z.number(),
    authorName: zod_1.z.string(),
    language: zod_1.z.string().optional(),
    keywords: zod_1.z.string().optional(),
    previewUrl: zod_1.z.string().optional(),
    fileUrl: zod_1.z.string(),
    thumbnailUrl: zod_1.z.string().optional(),
    isFree: zod_1.z.boolean().optional(),
});
async function registerProductRoutes(app) {
    // Health check endpoint for monitoring
    app.get('/health', async (_request, reply) => {
        try {
            // Check database connection
            await prisma_1.prisma.$queryRaw `SELECT 1`;
            // Check Redis connection (optional)
            let redisStatus = 'unknown';
            try {
                await (0, redis_1.getCache)('health-check');
                redisStatus = 'connected';
            }
            catch (error) {
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
        }
        catch (error) {
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
            await prisma_1.prisma.$queryRaw `SELECT 1`;
            return reply.code(200).send({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
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
    const paperQuerySchema = zod_1.z.object({
        type: zod_1.z.string().optional(),
        area: zod_1.z.string().optional(),
        free: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        maxPrice: zod_1.z.string().transform(Number).optional(),
        maxPages: zod_1.z.string().transform(Number).optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
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
                const cached = await (0, redis_1.getCache)(cacheKey);
                if (cached) {
                    reply.send(cached);
                    return;
                }
                // Get from database and cache result
                const result = await (0, prisma_1.getPapers)({
                    type: query.type?.toUpperCase().replace(/-/g, '_'),
                    area: query.area?.toUpperCase().replace(/-/g, '_'),
                    free: query.free,
                    maxPrice: query.maxPrice,
                    maxPages: query.maxPages,
                    skip: query.skip,
                    take: query.take,
                });
                await (0, redis_1.setCache)(cacheKey, result, 300);
                reply.send(result);
            }
            else {
                // No cache for non-free papers (they change more frequently)
                const result = await (0, prisma_1.getPapers)({
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
        }
        catch (error) {
            console.error('❌ ERROR in GET /papers:', error);
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/papers/:id', async (request, reply) => {
        try {
            const paper = await (0, prisma_1.getPaperById)(request.params.id);
            if (!paper) {
                reply.status(404).send({ error: 'Paper not found' });
                return;
            }
            reply.send(paper);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/papers/:id/download', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const paper = await (0, prisma_1.getPaperById)(request.params.id);
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
            await (0, prisma_1.addPaperToLibrary)(request.currentUser.id, paper.id);
            // Registrar download para analytics
            await (0, prisma_1.trackDownload)(request.currentUser.id, paper.id, 'PAPER');
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Add streaming download route with compression
    app.get('/papers/:id/stream', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const paper = await (0, prisma_1.getPaperById)(request.params.id);
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
            await (0, prisma_1.addPaperToLibrary)(request.currentUser.id, paper.id);
            // Registrar download para analytics
            await (0, prisma_1.trackDownload)(request.currentUser.id, paper.id, 'PAPER');
            // For external URLs, redirect with streaming optimizations
            if (paper.fileUrl.startsWith('http')) {
                // Set headers for optimized streaming
                reply
                    .header('Content-Type', 'application/pdf')
                    .header('Content-Disposition', `attachment; filename="${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`)
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
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
    const ebookQuerySchema = zod_1.z.object({
        area: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
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
            const { getCache, setCache } = await Promise.resolve().then(() => __importStar(require('./redis')));
            const cachedResult = await getCache(cacheKey);
            if (cachedResult) {
                reply.send(cachedResult);
                return;
            }
            // Se não estiver no cache, buscar do banco
            const result = await (0, prisma_1.getEbooks)({
                area: query.area?.toUpperCase().replace(/-/g, '_'),
                skip: query.skip,
                take: query.take,
            });
            // Armazenar no cache por 5 minutos
            await setCache(cacheKey, result, 300);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/ebooks/:id', async (request, reply) => {
        try {
            const ebookId = request.params.id;
            const cacheKey = `ebook:${ebookId}`;
            // Tentar buscar do cache primeiro
            const { getCache, setCache } = await Promise.resolve().then(() => __importStar(require('./redis')));
            const cachedEbook = await getCache(cacheKey);
            if (cachedEbook) {
                reply.send(cachedEbook);
                return;
            }
            // Se não estiver no cache, buscar do banco
            const ebook = await (0, prisma_1.getEbookById)(ebookId);
            if (!ebook) {
                reply.status(404).send({ error: 'Ebook not found' });
                return;
            }
            // Armazenar no cache por 10 minutos
            await setCache(cacheKey, ebook, 600);
            reply.send(ebook);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/ebooks/:id/download', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const ebook = await (0, prisma_1.getEbookById)(request.params.id);
            if (!ebook) {
                reply.status(404).send({ error: 'Ebook not found' });
                return;
            }
            // Verificar se o usuário comprou o e-book (gratuito ou através de pedido)
            const { hasUserPurchasedEbook } = await Promise.resolve().then(() => __importStar(require('./prisma')));
            const hasPurchased = await hasUserPurchasedEbook(request.currentUser.id, ebook.id);
            if (!hasPurchased && ebook.price > 0) {
                reply.status(403).send({ error: 'You need to purchase this ebook first' });
                return;
            }
            // Adicionar à biblioteca do usuário
            const { addEbookToLibrary } = await Promise.resolve().then(() => __importStar(require('./prisma')));
            await addEbookToLibrary(request.currentUser.id, ebook.id);
            // Registrar download para analytics
            await (0, prisma_1.trackDownload)(request.currentUser.id, ebook.id, 'EBOOK');
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createEbookSchema = zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().min(10),
        academicArea: zod_1.z.string(),
        authorName: zod_1.z.string().min(2),
        price: zod_1.z.number().int(),
        pageCount: zod_1.z.number().int().min(1),
        fileUrl: zod_1.z.string().min(1),
        coverUrl: zod_1.z.string().optional(),
    });
    // Get all ebooks (Admin)
    app.get('/admin/ebooks', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const query = request.query;
        const where = {};
        if (query.search) {
            where.title = {
                contains: query.search,
                mode: 'insensitive',
            };
        }
        if (query.area && query.area !== 'all') {
            where.academicArea = query.area.toUpperCase();
        }
        const ebooks = await prisma_1.prisma.ebook.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        reply.send(ebooks);
    });
    // Get single ebook (Admin)
    app.get('/admin/ebooks/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const ebook = await prisma_1.prisma.ebook.findUnique({
            where: { id: request.params.id },
        });
        if (!ebook) {
            return reply.status(404).send({ error: 'Ebook not found' });
        }
        reply.send(ebook);
    });
    app.post('/admin/ebooks', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            console.log('📥 [CREATE EBOOK] Received data:', JSON.stringify(request.body, null, 2));
            const data = createEbookSchema.parse(request.body);
            console.log('✅ [CREATE EBOOK] Schema validated:', JSON.stringify(data, null, 2));
            const ebook = await (0, prisma_1.createEbook)({
                ...data,
                academicArea: data.academicArea.toUpperCase().replace(/-/g, '_'),
            });
            // Invalidar cache de listagem de e-books após criação
            const { deleteCachePattern } = await Promise.resolve().then(() => __importStar(require('./redis')));
            await deleteCachePattern('ebooks:list:*');
            reply.status(201).send(ebook);
        }
        catch (error) {
            console.error('❌ [CREATE EBOOK] Error:', error);
            // Handle validation errors specifically
            if (error instanceof Error && error.name === 'EbookValidationError') {
                console.error('❌ [CREATE EBOOK] Validation error:', error.message, 'field:', error.field);
                reply.status(422).send({
                    error: error.message,
                    field: error.field,
                    type: 'validation_error',
                });
                return;
            }
            // Handle Zod validation errors
            if (error instanceof Error && error.name === 'ZodError') {
                console.error('❌ [CREATE EBOOK] Zod error:', error.message);
                reply.status(400).send({
                    error: 'Invalid input data',
                    details: error.message,
                    type: 'schema_error',
                });
                return;
            }
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/ebooks/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createEbookSchema.partial().parse(request.body);
            const ebook = await (0, prisma_1.updateEbook)(request.params.id, {
                ...data,
                academicArea: data.academicArea?.toUpperCase().replace(/-/g, '_'),
            });
            // Invalidar cache do e-book específico e listagem após atualização
            const { deleteCache, deleteCachePattern } = await Promise.resolve().then(() => __importStar(require('./redis')));
            await deleteCache(`ebook:${request.params.id}`);
            await deleteCachePattern('ebooks:list:*');
            reply.send(ebook);
        }
        catch (error) {
            // Handle validation errors specifically
            if (error instanceof Error && error.name === 'EbookValidationError') {
                reply.status(422).send({
                    error: error.message,
                    field: error.field,
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
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/ebooks/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await (0, prisma_1.deleteEbook)(request.params.id);
            // Invalidar cache do e-book específico e listagem após deleção
            const { deleteCache, deleteCachePattern } = await Promise.resolve().then(() => __importStar(require('./redis')));
            await deleteCache(`ebook:${request.params.id}`);
            await deleteCachePattern('ebooks:list:*');
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Upload ebook file
    app.post('/admin/ebooks/upload-file', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }
            // Validate file type (PDF, DOC, DOCX)
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.status(400).send({
                    error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
                });
            }
            // Validate file size (50MB max)
            const buffer = await data.toBuffer();
            if (buffer.length > 50 * 1024 * 1024) {
                return reply.status(400).send({
                    error: 'File too large. Maximum size is 50MB.',
                });
            }
            const uploaded = await (0, upload_service_1.uploadFile)(data, 'materials');
            reply.send({
                url: uploaded.url,
                size: uploaded.size,
                mimetype: uploaded.mimetype,
            });
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
        }
    });
    // Upload ebook cover
    app.post('/admin/ebooks/upload-cover', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }
            // Validate file type (images only)
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.status(400).send({
                    error: 'Invalid file type. Only JPG, PNG, and WEBP images are allowed.',
                });
            }
            // Validate file size (10MB max for images)
            const buffer = await data.toBuffer();
            if (buffer.length > 10 * 1024 * 1024) {
                return reply.status(400).send({
                    error: 'File too large. Maximum size is 10MB.',
                });
            }
            const uploaded = await (0, upload_service_1.uploadFile)(data, 'materials');
            reply.send({
                url: uploaded.url,
                size: uploaded.size,
                mimetype: uploaded.mimetype,
            });
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
        }
    });
    const searchSchema = zod_1.z.object({
        q: zod_1.z.string().min(2),
        type: zod_1.z.enum(['paper', 'course', 'ebook']).optional(),
    });
    app.get('/search', async (request, reply) => {
        try {
            const query = searchSchema.parse(request.query);
            const results = await (0, prisma_1.searchProducts)(query.q, query.type);
            reply.send(results);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
}
async function registerOrderRoutes(app) {
    const checkoutSchema = zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            title: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            price: zod_1.z.number(),
            type: zod_1.z.enum(['paper', 'course', 'ebook']),
        })),
        customer: zod_1.z.object({
            name: zod_1.z.string(),
            email: zod_1.z.string().email(),
            cpfCnpj: zod_1.z.string(),
            phone: zod_1.z.string().optional(),
        }),
        paymentMethod: zod_1.z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD']),
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
            const order = await (0, prisma_1.createOrder)({
                userId: request.currentUser.id,
                items: orderItems,
                totalAmount,
                paymentMethod: data.paymentMethod,
                customerName: data.customer.name,
                customerEmail: data.customer.email,
                customerCpfCnpj: data.customer.cpfCnpj,
                customerPhone: data.customer.phone,
            });
            const paymentData = { orderId: order.id };
            if (data.paymentMethod === 'PIX') {
                paymentData.pixCode = await (0, prisma_1.generatePixCode)(order.id);
                paymentData.paymentMethod = 'PIX';
            }
            else if (data.paymentMethod === 'BOLETO') {
                paymentData.boletoUrl = await (0, prisma_1.generateBoletoUrl)(order.id);
                paymentData.paymentMethod = 'BOLETO';
            }
            else {
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/orders/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const order = await (0, prisma_1.getOrderById)(request.params.id);
            if (!order) {
                reply.status(404).send({ error: 'Order not found' });
                return;
            }
            if (order.userId !== request.currentUser.id && request.currentUser.role !== 'ADMIN') {
                reply.status(403).send({ error: 'Forbidden' });
                return;
            }
            reply.send(order);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const webhookSchema = zod_1.z.object({
        orderId: zod_1.z.string(),
        status: zod_1.z.enum(['paid', 'failed', 'canceled']),
        paymentMethod: zod_1.z.string(),
        timestamp: zod_1.z.string().optional(),
        signature: zod_1.z.string().optional(),
    });
    app.post('/webhooks/payment', async (request, reply) => {
        try {
            const data = webhookSchema.parse(request.body);
            const order = await (0, prisma_1.processPaymentWebhook)({
                orderId: data.orderId,
                status: data.status,
                paymentMethod: data.paymentMethod,
            });
            reply.send({ success: true, orderId: order.id });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const orderQuerySchema = zod_1.z.object({
        status: zod_1.z.string().optional(),
        paymentStatus: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/student/orders', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const query = orderQuerySchema.parse(request.query);
            const result = await (0, prisma_1.getOrdersByUserId)(request.currentUser.id, {
                status: query.status?.toUpperCase(),
                skip: query.skip,
                take: query.take,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/admin/orders', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = orderQuerySchema.parse(request.query);
            const result = await (0, prisma_1.getAllOrders)({
                status: query.status?.toUpperCase(),
                paymentStatus: query.paymentStatus?.toUpperCase(),
                skip: query.skip,
                take: query.take,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/orders/:id/status', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const statusSchema = zod_1.z.object({
                status: zod_1.z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED']),
            });
            const data = statusSchema.parse(request.body);
            const order = await (0, prisma_1.updateOrderStatus)(request.params.id, data.status);
            reply.send(order);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/orders/:id/payment-status', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const paymentStatusSchema = zod_1.z.object({
                paymentStatus: zod_1.z.enum([
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
            const order = await (0, prisma_1.updateOrderPaymentStatus)(request.params.id, data.paymentStatus);
            reply.send(order);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
}
async function registerStudentRoutes(app) {
    const { getStudentDashboard, getStudentCourses, getStudentLibrary, getStudentDownloads, getStudentCertificates, generateCertificateQRCode, completeCourse, getStudentProfile, updateStudentProfile, verifyCertificate, } = await Promise.resolve().then(() => __importStar(require('./student')));
    app.get('/student/dashboard', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const dashboard = await getStudentDashboard(request.currentUser.id);
            reply.send(dashboard);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/courses', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const courses = await getStudentCourses(request.currentUser.id);
            reply.send({ courses });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/library', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const library = await getStudentLibrary(request.currentUser.id);
            reply.send({ items: library });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/downloads', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const downloads = await getStudentDownloads(request.currentUser.id);
            reply.send(downloads);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/purchases/ebooks', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const { getEbooksByUserId } = await Promise.resolve().then(() => __importStar(require('./prisma')));
            const ebooks = await getEbooksByUserId(request.currentUser.id);
            reply.send({ ebooks });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/certificates', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const certificates = await getStudentCertificates(request.currentUser.id);
            reply.send({ certificates });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/certificates/:id/qr', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const certificate = await prisma_1.prisma.certificate.findUnique({
                where: { id: request.params.id },
            });
            if (!certificate) {
                reply.status(404).send({ error: 'Certificate not found' });
                return;
            }
            if (certificate.userId !== request.currentUser.id) {
                reply.status(403).send({ error: 'Forbidden' });
                return;
            }
            let qrCodeUrl = certificate.qrCodeUrl;
            if (!qrCodeUrl) {
                qrCodeUrl = await generateCertificateQRCode(certificate.id);
            }
            reply.send({ qrCodeUrl });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const completeCourseSchema = zod_1.z.object({
        grade: zod_1.z.number().min(0).max(100),
    });
    app.post('/student/courses/:id/complete', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const data = completeCourseSchema.parse(request.body);
            const certificate = await completeCourse(request.currentUser.id, request.params.id, data.grade);
            reply.status(201).send({ certificate });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/student/profile', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const profile = await getStudentProfile(request.currentUser.id);
            reply.send(profile);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const updateProfileSchema = zod_1.z
        .object({
        name: zod_1.z.string().min(2).optional(),
        email: zod_1.z.string().email().optional(),
        currentPassword: zod_1.z.string().optional(),
        newPassword: zod_1.z.string().min(8).optional(),
    })
        .refine((data) => {
        if (data.newPassword && !data.currentPassword) {
            return false;
        }
        return true;
    }, {
        message: 'Current password is required to change password',
    });
    app.put('/student/profile', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const data = updateProfileSchema.parse(request.body);
            const profile = await updateStudentProfile(request.currentUser.id, data);
            reply.send(profile);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/certificates/verify/:number', async (request, reply) => {
        try {
            const result = await verifyCertificate(request.params.number);
            reply.send(result);
        }
        catch (_error) {
            reply.status(404).send({ error: 'Certificate not found', valid: false });
        }
    });
}
async function registerAdminRoutes(app) {
    const { getAdminDashboardStats, getAllUsers, getUserById, updateUser, updateUserRole, deleteUser, getBlogPosts, getBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost, getMessages, createMessage, updateMessageStatus, 
    // Enhanced message functions
    replyToMessage, deleteMessage, bulkMarkMessagesAsRead, getMessageStats, 
    // Legal documents functions
    getLegalDocuments, getLegalDocumentByType, createLegalDocument, updateLegalDocument, deleteLegalDocument, getLegalDocumentVersions, 
    // Message templates functions
    getMessageTemplates, createMessageTemplate, updateMessageTemplate, deleteMessageTemplate, getMessageTemplateById, getCollaboratorApplications, applyAsCollaborator, updateCollaboratorStatus, getAnalytics, getEbookAnalytics, getEbookDownloadsByPeriod, getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getTags, getTagById, createTag, updateTag, deleteTag, getComments, getCommentsByPostId, createComment, updateComment, deleteComment, approveComment, toggleLike, getPostLikeCount, getUserLikeStatus, getPostLikes, getRelatedPosts, generateSitemap, generateRssFeed, searchBlogPosts, } = await Promise.resolve().then(() => __importStar(require('./admin')));
    app.get('/admin/dashboard/stats', { preHandler: [app.authenticate, app.requireAdmin] }, async (_request, reply) => {
        try {
            const stats = await getAdminDashboardStats();
            reply.send(stats);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const usersQuerySchema = zod_1.z.object({
        role: zod_1.z.string().optional(),
        verified: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/users', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const updateRoleSchema = zod_1.z.object({
        role: zod_1.z.enum(['ADMIN', 'STUDENT', 'COLLABORATOR']),
    });
    app.get('/admin/users/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const user = await getUserById(request.params.id);
            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }
            reply.send(user);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const updateUserSchema = zod_1.z.object({
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        role: zod_1.z.enum(['ADMIN', 'STUDENT', 'COLLABORATOR']).optional(),
    });
    app.put('/admin/users/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = updateUserSchema.parse(request.body);
            const user = await updateUser(request.params.id, data);
            reply.send(user);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/users/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteUser(request.params.id);
            reply.status(204).send();
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/users/:id/role', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = updateRoleSchema.parse(request.body);
            const user = await updateUserRole(request.params.id, data.role);
            reply.send(user);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const blogQuerySchema = zod_1.z.object({
        published: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        search: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        tagIds: zod_1.z.string().optional().transform((val) => val ? val.split(',') : undefined),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/blog', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = blogQuerySchema.parse(request.query);
            const result = await getBlogPosts(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createBlogSchema = zod_1.z.object({
        title: zod_1.z.string(),
        content: zod_1.z.string(),
        excerpt: zod_1.z.string().optional(),
        coverImageUrl: zod_1.z.string().optional(),
        published: zod_1.z.boolean().optional(),
        status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
        categoryId: zod_1.z.string().optional(),
        tagIds: zod_1.z.array(zod_1.z.string()).optional(),
    });
    app.post('/admin/blog', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createBlogSchema.parse(request.body);
            const post = await createBlogPost({
                ...data,
                authorId: request.currentUser.id,
            });
            reply.status(201).send(post);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Upload image for blog
    app.post('/admin/blog/upload-image', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
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
            const uploaded = await (0, upload_service_1.uploadFile)(data, 'blog-images');
            reply.send({
                url: uploaded.url,
                size: uploaded.size,
                mimetype: uploaded.mimetype
            });
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
        }
    });
    app.put('/admin/blog/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createBlogSchema.partial().parse(request.body);
            const post = await updateBlogPost(request.params.id, data);
            reply.send(post);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/blog/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteBlogPost(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/admin/blog/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const post = await prisma_1.prisma.blogPost.findUnique({
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.patch('/admin/blog/:id/publish', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const post = await prisma_1.prisma.blogPost.findUnique({
                where: { id: request.params.id },
            });
            if (!post) {
                return reply.status(404).send({ error: 'Post not found' });
            }
            const updatedPost = await prisma_1.prisma.blogPost.update({
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/blog', async (request, reply) => {
        try {
            const query = blogQuerySchema.parse(request.query);
            const result = await getBlogPosts({ ...query, published: true });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/blog/:slug', async (request, reply) => {
        try {
            const post = await getBlogPostBySlug(request.params.slug);
            if (!post) {
                reply.status(404).send({ error: 'Post not found' });
                return;
            }
            reply.send(post);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Advanced search endpoint for blog posts
    const advancedSearchSchema = zod_1.z.object({
        search: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        tagIds: zod_1.z.string().optional().transform((val) => val ? val.split(',') : undefined),
        dateFrom: zod_1.z.string().optional().transform((val) => val ? new Date(val) : undefined),
        dateTo: zod_1.z.string().optional().transform((val) => val ? new Date(val) : undefined),
        authorId: zod_1.z.string().optional(),
        published: zod_1.z.string().optional().transform((val) => val === 'true'),
        sortBy: zod_1.z.enum(['date', 'popularity', 'relevance', 'views']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/admin/blog/search', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = advancedSearchSchema.parse(request.query);
            const result = await searchBlogPosts({
                ...query,
                tags: query.tagIds,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const contactSchema = zod_1.z.object({
        name: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
        email: zod_1.z.string().email('Email inválido'),
        phone: zod_1.z.string().optional(),
        subject: zod_1.z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
        message: zod_1.z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
        website: zod_1.z.string().optional(), // Honeypot field
        acceptTerms: zod_1.z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
        captchaToken: zod_1.z.string().optional(),
    });
    app.post('/contact', async (request, reply) => {
        try {
            // Import services
            const { antiSpamService } = await Promise.resolve().then(() => __importStar(require('./services/anti-spam.service.js')));
            const { notificationService } = await Promise.resolve().then(() => __importStar(require('./services/notification.service.js')));
            const { autoReplyService } = await Promise.resolve().then(() => __importStar(require('./services/auto-reply.service.js')));
            // Get client IP and user agent
            const clientIP = request.ip ||
                request.headers['x-forwarded-for'] ||
                request.headers['x-real-ip'] ||
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
        }
        catch (error) {
            console.error('Contact form error:', error);
            if (error instanceof zod_1.z.ZodError) {
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
    const messagesQuerySchema = zod_1.z.object({
        status: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/messages', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = messagesQuerySchema.parse(request.query);
            const result = await getMessages({
                status: query.status?.toUpperCase(),
                search: query.search,
                skip: query.skip,
                take: query.take,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const messageStatusSchema = zod_1.z.object({
        status: zod_1.z.enum(['UNREAD', 'READ', 'ARCHIVED']),
    });
    app.put('/admin/messages/:id/status', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = messageStatusSchema.parse(request.body);
            const message = await updateMessageStatus(request.params.id, data.status);
            reply.send(message);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Enhanced message endpoints
    // Reply to message
    const replyMessageSchema = zod_1.z.object({
        content: zod_1.z.string().min(10, 'Reply content must be at least 10 characters'),
        templateId: zod_1.z.string().optional(),
    });
    app.post('/admin/messages/:id/reply', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = replyMessageSchema.parse(request.body);
            const message = await replyToMessage(request.params.id, data.content, request.currentUser.id);
            reply.send({ success: true, message });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Delete message
    app.delete('/admin/messages/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteMessage(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Bulk mark messages as read
    const bulkReadSchema = zod_1.z.object({
        messageIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one message ID is required'),
    });
    app.patch('/admin/messages/bulk-read', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = bulkReadSchema.parse(request.body);
            const result = await bulkMarkMessagesAsRead(data.messageIds);
            reply.send({ success: true, updated: result.count });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Get message statistics
    app.get('/admin/messages/stats', { preHandler: [app.authenticate, app.requireAdmin] }, async (_request, reply) => {
        try {
            const stats = await getMessageStats();
            reply.send(stats);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Legal Documents endpoints
    // Get legal document by type (public endpoint)
    app.get('/legal/:type', async (request, reply) => {
        try {
            const document = await getLegalDocumentByType(request.params.type);
            if (!document) {
                reply.status(404).send({ error: 'Document not found' });
                return;
            }
            reply.send(document);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin legal documents CRUD
    const legalDocumentQuerySchema = zod_1.z.object({
        type: zod_1.z.string().optional(),
        active: zod_1.z.string().transform((val) => val === 'true').optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/legal', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = legalDocumentQuerySchema.parse(request.query);
            const result = await getLegalDocuments({
                type: query.type,
                active: query.active,
                skip: query.skip,
                take: query.take,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createLegalDocumentSchema = zod_1.z.object({
        type: zod_1.z.enum(['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COOKIES_POLICY', 'LGPD_COMPLIANCE']),
        title: zod_1.z.string().min(1),
        content: zod_1.z.string().min(10),
    });
    app.post('/admin/legal', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createLegalDocumentSchema.parse(request.body);
            const document = await createLegalDocument({
                ...data,
                publishedBy: request.currentUser.id,
            });
            reply.status(201).send(document);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const updateLegalDocumentSchema = zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        content: zod_1.z.string().min(10).optional(),
        active: zod_1.z.boolean().optional(),
    });
    app.put('/admin/legal/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = updateLegalDocumentSchema.parse(request.body);
            const document = await updateLegalDocument(request.params.id, data);
            reply.send(document);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/legal/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteLegalDocument(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Get document versions history
    app.get('/admin/legal/:type/versions', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const versions = await getLegalDocumentVersions(request.params.type);
            reply.send({ versions });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Message Templates endpoints
    const messageTemplateQuerySchema = zod_1.z.object({
        category: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/message-templates', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = messageTemplateQuerySchema.parse(request.query);
            const result = await getMessageTemplates(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createMessageTemplateSchema = zod_1.z.object({
        name: zod_1.z.string().min(1),
        subject: zod_1.z.string().min(1),
        content: zod_1.z.string().min(10),
        variables: zod_1.z.array(zod_1.z.string()).optional(),
        category: zod_1.z.string().optional(),
    });
    app.post('/admin/message-templates', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createMessageTemplateSchema.parse(request.body);
            const template = await createMessageTemplate({
                ...data,
                createdBy: request.currentUser.id,
            });
            reply.status(201).send(template);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/admin/message-templates/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const template = await getMessageTemplateById(request.params.id);
            if (!template) {
                reply.status(404).send({ error: 'Template not found' });
                return;
            }
            reply.send(template);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const updateMessageTemplateSchema = zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        subject: zod_1.z.string().min(1).optional(),
        content: zod_1.z.string().min(10).optional(),
        variables: zod_1.z.array(zod_1.z.string()).optional(),
        category: zod_1.z.string().optional(),
    });
    app.put('/admin/message-templates/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = updateMessageTemplateSchema.parse(request.body);
            const template = await updateMessageTemplate(request.params.id, data);
            reply.send(template);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/message-templates/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteMessageTemplate(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const collaboratorApplicationSchema = zod_1.z.object({
        fullName: zod_1.z.string(),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string(),
        area: zod_1.z.string(),
        experience: zod_1.z.string(),
        availability: zod_1.z.string(),
        resumeUrl: zod_1.z.string().optional(),
    });
    app.post('/collaborator/apply', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const data = collaboratorApplicationSchema.parse(request.body);
            const application = await applyAsCollaborator(request.currentUser.id, data);
            reply.status(201).send(application);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const collaboratorsQuerySchema = zod_1.z.object({
        status: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/collaborators', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = collaboratorsQuerySchema.parse(request.query);
            const result = await getCollaboratorApplications({
                status: query.status?.toUpperCase(),
                search: query.search,
                skip: query.skip,
                take: query.take,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const collaboratorStatusSchema = zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'INTERVIEWING', 'APPROVED', 'REJECTED']),
    });
    app.put('/admin/collaborators/:id/status', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = collaboratorStatusSchema.parse(request.body);
            const application = await updateCollaboratorStatus(request.params.id, data.status);
            reply.send(application);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Novos endpoints de colaborador
    // Upload de documentos
    app.post('/collaborator/upload', { preHandler: [app.authenticate] }, async (request, reply) => {
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
            const uploaded = await (0, upload_service_1.uploadFile)(data, 'collaborator-docs');
            reply.send({
                url: uploaded.url,
                size: uploaded.size,
                mimetype: uploaded.mimetype
            });
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
        }
    });
    // Verificar status da aplicação (público)
    app.get('/collaborator/application/status/:id', async (request, reply) => {
        try {
            const { email } = request.query;
            const application = await prisma_1.prisma.collaboratorApplication.findFirst({
                where: { id: request.params.id, email },
                select: { status: true, stage: true, createdAt: true }
            });
            if (!application) {
                return reply.status(404).send({ error: 'Application not found' });
            }
            reply.send(application);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Portal do Colaborador - Perfil
    app.get('/collaborator/profile', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const application = await prisma_1.prisma.collaboratorApplication.findUnique({
                where: { userId: request.currentUser.id },
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Endpoints administrativos avançados
    // Dashboard Analytics
    app.get('/admin/collaborators/analytics', { preHandler: [app.authenticate, app.requireAdmin] }, async (_request, reply) => {
        try {
            const [totalApplications, applicationsByStatus, applicationsByStage, recentApplications] = await Promise.all([
                prisma_1.prisma.collaboratorApplication.count(),
                prisma_1.prisma.collaboratorApplication.groupBy({
                    by: ['status'],
                    _count: true
                }),
                prisma_1.prisma.collaboratorApplication.groupBy({
                    by: ['stage'],
                    _count: true
                }),
                prisma_1.prisma.collaboratorApplication.findMany({
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
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Avaliação de Candidato
    const evaluationSchema = zod_1.z.object({
        experienceScore: zod_1.z.number().min(0).max(10),
        skillsScore: zod_1.z.number().min(0).max(10),
        educationScore: zod_1.z.number().min(0).max(10),
        culturalFitScore: zod_1.z.number().min(0).max(10),
        recommendation: zod_1.z.enum(['STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE', 'STRONG_NO_HIRE']),
        comments: zod_1.z.string()
    });
    app.post('/admin/collaborators/:id/evaluate', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = evaluationSchema.parse(request.body);
            const totalScore = Math.round((data.experienceScore + data.skillsScore + data.educationScore + data.culturalFitScore) / 4);
            const evaluation = await prisma_1.prisma.evaluation.create({
                data: {
                    applicationId: request.params.id,
                    evaluatorId: request.currentUser.id,
                    totalScore,
                    ...data
                }
            });
            // Atualizar score médio na aplicação
            const avgScore = await prisma_1.prisma.evaluation.aggregate({
                where: { applicationId: request.params.id },
                _avg: { totalScore: true }
            });
            await prisma_1.prisma.collaboratorApplication.update({
                where: { id: request.params.id },
                data: { score: Math.round(avgScore._avg.totalScore || 0) }
            });
            reply.send(evaluation);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Agendar Entrevista
    const interviewSchema = zod_1.z.object({
        scheduledAt: zod_1.z.string().datetime(),
        duration: zod_1.z.number().min(15).max(180),
        type: zod_1.z.enum(['PHONE_SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'FINAL']),
        location: zod_1.z.string().optional(),
        meetingUrl: zod_1.z.string().url().optional(),
        interviewerId: zod_1.z.string()
    });
    app.post('/admin/collaborators/:id/interview', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = interviewSchema.parse(request.body);
            const interview = await prisma_1.prisma.interview.create({
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
            await prisma_1.prisma.collaboratorApplication.update({
                where: { id: request.params.id },
                data: { stage: 'INTERVIEW' }
            });
            reply.send(interview);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Bulk Actions
    const bulkSchema = zod_1.z.object({
        ids: zod_1.z.array(zod_1.z.string()),
        action: zod_1.z.enum(['UPDATE_STATUS', 'UPDATE_STAGE', 'DELETE']),
        payload: zod_1.z.any()
    });
    app.post('/admin/collaborators/bulk', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const { ids, action, payload } = bulkSchema.parse(request.body);
            let affectedCount = 0;
            switch (action) {
                case 'UPDATE_STATUS':
                    const statusResult = await prisma_1.prisma.collaboratorApplication.updateMany({
                        where: { id: { in: ids } },
                        data: { status: payload.status }
                    });
                    affectedCount = statusResult.count;
                    break;
                case 'UPDATE_STAGE':
                    const stageResult = await prisma_1.prisma.collaboratorApplication.updateMany({
                        where: { id: { in: ids } },
                        data: { stage: payload.stage }
                    });
                    affectedCount = stageResult.count;
                    break;
                case 'DELETE':
                    const deleteResult = await prisma_1.prisma.collaboratorApplication.deleteMany({
                        where: { id: { in: ids } }
                    });
                    affectedCount = deleteResult.count;
                    break;
            }
            reply.send({ success: true, affectedCount });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const analyticsSchema = zod_1.z.object({
        period: zod_1.z.enum(['7d', '30d', '90d', 'day', 'week', 'month', 'year']).optional(),
    });
    app.get('/admin/analytics', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = analyticsSchema.parse(request.query);
            const analytics = await getAnalytics(query.period);
            reply.send(analytics);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const downloadAnalyticsSchema = zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        itemType: zod_1.z.string().optional(),
        academicArea: zod_1.z.string().optional(),
    });
    app.get('/admin/analytics/downloads', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = downloadAnalyticsSchema.parse(request.query);
            const filters = {
                ...(query.startDate && { startDate: new Date(query.startDate) }),
                ...(query.endDate && { endDate: new Date(query.endDate) }),
                ...(query.itemType && { itemType: query.itemType }),
                ...(query.academicArea && { academicArea: query.academicArea }),
            };
            const { getDownloadAnalytics } = await Promise.resolve().then(() => __importStar(require('./admin')));
            const analytics = await getDownloadAnalytics(filters);
            reply.send(analytics);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const ebookAnalyticsSchema = zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        academicArea: zod_1.z.string().optional(),
    });
    app.get('/admin/analytics/ebooks', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = ebookAnalyticsSchema.parse(request.query);
            const filters = {
                ...(query.startDate && { startDate: new Date(query.startDate) }),
                ...(query.endDate && { endDate: new Date(query.endDate) }),
                ...(query.academicArea && { academicArea: query.academicArea }),
            };
            const analytics = await getEbookAnalytics(filters);
            reply.send(analytics);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const ebookDownloadSchema = zod_1.z.object({
        ebookId: zod_1.z.string(),
        period: zod_1.z.enum(['day', 'week', 'month']).optional(),
    });
    app.get('/admin/analytics/ebooks/downloads', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = ebookDownloadSchema.parse(request.query);
            const downloads = await getEbookDownloadsByPeriod(query.ebookId, query.period);
            reply.send(downloads);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Category routes
    const categoryQuerySchema = zod_1.z.object({
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/categories', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = categoryQuerySchema.parse(request.query);
            const result = await getCategories(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/categories', async (request, reply) => {
        try {
            const query = categoryQuerySchema.parse(request.query);
            const result = await getCategories(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/admin/categories/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const category = await getCategoryById(request.params.id);
            if (!category) {
                reply.status(404).send({ error: 'Category not found' });
                return;
            }
            reply.send(category);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createCategorySchema = zod_1.z.object({
        name: zod_1.z.string(),
        slug: zod_1.z.string().optional(),
    });
    app.post('/admin/categories', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createCategorySchema.parse(request.body);
            const category = await createCategory(data);
            reply.status(201).send(category);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/categories/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createCategorySchema.partial().parse(request.body);
            const category = await updateCategory(request.params.id, data);
            reply.send(category);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/categories/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteCategory(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Tag routes
    const tagQuerySchema = zod_1.z.object({
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/tags', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = tagQuerySchema.parse(request.query);
            const result = await getTags(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/tags', async (request, reply) => {
        try {
            const query = tagQuerySchema.parse(request.query);
            const result = await getTags(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/admin/tags/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const tag = await getTagById(request.params.id);
            if (!tag) {
                reply.status(404).send({ error: 'Tag not found' });
                return;
            }
            reply.send(tag);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createTagSchema = zod_1.z.object({
        name: zod_1.z.string(),
        slug: zod_1.z.string().optional(),
    });
    app.post('/admin/tags', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createTagSchema.parse(request.body);
            const tag = await createTag(data);
            reply.status(201).send(tag);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/tags/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createTagSchema.partial().parse(request.body);
            const tag = await updateTag(request.params.id, data);
            reply.send(tag);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/tags/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteTag(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Comment routes
    const commentQuerySchema = zod_1.z.object({
        postId: zod_1.z.string().optional(),
        approved: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        search: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/comments', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = commentQuerySchema.parse(request.query);
            const result = await getComments(query);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/blog/:postId/comments', async (request, reply) => {
        try {
            const comments = await getCommentsByPostId(request.params.postId);
            reply.send({ comments });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const createCommentSchema = zod_1.z.object({
        content: zod_1.z.string().min(1),
        postId: zod_1.z.string(),
        parentId: zod_1.z.string().optional(),
    });
    app.post('/blog/comments', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const data = createCommentSchema.parse(request.body);
            const comment = await createComment({
                ...data,
                userId: request.currentUser.id,
            });
            reply.status(201).send(comment);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const updateCommentSchema = zod_1.z.object({
        content: zod_1.z.string().min(1).optional(),
        approved: zod_1.z.boolean().optional(),
    });
    app.put('/admin/comments/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = updateCommentSchema.parse(request.body);
            const comment = await updateComment(request.params.id, data);
            reply.send(comment);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/comments/:id/approve', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const comment = await approveComment(request.params.id);
            reply.send(comment);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/comments/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            await deleteComment(request.params.id);
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Like routes
    app.post('/blog/:postId/like', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const result = await toggleLike(request.params.postId, request.currentUser.id);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/blog/:postId/likes', async (request, reply) => {
        try {
            const result = await getPostLikes(request.params.postId);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/blog/:postId/likes/count', async (request, reply) => {
        try {
            const result = await getPostLikeCount(request.params.postId);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.get('/blog/:postId/likes/status', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const result = await getUserLikeStatus(request.params.postId, request.currentUser.id);
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Related posts route
    app.get('/blog/:postId/related', async (request, reply) => {
        try {
            const limit = request.query && typeof request.query === 'object' && 'limit' in request.query
                ? Number(request.query.limit) || 4
                : 4;
            const relatedPosts = await getRelatedPosts(request.params.postId, limit);
            reply.send({ posts: relatedPosts });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
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
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
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
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
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
        }
        catch (error) {
            reply.status(500).send({ error: error.message });
        }
    });
    // ===================================================================
    // ADMIN: PAPERS ROUTES
    // ===================================================================
    // Admin: List all papers (including free papers)
    const adminPaperQuerySchema = zod_1.z.object({
        type: zod_1.z.string().optional(),
        area: zod_1.z.string().optional(),
        free: zod_1.z.string().transform(val => val === 'true').optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/papers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = adminPaperQuerySchema.parse(request.query);
            const result = await (0, prisma_1.getPapers)({
                type: query.type?.toUpperCase().replace(/-/g, '_'),
                area: query.area?.toUpperCase().replace(/-/g, '_'),
                free: query.free,
                skip: query.skip || 0,
                take: query.take || 20,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Get single paper by ID
    app.get('/admin/papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const paper = await (0, prisma_1.getPaperById)(request.params.id);
            if (!paper) {
                reply.status(404).send({ error: 'Paper not found' });
                return;
            }
            reply.send(paper);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.post('/admin/papers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            // Check if it's multipart/form-data (file upload)
            const contentType = request.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                // Handle file upload
                const parts = request.parts();
                const fields = {};
                let fileUrl = '';
                let thumbnailUrl;
                let previewUrl;
                for await (const part of parts) {
                    if (part.type === 'file') {
                        // Handle file uploads
                        if (part.fieldname === 'file') {
                            const uploaded = await (0, upload_service_1.uploadFile)(part, 'materials');
                            fileUrl = uploaded.url;
                        }
                        else if (part.fieldname === 'thumbnail') {
                            const uploaded = await (0, upload_service_1.uploadFile)(part, 'thumbnails');
                            thumbnailUrl = uploaded.url;
                        }
                        else if (part.fieldname === 'preview') {
                            const uploaded = await (0, upload_service_1.uploadFile)(part, 'materials');
                            previewUrl = uploaded.url;
                        }
                    }
                    else {
                        // Handle form fields
                        fields[part.fieldname] = part.value;
                    }
                }
                // Parse keywords if it's a string
                if (typeof fields.keywords === 'string') {
                    fields.keywords = fields.keywords;
                }
                // Convert isFree string to boolean
                const isFree = fields.isFree === 'true';
                // Create paper with uploaded file URLs
                const paper = await (0, prisma_1.createPaper)({
                    title: fields.title,
                    description: fields.description,
                    paperType: fields.paperType.toUpperCase().replace(/-/g, '_'),
                    academicArea: fields.academicArea.toUpperCase().replace(/-/g, '_'),
                    price: parseInt(fields.price, 10),
                    pageCount: parseInt(fields.pageCount, 10),
                    authorName: fields.authorName,
                    language: fields.language || 'pt-BR',
                    keywords: fields.keywords,
                    fileUrl,
                    thumbnailUrl,
                    previewUrl,
                    isFree,
                });
                // Invalidate cache if it's a free paper
                if (isFree) {
                    await (0, redis_1.deleteCachePattern)('papers:free:*');
                }
                reply.status(201).send(paper);
            }
            else {
                // Handle JSON request (original behavior)
                const data = createPaperSchema.parse(request.body);
                const paper = await (0, prisma_1.createPaper)({
                    ...data,
                    paperType: data.paperType.toUpperCase().replace(/-/g, '_'),
                    academicArea: data.academicArea.toUpperCase().replace(/-/g, '_'),
                });
                // Invalidate cache if it's a free paper
                if (data.isFree) {
                    await (0, redis_1.deleteCachePattern)('papers:free:*');
                }
                reply.status(201).send(paper);
            }
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.put('/admin/papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            // Get current paper to check if it was free before update
            const currentPaper = await (0, prisma_1.getPaperById)(request.params.id);
            // Check if it's multipart/form-data (file upload)
            const contentType = request.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                // Handle file upload
                const parts = request.parts();
                const fields = {};
                let fileUrl = currentPaper?.fileUrl;
                let thumbnailUrl = currentPaper?.thumbnailUrl;
                let previewUrl = currentPaper?.previewUrl;
                for await (const part of parts) {
                    if (part.type === 'file') {
                        // Handle file uploads - only update if new file provided
                        if (part.fieldname === 'file') {
                            const uploaded = await (0, upload_service_1.uploadFile)(part, 'materials');
                            fileUrl = uploaded.url;
                        }
                        else if (part.fieldname === 'thumbnail') {
                            const uploaded = await (0, upload_service_1.uploadFile)(part, 'thumbnails');
                            thumbnailUrl = uploaded.url;
                        }
                        else if (part.fieldname === 'preview') {
                            const uploaded = await (0, upload_service_1.uploadFile)(part, 'materials');
                            previewUrl = uploaded.url;
                        }
                    }
                    else {
                        // Handle form fields
                        fields[part.fieldname] = part.value;
                    }
                }
                // Convert isFree string to boolean
                const isFree = fields.isFree === 'true';
                // Prepare update data - only include fields that were provided
                const updateData = {};
                if (fields.title)
                    updateData.title = fields.title;
                if (fields.description)
                    updateData.description = fields.description;
                if (fields.paperType)
                    updateData.paperType = fields.paperType.toUpperCase().replace(/-/g, '_');
                if (fields.academicArea)
                    updateData.academicArea = fields.academicArea.toUpperCase().replace(/-/g, '_');
                if (fields.price)
                    updateData.price = parseInt(fields.price, 10);
                if (fields.pageCount)
                    updateData.pageCount = parseInt(fields.pageCount, 10);
                if (fields.authorName)
                    updateData.authorName = fields.authorName;
                if (fields.language)
                    updateData.language = fields.language;
                if (fields.keywords !== undefined)
                    updateData.keywords = fields.keywords;
                if (fields.isFree !== undefined)
                    updateData.isFree = isFree;
                if (fileUrl)
                    updateData.fileUrl = fileUrl;
                if (thumbnailUrl)
                    updateData.thumbnailUrl = thumbnailUrl;
                if (previewUrl)
                    updateData.previewUrl = previewUrl;
                // Update paper
                const paper = await (0, prisma_1.updatePaper)(request.params.id, updateData);
                // Invalidate cache if current paper is free or being updated to free
                if (currentPaper?.isFree || isFree) {
                    await (0, redis_1.deleteCachePattern)('papers:free:*');
                }
                reply.send(paper);
            }
            else {
                // Handle JSON request (original behavior)
                const data = createPaperSchema.partial().parse(request.body);
                const paper = await (0, prisma_1.updatePaper)(request.params.id, {
                    ...data,
                    paperType: data.paperType?.toUpperCase().replace(/-/g, '_'),
                    academicArea: data.academicArea?.toUpperCase().replace(/-/g, '_'),
                });
                // Invalidate cache if current paper is free or being updated to free
                if (currentPaper?.isFree || data.isFree) {
                    await (0, redis_1.deleteCachePattern)('papers:free:*');
                }
                reply.send(paper);
            }
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    app.delete('/admin/papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            // Get current paper to check if it's free before deletion
            const currentPaper = await (0, prisma_1.getPaperById)(request.params.id);
            await (0, prisma_1.deletePaper)(request.params.id);
            // Invalidate cache if the deleted paper was free
            if (currentPaper?.isFree) {
                await (0, redis_1.deleteCachePattern)('papers:free:*');
            }
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // ===================================================================
    // ADMIN: FREE PAPERS ROUTES (aliases for /admin/papers?free=true)
    // ===================================================================
    // Admin: List free papers only
    app.get('/admin/free-papers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = adminPaperQuerySchema.parse(request.query);
            const result = await (0, prisma_1.getPapers)({
                type: query.type?.toUpperCase().replace(/-/g, '_'),
                area: query.area?.toUpperCase().replace(/-/g, '_'),
                free: true, // Force free papers only
                skip: query.skip || 0,
                take: query.take || 20,
            });
            reply.send(result);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Get single free paper by ID
    app.get('/admin/free-papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const paper = await (0, prisma_1.getPaperById)(request.params.id);
            if (!paper) {
                reply.status(404).send({ error: 'Paper not found' });
                return;
            }
            if (!paper.isFree) {
                reply.status(400).send({ error: 'This paper is not free' });
                return;
            }
            reply.send(paper);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Create free paper (POST /admin/free-papers)
    app.post('/admin/free-papers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createPaperSchema.parse(request.body);
            const paper = await (0, prisma_1.createPaper)({
                ...data,
                paperType: data.paperType.toUpperCase().replace(/-/g, '_'),
                academicArea: data.academicArea.toUpperCase().replace(/-/g, '_'),
                isFree: true, // Force free
                price: 0, // Force price to 0 for free papers
            });
            // Invalidate free papers cache
            await (0, redis_1.deleteCachePattern)('papers:free:*');
            reply.status(201).send(paper);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Update free paper (PUT /admin/free-papers/:id)
    app.put('/admin/free-papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = createPaperSchema.partial().parse(request.body);
            // Verify paper exists and is free
            const currentPaper = await (0, prisma_1.getPaperById)(request.params.id);
            if (!currentPaper) {
                reply.status(404).send({ error: 'Paper not found' });
                return;
            }
            if (!currentPaper.isFree) {
                reply.status(400).send({ error: 'This paper is not free' });
                return;
            }
            const paper = await (0, prisma_1.updatePaper)(request.params.id, {
                ...data,
                paperType: data.paperType?.toUpperCase().replace(/-/g, '_'),
                academicArea: data.academicArea?.toUpperCase().replace(/-/g, '_'),
                isFree: true, // Maintain free status
                price: 0, // Force price to 0
            });
            // Invalidate free papers cache
            await (0, redis_1.deleteCachePattern)('papers:free:*');
            reply.send(paper);
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Delete free paper (DELETE /admin/free-papers/:id)
    app.delete('/admin/free-papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            // Verify paper exists and is free
            const currentPaper = await (0, prisma_1.getPaperById)(request.params.id);
            if (!currentPaper) {
                reply.status(404).send({ error: 'Paper not found' });
                return;
            }
            if (!currentPaper.isFree) {
                reply.status(400).send({ error: 'This paper is not free' });
                return;
            }
            await (0, prisma_1.deletePaper)(request.params.id);
            // Invalidate free papers cache
            await (0, redis_1.deleteCachePattern)('papers:free:*');
            reply.send({ success: true });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // ===================================================================
    // END: ADMIN FREE PAPERS ROUTES
    // ===================================================================
}
async function registerCustomPapersRoutes(app) {
    const customPapersRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/custom-papers')))).default;
    const adminCustomPapersRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/admin/custom-papers')))).default;
    await app.register(customPapersRoutes);
    await app.register(adminCustomPapersRoutes);
}
async function registerEnhancedCoursesRoutes(app) {
    const coursesRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/courses')))).default;
    await app.register(coursesRoutes);
}
async function registerAnalyticsRoutes(app) {
    const analyticsRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/analytics')))).default;
    await app.register(analyticsRoutes);
}
async function registerNewsletterRoutes(app) {
    const newsletterRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/newsletter')))).default;
    await app.register(newsletterRoutes);
}
async function registerAllRoutes(app) {
    await registerProductRoutes(app);
    await registerOrderRoutes(app);
    await registerStudentRoutes(app);
    await registerAdminRoutes(app);
    await registerCustomPapersRoutes(app);
    await registerEnhancedCoursesRoutes(app);
    await registerAnalyticsRoutes(app);
    await registerNewsletterRoutes(app);
}
//# sourceMappingURL=routes.js.map