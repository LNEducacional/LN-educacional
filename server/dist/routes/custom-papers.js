"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../prisma");
const custom_paper_message_service_1 = require("../services/custom-paper-message.service");
const custom_paper_service_1 = require("../services/custom-paper.service");
require("../types/fastify");
const customPapersRoutes = async (app) => {
    // Public: Create request (requires auth)
    app.post('/custom-papers', { preHandler: app.authenticate }, async (request, reply) => {
        const data = custom_paper_service_1.customPaperRequestSchema.parse(request.body);
        const userId = request.currentUser.id;
        const paper = await custom_paper_service_1.customPaperService.createRequest(userId, data);
        reply.status(201).send(paper);
    });
    // Get user's requests
    app.get('/custom-papers/my-requests', { preHandler: app.authenticate }, async (request, reply) => {
        const userId = request.currentUser.id;
        const papers = await custom_paper_service_1.customPaperService.getUserRequests(userId);
        reply.send(papers);
    });
    // Get single request details
    app.get('/custom-papers/:id', { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.currentUser.id;
        const paper = await prisma_1.prisma.customPaper.findUnique({
            where: { id },
            include: {
                user: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: { sender: true },
                },
            },
        });
        if (!paper || (paper.userId !== userId && request.currentUser.role !== 'ADMIN')) {
            return reply.status(404).send({ message: 'Not found' });
        }
        reply.send(paper);
    });
    // Approve quote
    app.post('/custom-papers/:id/approve', { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.currentUser.id;
        const paper = await custom_paper_service_1.customPaperService.approveQuote(id, userId);
        reply.send(paper);
    });
    // Send message
    app.post('/custom-papers/:id/messages', { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.currentUser.id;
        const data = custom_paper_message_service_1.messageSchema.parse(request.body);
        const message = await custom_paper_message_service_1.customPaperMessageService.sendMessage(id, userId, data, request.currentUser.role === 'ADMIN');
        reply.status(201).send(message);
    });
};
exports.default = customPapersRoutes;
//# sourceMappingURL=custom-papers.js.map