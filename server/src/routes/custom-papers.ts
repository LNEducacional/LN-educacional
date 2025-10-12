import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../prisma';
import { customPaperMessageService, messageSchema } from '../services/custom-paper-message.service';
import { customPaperRequestSchema, customPaperService } from '../services/custom-paper.service';
import '../types/fastify';

const customPapersRoutes: FastifyPluginAsync = async (app) => {
  // Public: Create request (requires auth)
  app.post('/custom-papers', { preHandler: app.authenticate }, async (request, reply) => {
    const data = customPaperRequestSchema.parse(request.body);
    const userId = request.currentUser!.id;

    const paper = await customPaperService.createRequest(userId, data);

    reply.status(201).send(paper);
  });

  // Get user's requests
  app.get(
    '/custom-papers/my-requests',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const userId = request.currentUser!.id;
      const papers = await customPaperService.getUserRequests(userId);

      reply.send(papers);
    }
  );

  // Get single request details
  app.get('/custom-papers/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.currentUser!.id;

    const paper = await prisma.customPaper.findUnique({
      where: { id },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: true },
        },
      },
    });

    if (!paper || (paper.userId !== userId && request.currentUser!.role !== 'ADMIN')) {
      return reply.status(404).send({ message: 'Not found' });
    }

    reply.send(paper);
  });

  // Approve quote
  app.post(
    '/custom-papers/:id/approve',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.currentUser!.id;

      const paper = await customPaperService.approveQuote(id, userId);

      reply.send(paper);
    }
  );

  // Send message
  app.post(
    '/custom-papers/:id/messages',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.currentUser!.id;
      const data = messageSchema.parse(request.body);

      const message = await customPaperMessageService.sendMessage(
        id,
        userId,
        data,
        request.currentUser!.role === 'ADMIN'
      );

      reply.status(201).send(message);
    }
  );
};

export default customPapersRoutes;
