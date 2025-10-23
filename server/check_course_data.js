const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourseData() {
  try {
    // 1. Verificar cursos
    const courses = await prisma.course.findMany({
      select: { id: true, title: true }
    });
    console.log('\n=== CURSOS ===');
    console.log(JSON.stringify(courses, null, 2));

    if (courses.length > 0) {
      const courseId = courses[0].id;
      
      // 2. Verificar módulos do primeiro curso
      const modules = await prisma.courseModule.findMany({
        where: { courseId },
        select: { id: true, title: true, order: true }
      });
      console.log('\n=== MÓDULOS DO CURSO ' + courses[0].title + ' ===');
      console.log(JSON.stringify(modules, null, 2));

      if (modules.length > 0) {
        // 3. Verificar lições do primeiro módulo
        const lessons = await prisma.courseLesson.findMany({
          where: { moduleId: modules[0].id },
          select: { id: true, title: true, videoUrl: true, order: true }
        });
        console.log('\n=== LIÇÕES DO MÓDULO ' + modules[0].title + ' ===');
        console.log(JSON.stringify(lessons, null, 2));
      }

      // 4. Verificar enrollments
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { courseId },
        include: { user: { select: { email: true } } }
      });
      console.log('\n=== ENROLLMENTS DO CURSO ===');
      console.log(JSON.stringify(enrollments, null, 2));

      // 5. Verificar orders completadas
      const orders = await prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          items: { some: { courseId } }
        },
        include: {
          user: { select: { email: true } },
          items: true
        }
      });
      console.log('\n=== ORDERS COMPLETADAS DO CURSO ===');
      console.log(JSON.stringify(orders, null, 2));
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourseData();
