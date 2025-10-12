import type { CourseLesson, CourseModule } from '@prisma/client';
import { prisma } from '../prisma';

export async function getCourseModules(courseId: string) {
  return prisma.courseModule.findMany({
    where: { courseId },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });
}

export async function createModule(data: {
  courseId: string;
  title: string;
  description?: string;
  order: number;
}) {
  return prisma.courseModule.create({
    data,
    include: { lessons: true },
  });
}

export async function updateModule(id: string, data: Partial<CourseModule>) {
  return prisma.courseModule.update({
    where: { id },
    data,
    include: { lessons: true },
  });
}

export async function deleteModule(id: string) {
  return prisma.courseModule.delete({
    where: { id },
  });
}

export async function createLesson(data: {
  moduleId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  content?: string;
  duration?: number;
  order: number;
}) {
  return prisma.courseLesson.create({
    data,
  });
}

export async function updateLesson(id: string, data: Partial<CourseLesson>) {
  return prisma.courseLesson.update({
    where: { id },
    data,
  });
}

export async function deleteLesson(id: string) {
  return prisma.courseLesson.delete({
    where: { id },
  });
}

export async function getUserCourseProgress(userId: string, courseId: string) {
  const modules = await prisma.courseModule.findMany({
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
  const completedLessons = modules.reduce(
    (acc, mod) =>
      acc + mod.lessons.filter((lesson) => lesson.progress.some((p) => p.completed)).length,
    0
  );

  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    modules,
    totalLessons,
    completedLessons,
    progressPercentage,
  };
}

export async function updateLessonProgress(data: {
  userId: string;
  lessonId: string;
  completed?: boolean;
  watchTime?: number;
}) {
  const { userId, lessonId, ...updateData } = data;

  return prisma.courseProgress.upsert({
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

export async function enrollUserInCourse(userId: string, courseId: string) {
  return prisma.courseEnrollment.create({
    data: {
      userId,
      courseId,
    },
  });
}

export async function getUserEnrollments(userId: string) {
  return prisma.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: true,
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

export async function checkEnrollment(userId: string, courseId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  return !!enrollment;
}
