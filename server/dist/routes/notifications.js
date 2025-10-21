"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNotificationRoutes = registerNotificationRoutes;
const zod_1 = require("zod");
/**
 * Rotas de notificações
 *
 * Implementação básica que retorna respostas vazias/sucesso
 * para evitar erros 404 no frontend. Futuramente pode ser
 * expandido para incluir armazenamento em banco de dados.
 */
async function registerNotificationRoutes(app) {
    // GET /notifications - Buscar notificações do usuário autenticado
    app.get('/notifications', { preHandler: [app.authenticate] }, async (_request, reply) => {
        // TODO: Implementar busca real de notificações do banco de dados
        // Por enquanto, retorna array vazio
        return reply.send([]);
    });
    // PATCH /notifications/:id/read - Marcar notificação como lida
    app.patch('/notifications/:id/read', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        // TODO: Implementar atualização no banco de dados
        // Por enquanto, apenas retorna sucesso
        return reply.send({ success: true, id });
    });
    // PATCH /notifications/read-all - Marcar todas notificações como lidas
    app.patch('/notifications/read-all', { preHandler: [app.authenticate] }, async (_request, reply) => {
        // TODO: Implementar atualização em lote no banco de dados
        // Por enquanto, apenas retorna sucesso
        return reply.send({ success: true });
    });
    // DELETE /notifications/:id - Deletar uma notificação específica
    app.delete('/notifications/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        // TODO: Implementar deleção no banco de dados
        // Por enquanto, apenas retorna sucesso
        return reply.send({ success: true, id });
    });
    // DELETE /notifications/all - Limpar todas as notificações do usuário
    app.delete('/notifications/all', { preHandler: [app.authenticate] }, async (_request, reply) => {
        // TODO: Implementar deleção em lote no banco de dados
        // Por enquanto, apenas retorna sucesso
        return reply.send({ success: true });
    });
    // PUT /notifications/settings - Salvar configurações de notificação
    const settingsSchema = zod_1.z.object({
        sound: zod_1.z.boolean().optional(),
        desktop: zod_1.z.boolean().optional(),
        email: zod_1.z.boolean().optional(),
        orderUpdates: zod_1.z.boolean().optional(),
        courseUpdates: zod_1.z.boolean().optional(),
        promotions: zod_1.z.boolean().optional(),
    });
    app.put('/notifications/settings', { preHandler: [app.authenticate] }, async (request, reply) => {
        try {
            const settings = settingsSchema.parse(request.body);
            // TODO: Implementar salvamento de configurações no banco de dados
            // Por enquanto, apenas valida e retorna sucesso
            return reply.send({ success: true, settings });
        }
        catch (error) {
            return reply.status(400).send({
                error: error instanceof Error ? error.message : 'Invalid settings'
            });
        }
    });
}
exports.default = registerNotificationRoutes;
//# sourceMappingURL=notifications.js.map