"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNewsletterRoutes = registerNewsletterRoutes;
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
async function registerNewsletterRoutes(app) {
    // Subscribe to newsletter
    const subscribeSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
        name: zod_1.z.string().optional(),
        categoryIds: zod_1.z.array(zod_1.z.string()).optional(),
    });
    app.post('/newsletter/subscribe', async (request, reply) => {
        try {
            const data = subscribeSchema.parse(request.body);
            // Check if email already exists
            const existing = await prisma_1.prisma.newsletterSubscriber.findUnique({
                where: { email: data.email },
            });
            if (existing) {
                if (!existing.active) {
                    // Reactivate subscription
                    await prisma_1.prisma.newsletterSubscriber.update({
                        where: { email: data.email },
                        data: { active: true },
                    });
                }
                reply.send({
                    success: true,
                    message: 'Subscription updated successfully',
                    subscriber: existing
                });
                return;
            }
            // Create new subscription
            const subscriber = await prisma_1.prisma.newsletterSubscriber.create({
                data: {
                    email: data.email,
                    name: data.name,
                    active: true,
                },
            });
            // Add category subscriptions if provided
            if (data.categoryIds && data.categoryIds.length > 0) {
                await prisma_1.prisma.newsletterSubscription.createMany({
                    data: data.categoryIds.map((categoryId) => ({
                        subscriberId: subscriber.id,
                        categoryId,
                    })),
                });
            }
            reply.status(201).send({
                success: true,
                message: 'Subscribed successfully',
                subscriber
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Unsubscribe from newsletter
    const unsubscribeSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
    });
    app.post('/newsletter/unsubscribe', async (request, reply) => {
        try {
            const data = unsubscribeSchema.parse(request.body);
            const subscriber = await prisma_1.prisma.newsletterSubscriber.findUnique({
                where: { email: data.email },
            });
            if (!subscriber) {
                reply.status(404).send({ error: 'Subscriber not found' });
                return;
            }
            await prisma_1.prisma.newsletterSubscriber.update({
                where: { email: data.email },
                data: { active: false },
            });
            reply.send({
                success: true,
                message: 'Unsubscribed successfully'
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Get subscriber status
    app.get('/newsletter/status/:email', async (request, reply) => {
        try {
            const emailSchema = zod_1.z.object({
                email: zod_1.z.string().email(),
            });
            const { email } = emailSchema.parse(request.params);
            const subscriber = await prisma_1.prisma.newsletterSubscriber.findUnique({
                where: { email },
                include: {
                    subscriptions: {
                        include: {
                            category: true,
                        },
                    },
                },
            });
            if (!subscriber) {
                reply.send({
                    subscribed: false,
                    email,
                    categories: []
                });
                return;
            }
            reply.send({
                subscribed: subscriber.active,
                email: subscriber.email,
                name: subscriber.name,
                categories: subscriber.subscriptions.map((sub) => sub.category),
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Update subscriber preferences
    const updatePreferencesSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
        name: zod_1.z.string().optional(),
        categoryIds: zod_1.z.array(zod_1.z.string()).optional(),
    });
    app.put('/newsletter/preferences', async (request, reply) => {
        try {
            const data = updatePreferencesSchema.parse(request.body);
            const subscriber = await prisma_1.prisma.newsletterSubscriber.findUnique({
                where: { email: data.email },
            });
            if (!subscriber) {
                reply.status(404).send({ error: 'Subscriber not found' });
                return;
            }
            // Update subscriber info
            const updatedSubscriber = await prisma_1.prisma.newsletterSubscriber.update({
                where: { email: data.email },
                data: {
                    name: data.name,
                },
            });
            // Update category subscriptions if provided
            if (data.categoryIds !== undefined) {
                // Remove all existing subscriptions
                await prisma_1.prisma.newsletterSubscription.deleteMany({
                    where: { subscriberId: subscriber.id },
                });
                // Add new subscriptions
                if (data.categoryIds.length > 0) {
                    await prisma_1.prisma.newsletterSubscription.createMany({
                        data: data.categoryIds.map((categoryId) => ({
                            subscriberId: subscriber.id,
                            categoryId,
                        })),
                    });
                }
            }
            reply.send({
                success: true,
                message: 'Preferences updated successfully',
                subscriber: updatedSubscriber
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Get all subscribers
    const subscribersQuerySchema = zod_1.z.object({
        active: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        search: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        skip: zod_1.z.string().transform(Number).optional(),
        take: zod_1.z.string().transform(Number).optional(),
    });
    app.get('/admin/newsletter/subscribers', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const query = subscribersQuerySchema.parse(request.query);
            const where = {};
            if (query.active !== undefined) {
                where.active = query.active;
            }
            if (query.search) {
                where.OR = [
                    { email: { contains: query.search, mode: 'insensitive' } },
                    { name: { contains: query.search, mode: 'insensitive' } },
                ];
            }
            if (query.categoryId) {
                where.subscriptions = {
                    some: {
                        categoryId: query.categoryId,
                    },
                };
            }
            const [subscribers, total] = await Promise.all([
                prisma_1.prisma.newsletterSubscriber.findMany({
                    where,
                    include: {
                        subscriptions: {
                            include: {
                                category: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip: query.skip || 0,
                    take: query.take || 20,
                }),
                prisma_1.prisma.newsletterSubscriber.count({ where }),
            ]);
            reply.send({
                subscribers,
                pagination: {
                    total,
                    skip: query.skip || 0,
                    take: query.take || 20,
                },
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Get newsletter stats
    app.get('/admin/newsletter/stats', { preHandler: [app.authenticate, app.requireAdmin] }, async (_request, reply) => {
        try {
            const [totalSubscribers, activeSubscribers, inactiveSubscribers, recentSubscribers, categoryStats,] = await Promise.all([
                prisma_1.prisma.newsletterSubscriber.count(),
                prisma_1.prisma.newsletterSubscriber.count({ where: { active: true } }),
                prisma_1.prisma.newsletterSubscriber.count({ where: { active: false } }),
                prisma_1.prisma.newsletterSubscriber.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                        },
                    },
                }),
                prisma_1.prisma.newsletterSubscription.groupBy({
                    by: ['categoryId'],
                    _count: {
                        subscriberId: true,
                    },
                    orderBy: {
                        _count: {
                            subscriberId: 'desc',
                        },
                    },
                }),
            ]);
            // Get category details for stats
            const categoryDetails = await prisma_1.prisma.category.findMany({
                where: {
                    id: {
                        in: categoryStats.map((stat) => stat.categoryId),
                    },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            });
            const categoryStatsWithDetails = categoryStats.map((stat) => {
                const category = categoryDetails.find((cat) => cat.id === stat.categoryId);
                return {
                    category,
                    subscriberCount: stat._count.subscriberId,
                };
            });
            reply.send({
                totalSubscribers,
                activeSubscribers,
                inactiveSubscribers,
                recentSubscribers,
                categoryStats: categoryStatsWithDetails,
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Send newsletter
    const sendNewsletterSchema = zod_1.z.object({
        subject: zod_1.z.string(),
        content: zod_1.z.string(),
        postId: zod_1.z.string().optional(),
        categoryIds: zod_1.z.array(zod_1.z.string()).optional(),
        sendToAll: zod_1.z.boolean().default(false),
    });
    app.post('/admin/newsletter/send', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const data = sendNewsletterSchema.parse(request.body);
            // Get subscribers based on criteria
            let where = { active: true };
            if (!data.sendToAll && data.categoryIds && data.categoryIds.length > 0) {
                where.subscriptions = {
                    some: {
                        categoryId: {
                            in: data.categoryIds,
                        },
                    },
                };
            }
            const subscribers = await prisma_1.prisma.newsletterSubscriber.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            });
            // Create notification record
            let notificationId;
            if (data.postId) {
                const notification = await prisma_1.prisma.postNotification.create({
                    data: {
                        postId: data.postId,
                        subject: data.subject,
                        emailContent: data.content,
                        subscriberCount: subscribers.length,
                        sentAt: new Date(),
                    },
                });
                notificationId = notification.id;
            }
            // Send newsletter using email service
            const { emailService } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
            const newsletterData = {
                subject: data.subject,
                content: data.content,
            };
            const result = await emailService.sendNewsletter(subscribers.map(s => ({ email: s.email, name: s.name || undefined, id: s.id })), newsletterData);
            console.log(`Newsletter sent: ${result.sent} successful, ${result.failed} failed`);
            if (result.errors.length > 0) {
                console.error('Newsletter errors:', result.errors);
            }
            reply.send({
                success: true,
                message: `Newsletter sent to ${subscribers.length} subscribers`,
                subscriberCount: subscribers.length,
                notificationId,
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Admin: Get newsletter history
    app.get('/admin/newsletter/notifications', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        try {
            const querySchema = zod_1.z.object({
                postId: zod_1.z.string().optional(),
                skip: zod_1.z.string().transform(Number).optional(),
                take: zod_1.z.string().transform(Number).optional(),
            });
            const query = querySchema.parse(request.query);
            const where = {};
            if (query.postId) {
                where.postId = query.postId;
            }
            const [notifications, total] = await Promise.all([
                prisma_1.prisma.postNotification.findMany({
                    where,
                    include: {
                        post: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip: query.skip || 0,
                    take: query.take || 20,
                }),
                prisma_1.prisma.postNotification.count({ where }),
            ]);
            reply.send({
                notifications,
                pagination: {
                    total,
                    skip: query.skip || 0,
                    take: query.take || 20,
                },
            });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
}
exports.default = registerNewsletterRoutes;
//# sourceMappingURL=newsletter.js.map