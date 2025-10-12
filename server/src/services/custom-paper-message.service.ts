import { z } from 'zod';
import { prisma } from '../prisma';

export const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string()).optional(),
});

export const customPaperMessageService = {
  async sendMessage(
    customPaperId: string,
    senderId: string,
    data: z.infer<typeof messageSchema>,
    isFromAdmin: boolean
  ) {
    return prisma.customPaperMessage.create({
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

  async getMessages(customPaperId: string, userId: string, isAdmin: boolean) {
    // Verify access
    if (!isAdmin) {
      const paper = await prisma.customPaper.findUnique({
        where: { id: customPaperId },
      });
      if (!paper || paper.userId !== userId) {
        throw new Error('Unauthorized');
      }
    }

    return prisma.customPaperMessage.findMany({
      where: { customPaperId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });
  },

  async markAsRead(customPaperId: string, userId: string) {
    return prisma.customPaperMessage.updateMany({
      where: {
        customPaperId,
        isRead: false,
        NOT: { senderId: userId },
      },
      data: { isRead: true },
    });
  },
};
