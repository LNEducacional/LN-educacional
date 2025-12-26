"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../prisma");
const custom_paper_service_1 = require("../../services/custom-paper.service");
require("../../types/fastify");
const adminCustomPapersRoutes = async (app) => {
    // Create custom paper (admin only)
    app.post('/admin/custom-papers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const data = request.body;
        // Set default values for optional fields
        const paperData = {
            title: data.title || 'Sem título',
            description: data.description || 'Sem descrição',
            paperType: data.paperType || 'OTHER',
            academicArea: data.academicArea || 'OTHER',
            pageCount: data.pageCount || 1,
            deadline: data.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            urgency: data.urgency || 'NORMAL',
            requirements: data.requirements || 'Sem requisitos específicos',
            keywords: data.keywords,
            references: data.references,
        };
        // Create paper (userId is required by database schema)
        if (!data.userId) {
            return reply.status(400).send({ error: 'Usuário é obrigatório' });
        }
        const paper = await prisma_1.prisma.customPaper.create({
            data: {
                userId: data.userId,
                title: paperData.title,
                description: paperData.description,
                paperType: paperData.paperType,
                academicArea: paperData.academicArea,
                pageCount: paperData.pageCount,
                deadline: new Date(paperData.deadline),
                urgency: paperData.urgency,
                requirements: paperData.requirements,
                keywords: paperData.keywords,
                references: paperData.references,
                requirementFiles: [],
                status: 'REQUESTED',
            },
            include: { user: true },
        });
        reply.status(201).send(paper);
    });
    // Get all requests with filters
    app.get('/admin/custom-papers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const query = request.query;
        const papers = await custom_paper_service_1.customPaperService.getAllRequests({
            status: query.status,
            urgency: query.urgency,
            search: query.search,
            page: Number.parseInt(query.page || '1'),
            limit: Number.parseInt(query.limit || '20'),
        });
        reply.send(papers);
    });
    // Get single request
    app.get('/admin/custom-papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const paper = await prisma_1.prisma.customPaper.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!paper) {
            return reply.status(404).send({ error: 'Custom paper not found' });
        }
        reply.send(paper);
    });
    // Update custom paper
    app.put('/admin/custom-papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        const paper = await prisma_1.prisma.customPaper.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                paperType: data.paperType,
                academicArea: data.academicArea,
                pageCount: data.pageCount,
                deadline: data.deadline ? new Date(data.deadline) : undefined,
                urgency: data.urgency,
                requirements: data.requirements,
                keywords: data.keywords,
                references: data.references,
            },
        });
        reply.send(paper);
    });
    // Provide quote
    app.patch('/admin/custom-papers/:id/quote', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const data = custom_paper_service_1.customPaperQuoteSchema.parse(request.body);
        const paper = await custom_paper_service_1.customPaperService.provideQuote(id, data);
        reply.send(paper);
    });
    // Update status
    app.patch('/admin/custom-papers/:id/status', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const { status, notes } = request.body;
        const paper = await custom_paper_service_1.customPaperService.updateStatus(id, status, notes);
        reply.send(paper);
    });
    // Upload delivery files
    app.post('/admin/custom-papers/:id/delivery', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const { fileUrls } = request.body;
        const paper = await custom_paper_service_1.customPaperService.uploadDeliveryFiles(id, fileUrls);
        reply.send(paper);
    });
    // Reject request
    app.patch('/admin/custom-papers/:id/reject', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const { reason } = request.body;
        const paper = await prisma_1.prisma.customPaper.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
            },
        });
        reply.send(paper);
    });
    // Delete request
    app.delete('/admin/custom-papers/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        // Delete associated messages first
        await prisma_1.prisma.customPaperMessage.deleteMany({
            where: { customPaperId: id },
        });
        // Delete the custom paper
        await prisma_1.prisma.customPaper.delete({
            where: { id },
        });
        reply.send({ success: true, message: 'Custom paper deleted successfully' });
    });
};
exports.default = adminCustomPapersRoutes;
//# sourceMappingURL=custom-papers.js.map