import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma';

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  // Track page view for analytics
  const trackViewSchema = z.object({
    postId: z.string(),
    userAgent: z.string().optional(),
    referer: z.string().optional(),
    ipAddress: z.string().optional(),
  });

  app.post('/analytics/track-view', async (request, reply) => {
    try {
      const data = trackViewSchema.parse(request.body);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find or create analytics record for today
      const analytics = await prisma.postAnalytics.upsert({
        where: {
          postId_date: {
            postId: data.postId,
            date: today,
          },
        },
        update: {
          views: {
            increment: 1,
          },
        },
        create: {
          postId: data.postId,
          date: today,
          views: 1,
          uniqueViews: 1,
        },
      });

      // Also increment the view count on the blog post itself
      await prisma.blogPost.update({
        where: { id: data.postId },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      reply.send({ success: true, views: analytics.views });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Track share for analytics
  const trackShareSchema = z.object({
    postId: z.string(),
    platform: z.string(),
  });

  app.post('/analytics/track-share', async (request, reply) => {
    try {
      const data = trackShareSchema.parse(request.body);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update analytics record for today
      await prisma.postAnalytics.upsert({
        where: {
          postId_date: {
            postId: data.postId,
            date: today,
          },
        },
        update: {
          shares: {
            increment: 1,
          },
        },
        create: {
          postId: data.postId,
          date: today,
          views: 0,
          uniqueViews: 0,
          shares: 1,
        },
      });

      reply.send({ success: true });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Get analytics for a specific post
  const analyticsQuerySchema = z.object({
    postId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });

  app.get(
    '/admin/analytics/posts',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const query = analyticsQuerySchema.parse(request.query);

        const where: any = {
          postId: query.postId,
        };

        if (query.startDate && query.endDate) {
          where.date = {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          };
        }

        const analytics = await prisma.postAnalytics.findMany({
          where,
          orderBy: {
            date: 'desc',
          },
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        });

        const summary = await prisma.postAnalytics.aggregate({
          where,
          _sum: {
            views: true,
            uniqueViews: true,
            shares: true,
          },
          _avg: {
            avgTimeOnPage: true,
            bounceRate: true,
          },
        });

        reply.send({
          analytics,
          summary: {
            totalViews: summary._sum.views || 0,
            totalUniqueViews: summary._sum.uniqueViews || 0,
            totalShares: summary._sum.shares || 0,
            avgTimeOnPage: Math.round(summary._avg.avgTimeOnPage || 0),
            avgBounceRate: Math.round((summary._avg.bounceRate || 0) * 100) / 100,
          },
        });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );

  // Get overall blog analytics
  app.get(
    '/admin/analytics/blog-overview',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      try {
        const periodSchema = z.object({
          period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
        });

        const { period } = periodSchema.parse(request.query);

        const daysBack = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
        }[period];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        startDate.setHours(0, 0, 0, 0);

        // Get top posts by views
        const topPosts = await prisma.postAnalytics.groupBy({
          by: ['postId'],
          where: {
            date: {
              gte: startDate,
            },
          },
          _sum: {
            views: true,
            shares: true,
          },
          orderBy: {
            _sum: {
              views: 'desc',
            },
          },
          take: 10,
        });

        // Get post details for top posts
        const topPostsWithDetails = await Promise.all(
          topPosts.map(async (post) => {
            const postDetails = await prisma.blogPost.findUnique({
              where: { id: post.postId },
              select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
                author: {
                  select: {
                    name: true,
                  },
                },
              },
            });

            return {
              ...postDetails,
              views: post._sum.views || 0,
              shares: post._sum.shares || 0,
            };
          })
        );

        // Get daily analytics for the period
        const dailyAnalytics = await prisma.postAnalytics.groupBy({
          by: ['date'],
          where: {
            date: {
              gte: startDate,
            },
          },
          _sum: {
            views: true,
            uniqueViews: true,
            shares: true,
          },
          orderBy: {
            date: 'asc',
          },
        });

        // Get total stats
        const totalStats = await prisma.postAnalytics.aggregate({
          where: {
            date: {
              gte: startDate,
            },
          },
          _sum: {
            views: true,
            uniqueViews: true,
            shares: true,
          },
        });

        reply.send({
          period,
          totalStats: {
            views: totalStats._sum.views || 0,
            uniqueViews: totalStats._sum.uniqueViews || 0,
            shares: totalStats._sum.shares || 0,
          },
          topPosts: topPostsWithDetails,
          dailyAnalytics: dailyAnalytics.map((day) => ({
            date: day.date,
            views: day._sum.views || 0,
            uniqueViews: day._sum.uniqueViews || 0,
            shares: day._sum.shares || 0,
          })),
        });
      } catch (error: unknown) {
        reply.status(400).send({ error: (error as Error).message });
      }
    }
  );
}

export default registerAnalyticsRoutes;