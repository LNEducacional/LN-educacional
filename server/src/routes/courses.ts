import type { FastifyPluginAsync } from 'fastify';
import * as courseService from '../prisma';
import { deleteCachePattern, getCache, setCache } from '../redis';
import * as contentService from '../services/course-content.service';
import { uploadFile } from '../services/upload.service';

const coursesRoutes: FastifyPluginAsync = async (app) => {
  // Public routes
  app.get('/courses', async (request, reply) => {
    const query = request.query as any;

    console.log('[COURSES] 📥 Request received:', { query });

    // Generate cache key based on query parameters
    const cacheKey = `courses:list:${JSON.stringify({
      area: query.area,
      page: query.page || '1',
      limit: query.limit || '12',
    })}`;

    console.log('[COURSES] 🔑 Cache key:', cacheKey);

    // Try to get from cache first
    const cached = await getCache(cacheKey);
    console.log('[COURSES] 💾 Cache result:', cached ? 'HIT' : 'MISS');

    if (cached) {
      console.log('[COURSES] ✅ Returning cached data');
      return reply.send(cached);
    }

    console.log('[COURSES] 📊 Fetching from database...');
    const courses = await courseService.getCourses({
      area: query.area,
      skip: (Number.parseInt(query.page || '1') - 1) * Number.parseInt(query.limit || '12'),
      take: Number.parseInt(query.limit || '12'),
    });

    console.log('[COURSES] ✅ Database returned:', { total: courses.total, count: courses.courses?.length });

    // Cache for 5 minutes (300 seconds)
    await setCache(cacheKey, courses, 300);
    console.log('[COURSES] 💾 Data cached');

    console.log('[COURSES] 📤 Sending response...');
    return reply.send(courses);
  });

  app.get('/courses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // For non-authenticated users, use cache for course details
    if (!request.currentUser) {
      const cacheKey = `course:${id}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return reply.send(cached);
      }
    }

    const course = await courseService.getCourseById(id);

    if (!course) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    if (request.currentUser) {
      isEnrolled = await contentService.checkEnrollment(request.currentUser.id, id);
    }

    const result = { ...course, isEnrolled };

    // Cache only for non-authenticated users (no enrollment info)
    if (!request.currentUser) {
      const cacheKey = `course:${id}`;
      await setCache(cacheKey, result, 600); // 10 minutes
    }

    return reply.send(result);
  });

  app.get('/courses/:id/modules', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Cache course modules for public access
    const cacheKey = `course:${id}:modules`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    const modules = await contentService.getCourseModules(id);

    // Cache for 10 minutes
    await setCache(cacheKey, modules, 600);
    return reply.send(modules);
  });

  // Protected routes - Student
  app.post('/courses/:id/enroll', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.currentUser!.id;

    // Check if already enrolled
    const isEnrolled = await contentService.checkEnrollment(userId, id);
    if (isEnrolled) {
      return reply.status(400).send({ error: 'Already enrolled' });
    }

    const enrollment = await contentService.enrollUserInCourse(userId, id);
    return reply.status(201).send(enrollment);
  });

  app.get('/courses/:id/progress', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.currentUser!.id;

    const progress = await contentService.getUserCourseProgress(userId, id);
    return reply.send(progress);
  });

  app.put(
    '/lessons/:lessonId/progress',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { lessonId } = request.params as { lessonId: string };
      const userId = request.currentUser!.id;
      const { completed, watchTime } = request.body as any;

      const progress = await contentService.updateLessonProgress({
        userId,
        lessonId,
        completed,
        watchTime,
      });

      return reply.send(progress);
    }
  );

  // Admin routes
  app.post(
    '/admin/courses',
    {
      preHandler: [app.authenticate, app.requireAdmin],
    },
    async (request, reply) => {
      const data = request.body as any;
      const course = await courseService.createCourse(data);

      // Invalidate courses list cache
      await deleteCachePattern('courses:list:*');

      return reply.status(201).send(course);
    }
  );

  app.post(
    '/admin/courses/:id/thumbnail',
    {
      preHandler: [app.authenticate, app.requireAdmin],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const uploaded = await uploadFile(data, 'thumbnails');
      await courseService.updateCourse(id, { thumbnailUrl: uploaded.url });

      // Invalidate cache for this course and lists
      await deleteCachePattern(`course:${id}*`);
      await deleteCachePattern('courses:list:*');

      return reply.send({ thumbnailUrl: uploaded.url });
    }
  );

  app.post(
    '/admin/courses/:courseId/modules',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const data = request.body as any;

      const module = await contentService.createModule({
        ...data,
        courseId,
      });

      // Invalidate cache for course modules
      await deleteCachePattern(`course:${courseId}:modules`);

      return reply.status(201).send(module);
    }
  );

  app.put(
    '/admin/modules/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      // Get courseId before updating to invalidate cache
      const existingModule = await courseService.prisma.courseModule.findUnique({
        where: { id },
        select: { courseId: true },
      });

      const module = await contentService.updateModule(id, data);

      if (existingModule) {
        // Invalidate cache for course modules
        await deleteCachePattern(`course:${existingModule.courseId}:modules`);
      }

      return reply.send(module);
    }
  );

  app.delete(
    '/admin/modules/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Get courseId before deleting to invalidate cache
      const existingModule = await courseService.prisma.courseModule.findUnique({
        where: { id },
        select: { courseId: true },
      });

      await contentService.deleteModule(id);

      if (existingModule) {
        // Invalidate cache for course modules
        await deleteCachePattern(`course:${existingModule.courseId}:modules`);
      }

      return reply.status(204).send();
    }
  );

  app.post(
    '/admin/modules/:moduleId/lessons',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { moduleId } = request.params as { moduleId: string };
      const data = request.body as any;

      // Get courseId to invalidate cache
      const module = await courseService.prisma.courseModule.findUnique({
        where: { id: moduleId },
        select: { courseId: true },
      });

      const lesson = await contentService.createLesson({
        ...data,
        moduleId,
      });

      if (module) {
        // Invalidate cache for course modules
        await deleteCachePattern(`course:${module.courseId}:modules`);
      }

      return reply.status(201).send(lesson);
    }
  );

  app.post(
    '/admin/lessons/:id/video',
    {
      preHandler: [app.authenticate, app.requireAdmin],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Get courseId to invalidate cache
      const lesson = await courseService.prisma.courseLesson.findUnique({
        where: { id },
        include: { module: { select: { courseId: true } } },
      });

      const uploaded = await uploadFile(data, 'videos');
      await contentService.updateLesson(id, { videoUrl: uploaded.url });

      if (lesson?.module) {
        // Invalidate cache for course modules
        await deleteCachePattern(`course:${lesson.module.courseId}:modules`);
      }

      return reply.send({ videoUrl: uploaded.url });
    }
  );

  app.put(
    '/admin/courses/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const course = await courseService.updateCourse(id, data);

      // Invalidate cache for this course and lists
      await deleteCachePattern(`course:${id}*`);
      await deleteCachePattern('courses:list:*');

      return reply.send(course);
    }
  );

  app.delete(
    '/admin/courses/:id',
    { preHandler: [app.authenticate, app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await courseService.deleteCourse(id);

      // Invalidate cache for this course and lists
      await deleteCachePattern(`course:${id}*`);
      await deleteCachePattern('courses:list:*');

      return reply.status(204).send();
    }
  );
};



export default coursesRoutes;
