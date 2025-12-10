import type { CustomPaperStatus, CustomPaperUrgency } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma';

export const customPaperRequestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(5000),
  paperType: z.enum([
    'ARTICLE',
    'REVIEW',
    'THESIS',
    'DISSERTATION',
    'PROJECT',
    'ESSAY',
    'SUMMARY',
    'MONOGRAPHY',
    'CASE_STUDY',
    'OTHER',
  ]),
  academicArea: z.enum([
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
  pageCount: z.number().min(1).max(500),
  deadline: z.string().datetime(),
  urgency: z.enum(['NORMAL', 'URGENT', 'VERY_URGENT']),
  requirements: z.string().min(20),
  keywords: z.string().optional(),
  references: z.string().optional(),
  requirementFiles: z.array(z.string()).optional(),
});

export const customPaperQuoteSchema = z.object({
  quotedPrice: z.number().min(0),
  adminNotes: z.string().optional(),
});

export const customPaperService = {
  // Create new request
  async createRequest(userId: string, data: z.infer<typeof customPaperRequestSchema>) {
    return prisma.customPaper.create({
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
  async getUserRequests(userId: string) {
    return prisma.customPaper.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        order: true,
      },
    });
  },

  // Admin: Get all requests with filters
  async getAllRequests(filters: {
    status?: CustomPaperStatus;
    urgency?: CustomPaperUrgency;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, urgency, search, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customPaper.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          user: true,
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.customPaper.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  // Admin: Provide quote
  async provideQuote(customPaperId: string, data: z.infer<typeof customPaperQuoteSchema>) {
    return prisma.customPaper.update({
      where: { id: customPaperId },
      data: {
        ...data,
        status: 'QUOTED',
        quotedAt: new Date(),
      },
    });
  },

  // Student: Approve quote
  async approveQuote(customPaperId: string, userId: string) {
    const paper = await prisma.customPaper.findUnique({
      where: { id: customPaperId },
    });

    if (!paper || paper.userId !== userId) {
      throw new Error('Custom paper not found or unauthorized');
    }

    if (paper.status !== 'QUOTED') {
      throw new Error('Paper must be quoted before approval');
    }

    return prisma.customPaper.update({
      where: { id: customPaperId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        finalPrice: paper.quotedPrice,
      },
    });
  },

  // Admin: Update status
  async updateStatus(customPaperId: string, status: CustomPaperStatus, notes?: string) {
    const updateData: any = { status };

    if (notes) updateData.adminNotes = notes;

    if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    return prisma.customPaper.update({
      where: { id: customPaperId },
      data: updateData,
    });
  },

  // Upload delivery files
  async uploadDeliveryFiles(customPaperId: string, fileUrls: string[]) {
    return prisma.customPaper.update({
      where: { id: customPaperId },
      data: {
        deliveryFiles: { push: fileUrls },
        status: 'REVIEW',
      },
    });
  },
};
