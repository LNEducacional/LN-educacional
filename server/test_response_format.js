const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simular a função getUserCourseProgress
async function getUserCourseProgress(userId, courseId) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('Você não está matriculado neste curso');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      instructorName: true,
      instructorBio: true,
      thumbnailUrl: true,
      academicArea: true,
      level: true,
      duration: true,
    },
  });

  if (!course) {
    throw new Error('Curso não encontrado');
  }

  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    include: {
      lessons: {
        include: {
          progress: {
            where: { userId },
          },
        },
        orderBy: { order: 'asc' },
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
    ...course,
    modules,
    totalLessons,
    completedLessons,
    progressPercentage,
    enrolledAt: enrollment.enrolledAt,
  };
}

async function test() {
  try {
    const userId = 'cmfnw14750000fc6j2gvlo76g'; // admin
    const courseId = 'cmh0y2a6r0002jmbjghgjct0x';
    
    const result = await getUserCourseProgress(userId, courseId);
    
    console.log('=== RESPOSTA DA API ===');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n\n=== ESTRUTURA ===');
    console.log('Tem course.title?', !!result.title);
    console.log('Tem modules?', !!result.modules);
    console.log('Quantidade de módulos:', result.modules?.length);
    console.log('Primeiro módulo tem lessons?', !!result.modules?.[0]?.lessons);
    console.log('Quantidade de lições no módulo 1:', result.modules?.[0]?.lessons?.length);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
