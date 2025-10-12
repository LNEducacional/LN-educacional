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
const courseService = __importStar(require("../prisma"));
const redis_1 = require("../redis");
const contentService = __importStar(require("../services/course-content.service"));
const upload_service_1 = require("../services/upload.service");
const coursesRoutes = async (app) => {
    // Public routes
    app.get('/courses', async (request, reply) => {
        const query = request.query;
        console.log('[COURSES] 📥 Request received:', { query });
        // Generate cache key based on query parameters
        const cacheKey = `courses:list:${JSON.stringify({
            area: query.area,
            page: query.page || '1',
            limit: query.limit || '12',
        })}`;
        console.log('[COURSES] 🔑 Cache key:', cacheKey);
        // Try to get from cache first
        const cached = await (0, redis_1.getCache)(cacheKey);
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
        await (0, redis_1.setCache)(cacheKey, courses, 300);
        console.log('[COURSES] 💾 Data cached');
        console.log('[COURSES] 📤 Sending response...');
        return reply.send(courses);
    });
    app.get('/courses/:id', async (request, reply) => {
        const { id } = request.params;
        // For non-authenticated users, use cache for course details
        if (!request.currentUser) {
            const cacheKey = `course:${id}`;
            const cached = await (0, redis_1.getCache)(cacheKey);
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
            await (0, redis_1.setCache)(cacheKey, result, 600); // 10 minutes
        }
        return reply.send(result);
    });
    app.get('/courses/:id/modules', async (request, reply) => {
        const { id } = request.params;
        // Cache course modules for public access
        const cacheKey = `course:${id}:modules`;
        const cached = await (0, redis_1.getCache)(cacheKey);
        if (cached) {
            return reply.send(cached);
        }
        const modules = await contentService.getCourseModules(id);
        // Cache for 10 minutes
        await (0, redis_1.setCache)(cacheKey, modules, 600);
        return reply.send(modules);
    });
    // Protected routes - Student
    app.post('/courses/:id/enroll', { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.currentUser.id;
        // Check if already enrolled
        const isEnrolled = await contentService.checkEnrollment(userId, id);
        if (isEnrolled) {
            return reply.status(400).send({ error: 'Already enrolled' });
        }
        const enrollment = await contentService.enrollUserInCourse(userId, id);
        return reply.status(201).send(enrollment);
    });
    app.get('/courses/:id/progress', { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.currentUser.id;
        const progress = await contentService.getUserCourseProgress(userId, id);
        return reply.send(progress);
    });
    app.put('/lessons/:lessonId/progress', { preHandler: app.authenticate }, async (request, reply) => {
        const { lessonId } = request.params;
        const userId = request.currentUser.id;
        const { completed, watchTime } = request.body;
        const progress = await contentService.updateLessonProgress({
            userId,
            lessonId,
            completed,
            watchTime,
        });
        return reply.send(progress);
    });
    // Admin routes
    app.post('/admin/courses', {
        preHandler: [app.authenticate, app.requireAdmin],
    }, async (request, reply) => {
        const data = request.body;
        const course = await courseService.createCourse(data);
        // Invalidate courses list cache
        await (0, redis_1.deleteCachePattern)('courses:list:*');
        return reply.status(201).send(course);
    });
    app.post('/admin/courses/:id/thumbnail', {
        preHandler: [app.authenticate, app.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }
        const uploaded = await (0, upload_service_1.uploadFile)(data, 'thumbnails');
        await courseService.updateCourse(id, { thumbnailUrl: uploaded.url });
        // Invalidate cache for this course and lists
        await (0, redis_1.deleteCachePattern)(`course:${id}*`);
        await (0, redis_1.deleteCachePattern)('courses:list:*');
        return reply.send({ thumbnailUrl: uploaded.url });
    });
    app.post('/admin/courses/:courseId/modules', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { courseId } = request.params;
        const data = request.body;
        const module = await contentService.createModule({
            ...data,
            courseId,
        });
        // Invalidate cache for course modules
        await (0, redis_1.deleteCachePattern)(`course:${courseId}:modules`);
        return reply.status(201).send(module);
    });
    app.put('/admin/modules/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        // Get courseId before updating to invalidate cache
        const existingModule = await courseService.prisma.courseModule.findUnique({
            where: { id },
            select: { courseId: true },
        });
        const module = await contentService.updateModule(id, data);
        if (existingModule) {
            // Invalidate cache for course modules
            await (0, redis_1.deleteCachePattern)(`course:${existingModule.courseId}:modules`);
        }
        return reply.send(module);
    });
    app.delete('/admin/modules/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        // Get courseId before deleting to invalidate cache
        const existingModule = await courseService.prisma.courseModule.findUnique({
            where: { id },
            select: { courseId: true },
        });
        await contentService.deleteModule(id);
        if (existingModule) {
            // Invalidate cache for course modules
            await (0, redis_1.deleteCachePattern)(`course:${existingModule.courseId}:modules`);
        }
        return reply.status(204).send();
    });
    app.post('/admin/modules/:moduleId/lessons', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { moduleId } = request.params;
        const data = request.body;
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
            await (0, redis_1.deleteCachePattern)(`course:${module.courseId}:modules`);
        }
        return reply.status(201).send(lesson);
    });
    app.post('/admin/lessons/:id/video', {
        preHandler: [app.authenticate, app.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }
        // Get courseId to invalidate cache
        const lesson = await courseService.prisma.courseLesson.findUnique({
            where: { id },
            include: { module: { select: { courseId: true } } },
        });
        const uploaded = await (0, upload_service_1.uploadFile)(data, 'videos');
        await contentService.updateLesson(id, { videoUrl: uploaded.url });
        if (lesson?.module) {
            // Invalidate cache for course modules
            await (0, redis_1.deleteCachePattern)(`course:${lesson.module.courseId}:modules`);
        }
        return reply.send({ videoUrl: uploaded.url });
    });
    app.put('/admin/courses/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        const course = await courseService.updateCourse(id, data);
        // Invalidate cache for this course and lists
        await (0, redis_1.deleteCachePattern)(`course:${id}*`);
        await (0, redis_1.deleteCachePattern)('courses:list:*');
        return reply.send(course);
    });
    app.delete('/admin/courses/:id', { preHandler: [app.authenticate, app.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        await courseService.deleteCourse(id);
        // Invalidate cache for this course and lists
        await (0, redis_1.deleteCachePattern)(`course:${id}*`);
        await (0, redis_1.deleteCachePattern)('courses:list:*');
        return reply.status(204).send();
    });
};
exports.default = coursesRoutes;
//# sourceMappingURL=courses.js.map