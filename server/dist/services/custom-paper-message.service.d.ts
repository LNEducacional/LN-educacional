import { z } from 'zod';
export declare const messageSchema: z.ZodObject<{
    content: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    attachments?: string[] | undefined;
}, {
    content: string;
    attachments?: string[] | undefined;
}>;
export declare const customPaperMessageService: {
    sendMessage(customPaperId: string, senderId: string, data: z.infer<typeof messageSchema>, isFromAdmin: boolean): Promise<{
        sender: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            verified: boolean;
            resetToken: string | null;
            resetTokenExpiry: Date | null;
            phone: string | null;
            birthDate: string | null;
            profession: string | null;
            profileImageUrl: string | null;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            country: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        attachments: string[];
        senderId: string;
        customPaperId: string;
        isFromAdmin: boolean;
        isRead: boolean;
    }>;
    getMessages(customPaperId: string, userId: string, isAdmin: boolean): Promise<({
        sender: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            verified: boolean;
            resetToken: string | null;
            resetTokenExpiry: Date | null;
            phone: string | null;
            birthDate: string | null;
            profession: string | null;
            profileImageUrl: string | null;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            country: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        attachments: string[];
        senderId: string;
        customPaperId: string;
        isFromAdmin: boolean;
        isRead: boolean;
    })[]>;
    markAsRead(customPaperId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
};
//# sourceMappingURL=custom-paper-message.service.d.ts.map