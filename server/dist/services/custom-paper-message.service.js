"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customPaperMessageService = exports.messageSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
exports.messageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.customPaperMessageService = {
    async sendMessage(customPaperId, senderId, data, isFromAdmin) {
        return prisma_1.prisma.customPaperMessage.create({
            data: {
                customPaperId,
                senderId,
                content: data.content,
                attachments: data.attachments || [],
                isFromAdmin,
            },
            include: { sender: true },
        });
    },
    async getMessages(customPaperId, userId, isAdmin) {
        // Verify access
        if (!isAdmin) {
            const paper = await prisma_1.prisma.customPaper.findUnique({
                where: { id: customPaperId },
            });
            if (!paper || paper.userId !== userId) {
                throw new Error('Unauthorized');
            }
        }
        return prisma_1.prisma.customPaperMessage.findMany({
            where: { customPaperId },
            orderBy: { createdAt: 'asc' },
            include: { sender: true },
        });
    },
    async markAsRead(customPaperId, userId) {
        return prisma_1.prisma.customPaperMessage.updateMany({
            where: {
                customPaperId,
                isRead: false,
                NOT: { senderId: userId },
            },
            data: { isRead: true },
        });
    },
};
//# sourceMappingURL=custom-paper-message.service.js.map