import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * Rotas de notificações
 *
 * Implementação básica que retorna respostas vazias/sucesso
 * para evitar erros 404 no frontend. Futuramente pode ser
 * expandido para incluir armazenamento em banco de dados.
 */
export async function registerNotificationRoutes(app: FastifyInstance) {
  // GET /notifications - Buscar notificações do usuário autenticado
  app.get(
    '/notifications',
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      // TODO: Implementar busca real de notificações do banco de dados
      // Por enquanto, retorna array vazio
      return reply.send([]);
    }
  );

  // PATCH /notifications/:id/read - Marcar notificação como lida
  app.patch(
    '/notifications/:id/read',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // TODO: Implementar atualização no banco de dados
      // Por enquanto, apenas retorna sucesso
      return reply.send({ success: true, id });
    }
  );

  // PATCH /notifications/read-all - Marcar todas notificações como lidas
  app.patch(
    '/notifications/read-all',
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      // TODO: Implementar atualização em lote no banco de dados
      // Por enquanto, apenas retorna sucesso
      return reply.send({ success: true });
    }
  );

  // DELETE /notifications/:id - Deletar uma notificação específica
  app.delete(
    '/notifications/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // TODO: Implementar deleção no banco de dados
      // Por enquanto, apenas retorna sucesso
      return reply.send({ success: true, id });
    }
  );

  // DELETE /notifications/all - Limpar todas as notificações do usuário
  app.delete(
    '/notifications/all',
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      // TODO: Implementar deleção em lote no banco de dados
      // Por enquanto, apenas retorna sucesso
      return reply.send({ success: true });
    }
  );

  // PUT /notifications/settings - Salvar configurações de notificação
  const settingsSchema = z.object({
    sound: z.boolean().optional(),
    desktop: z.boolean().optional(),
    email: z.boolean().optional(),
    orderUpdates: z.boolean().optional(),
    courseUpdates: z.boolean().optional(),
    promotions: z.boolean().optional(),
  });

  app.put(
    '/notifications/settings',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const settings = settingsSchema.parse(request.body);

        // TODO: Implementar salvamento de configurações no banco de dados
        // Por enquanto, apenas valida e retorna sucesso
        return reply.send({ success: true, settings });
      } catch (error: unknown) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Invalid settings'
        });
      }
    }
  );
}

export default registerNotificationRoutes;
