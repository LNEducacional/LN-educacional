"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseModules = getCourseModules;
exports.createModule = createModule;
exports.updateModule = updateModule;
exports.deleteModule = deleteModule;
exports.createLesson = createLesson;
exports.updateLesson = updateLesson;
exports.deleteLesson = deleteLesson;
exports.getUserCourseProgress = getUserCourseProgress;
exports.updateLessonProgress = updateLessonProgress;
exports.enrollUserInCourse = enrollUserInCourse;
exports.getUserEnrollments = getUserEnrollments;
exports.checkEnrollment = checkEnrollment;
const prisma_1 = require("../prisma");
async function getCourseModules(courseId) {
    return prisma_1.prisma.courseModule.findMany({
        where: { courseId },
        include: {
            lessons: {
                orderBy: { order: 'asc' },
            },
        },
        orderBy: { order: 'asc' },
    });
}
async function createModule(data) {
    return prisma_1.prisma.courseModule.create({
        data,
        include: { lessons: true },
    });
}
async function updateModule(id, data) {
    return prisma_1.prisma.courseModule.update({
        where: { id },
        data,
        include: { lessons: true },
    });
}
async function deleteModule(id) {
    return prisma_1.prisma.courseModule.delete({
        where: { id },
    });
}
async function createLesson(data) {
    return prisma_1.prisma.courseLesson.create({
        data,
    });
}
async function updateLesson(id, data) {
    return prisma_1.prisma.courseLesson.update({
        where: { id },
        data,
    });
}
async function deleteLesson(id) {
    return prisma_1.prisma.courseLesson.delete({
        where: { id },
    });
}
async function getUserCourseProgress(userId, courseId) {
    const modules = await prisma_1.prisma.courseModule.findMany({
        where: { courseId },
        include: {
            lessons: {
                include: {
                    progress: {
                        where: { userId },
                    },
                },
            },
        },
        orderBy: { order: 'asc' },
    });
    const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const completedLessons = modules.reduce((acc, mod) => acc + mod.lessons.filter((lesson) => lesson.progress.some((p) => p.completed)).length, 0);
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
        modules,
        totalLessons,
        completedLessons,
        progressPercentage,
    };
}
async function updateLessonProgress(data) {
    const { userId, lessonId, ...updateData } = data;
    return prisma_1.prisma.courseProgress.upsert({
        where: {
            userId_lessonId: {
                userId,
                lessonId,
            },
        },
        create: {
            userId,
            lessonId,
            ...updateData,
            completedAt: updateData.completed ? new Date() : null,
        },
        update: {
            ...updateData,
            completedAt: updateData.completed ? new Date() : null,
        },
    });
}
async function enrollUserInCourse(userId, courseId) {
    return prisma_1.prisma.courseEnrollment.create({
        data: {
            userId,
            courseId,
        },
    });
}
async function getUserEnrollments(userId) {
    return prisma_1.prisma.courseEnrollment.findMany({
        where: { userId },
        include: {
            course: true,
        },
        orderBy: { enrolledAt: 'desc' },
    });
}
async function checkEnrollment(userId, courseId) {
    const enrollment = await prisma_1.prisma.courseEnrollment.findUnique({
        where: {
            userId_courseId: {
                userId,
                courseId,
            },
        },
    });
    return !!enrollment;
}
//# sourceMappingURL=course-content.service.js.map