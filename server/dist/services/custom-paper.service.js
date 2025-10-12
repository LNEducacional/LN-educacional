"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customPaperService = exports.customPaperQuoteSchema = exports.customPaperRequestSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
exports.customPaperRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(200),
    description: zod_1.z.string().min(50).max(5000),
    paperType: zod_1.z.enum([
        'ARTICLE',
        'REVIEW',
        'THESIS',
        'DISSERTATION',
        'PROJECT',
        'ESSAY',
        'SUMMARY',
        'MONOGRAPHY',
        'CASE_STUDY',
    ]),
    academicArea: zod_1.z.enum([
        'ADMINISTRATION',
        'LAW',
        'EDUCATION',
        'ENGINEERING',
        'PSYCHOLOGY',
        'HEALTH',
        'ACCOUNTING',
        'ARTS',
        'ECONOMICS',
        'SOCIAL_SCIENCES',
        'OTHER',
        'EXACT_SCIENCES',
        'BIOLOGICAL_SCIENCES',
        'HEALTH_SCIENCES',
        'APPLIED_SOCIAL_SCIENCES',
        'HUMANITIES',
        'LANGUAGES',
        'AGRICULTURAL_SCIENCES',
        'MULTIDISCIPLINARY',
    ]),
    pageCount: zod_1.z.number().min(1).max(500),
    deadline: zod_1.z.string().datetime(),
    urgency: zod_1.z.enum(['NORMAL', 'URGENT', 'VERY_URGENT']),
    requirements: zod_1.z.string().min(20),
    keywords: zod_1.z.string().optional(),
    references: zod_1.z.string().optional(),
    requirementFiles: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.customPaperQuoteSchema = zod_1.z.object({
    quotedPrice: zod_1.z.number().min(0),
    adminNotes: zod_1.z.string().optional(),
});
exports.customPaperService = {
    // Create new request
    async createRequest(userId, data) {
        return prisma_1.prisma.customPaper.create({
            data: {
                userId,
                title: data.title,
                description: data.description,
                paperType: data.paperType,
                academicArea: data.academicArea,
                pageCount: data.pageCount,
                deadline: new Date(data.deadline),
                urgency: data.urgency,
                requirements: data.requirements,
                keywords: data.keywords,
                references: data.references,
                requirementFiles: data.requirementFiles || [],
                status: 'REQUESTED',
            },
            include: { user: true },
        });
    },
    // Get user's requests
    async getUserRequests(userId) {
        return prisma_1.prisma.customPaper.findMany({
            where: { userId },
            orderBy: { requestedAt: 'desc' },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                order: true,
            },
        });
    },
    // Admin: Get all requests with filters
    async getAllRequests(filters) {
        const { status, urgency, search, page = 1, limit = 20 } = filters;
        const where = {};
        if (status)
            where.status = status;
        if (urgency)
            where.urgency = urgency;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [items, total] = await Promise.all([
            prisma_1.prisma.customPaper.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { requestedAt: 'desc' },
                include: {
                    user: true,
                    messages: { take: 1, orderBy: { createdAt: 'desc' } },
                },
            }),
            prisma_1.prisma.customPaper.count({ where }),
        ]);
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    },
    // Admin: Provide quote
    async provideQuote(customPaperId, data) {
        return prisma_1.prisma.customPaper.update({
            where: { id: customPaperId },
            data: {
                ...data,
                status: 'QUOTED',
                quotedAt: new Date(),
            },
        });
    },
    // Student: Approve quote
    async approveQuote(customPaperId, userId) {
        const paper = await prisma_1.prisma.customPaper.findUnique({
            where: { id: customPaperId },
        });
        if (!paper || paper.userId !== userId) {
            throw new Error('Custom paper not found or unauthorized');
        }
        if (paper.status !== 'QUOTED') {
            throw new Error('Paper must be quoted before approval');
        }
        return prisma_1.prisma.customPaper.update({
            where: { id: customPaperId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
                finalPrice: paper.quotedPrice,
            },
        });
    },
    // Admin: Update status
    async updateStatus(customPaperId, status, notes) {
        const updateData = { status };
        if (notes)
            updateData.adminNotes = notes;
        if (status === 'IN_PROGRESS')
            updateData.startedAt = new Date();
        if (status === 'COMPLETED')
            updateData.completedAt = new Date();
        return prisma_1.prisma.customPaper.update({
            where: { id: customPaperId },
            data: updateData,
        });
    },
    // Upload delivery files
    async uploadDeliveryFiles(customPaperId, fileUrls) {
        return prisma_1.prisma.customPaper.update({
            where: { id: customPaperId },
            data: {
                deliveryFiles: { push: fileUrls },
                status: 'REVIEW',
            },
        });
    },
};
//# sourceMappingURL=custom-paper.service.js.map