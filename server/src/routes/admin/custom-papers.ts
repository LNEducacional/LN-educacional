import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../prisma';
import { customPaperQuoteSchema, customPaperService } from '../../services/custom-paper.service';
import '../../types/fastify';

const adminCustomPapersRoutes: FastifyPluginAsync = async (app) => {
  // Get all requests with filters
  app.get(
    '/admin/custom-papers',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const query = request.query as any;
      const papers = await customPaperService.getAllRequests({
        status: query.status,
        urgency: query.urgency,
        search: query.search,
        page: Number.parseInt(query.page || '1'),
        limit: Number.parseInt(query.limit || '20'),
      });

      reply.send(papers);
    }
  );

  // Get single request
  app.get(
    '/admin/custom-papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const paper = await prisma.customPaper.findUnique({
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
    }
  );

  // Update custom paper
  app.put(
    '/admin/custom-papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const paper = await prisma.customPaper.update({
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
    }
  );

  // Provide quote
  app.patch(
    '/admin/custom-papers/:id/quote',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = customPaperQuoteSchema.parse(request.body);

      const paper = await customPaperService.provideQuote(id, data);

      reply.send(paper);
    }
  );

  // Update status
  app.patch(
    '/admin/custom-papers/:id/status',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, notes } = request.body as any;

      const paper = await customPaperService.updateStatus(id, status, notes);

      reply.send(paper);
    }
  );

  // Upload delivery files
  app.post(
    '/admin/custom-papers/:id/delivery',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { fileUrls } = request.body as { fileUrls: string[] };

      const paper = await customPaperService.uploadDeliveryFiles(id, fileUrls);

      reply.send(paper);
    }
  );

  // Reject request
  app.patch(
    '/admin/custom-papers/:id/reject',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason: string };

      const paper = await prisma.customPaper.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
        },
      });

      reply.send(paper);
    }
  );

  // Delete request
  app.delete(
    '/admin/custom-papers/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Delete associated messages first
      await prisma.customPaperMessage.deleteMany({
        where: { customPaperId: id },
      });

      // Delete the custom paper
      await prisma.customPaper.delete({
        where: { id },
      });

      reply.send({ success: true, message: 'Custom paper deleted successfully' });
    }
  );
};

export default adminCustomPapersRoutes;
