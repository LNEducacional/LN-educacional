const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'teste17@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      }
    });
    
    console.log('Usuário:', user);
    console.log('Tem senha?', user?.password ? 'SIM' : 'NÃO');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
