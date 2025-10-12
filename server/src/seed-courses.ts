import { AcademicArea, CourseStatus } from '@prisma/client';
import { prisma } from './prisma';

async function seedCourses() {
  console.log('🌱 Iniciando seed de cursos...');

  // Verificar se já existem cursos
  const existingCount = await prisma.course.count();
  console.log(`📊 Cursos existentes: ${existingCount}`);

  if (existingCount > 0) {
    console.log('⚠️  Já existem cursos no banco. Deseja continuar? (Ctrl+C para cancelar)');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const courses = [
    {
      title: 'Introdução ao TypeScript',
      description:
        'Aprenda TypeScript do zero, desde os conceitos básicos até recursos avançados. Ideal para desenvolvedores que querem adicionar tipagem estática ao JavaScript.',
      academicArea: AcademicArea.ENGINEERING,
      instructorName: 'Prof. João Silva',
      instructorBio:
        'Especialista em TypeScript com 10 anos de experiência em desenvolvimento web. Trabalhou em empresas como Google e Microsoft.',
      price: 19900, // R$ 199,00
      duration: 1200, // 20 horas em minutos
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=TypeScript+Course',
    },
    {
      title: 'React 19 Avançado',
      description:
        'Domine o React 19 com suas features mais recentes: Server Components, Actions, use hook e muito mais. Curso completo para desenvolvedores experientes.',
      academicArea: AcademicArea.ENGINEERING,
      instructorName: 'Profa. Maria Santos',
      instructorBio:
        'Desenvolvedora front-end sênior, contribuidora do React e palestrante internacional. 8 anos de experiência com React.',
      price: 29900, // R$ 299,00
      duration: 1800, // 30 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=React+Advanced',
    },
    {
      title: 'Node.js e Fastify na Prática',
      description:
        'Construa APIs REST de alta performance com Node.js e Fastify. Aprenda sobre autenticação, banco de dados, testes e deploy.',
      academicArea: AcademicArea.ENGINEERING,
      instructorName: 'Prof. Carlos Mendes',
      instructorBio:
        'Backend engineer com foco em performance e escalabilidade. Ex-Netflix, atual tech lead.',
      price: 24900, // R$ 249,00
      duration: 1500, // 25 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Node.js+Course',
    },
    {
      title: 'Gestão de Projetos Ágeis',
      description:
        'Aprenda metodologias ágeis como Scrum e Kanban para gerenciar projetos de forma eficiente. Inclui certificação PMI-ACP prep.',
      academicArea: AcademicArea.ADMINISTRATION,
      instructorName: 'Prof. Ana Costa',
      instructorBio: 'PMP e Scrum Master certificada, 15 anos gerenciando projetos em TI.',
      price: 34900, // R$ 349,00
      duration: 2400, // 40 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Agile+Management',
    },
    {
      title: 'Introdução ao Direito Digital',
      description:
        'Entenda as leis que regem o mundo digital: LGPD, Marco Civil da Internet, crimes cibernéticos e proteção de dados.',
      academicArea: AcademicArea.LAW,
      instructorName: 'Dr. Roberto Alves',
      instructorBio: 'Advogado especializado em direito digital, professor universitário há 12 anos.',
      price: 18900, // R$ 189,00
      duration: 900, // 15 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Digital+Law',
    },
    {
      title: 'Psicologia Organizacional',
      description:
        'Compreenda o comportamento humano nas organizações. Gestão de pessoas, motivação, liderança e cultura organizacional.',
      academicArea: AcademicArea.PSYCHOLOGY,
      instructorName: 'Dra. Paula Ferreira',
      instructorBio: 'Psicóloga organizacional, consultora em RH de grandes empresas.',
      price: 21900, // R$ 219,00
      duration: 1200, // 20 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Organizational+Psychology',
    },
    {
      title: 'Contabilidade para Não Contadores',
      description:
        'Aprenda os fundamentos da contabilidade mesmo sem formação na área. Ideal para empreendedores e gestores.',
      academicArea: AcademicArea.ACCOUNTING,
      instructorName: 'Prof. Fernando Lima',
      instructorBio: 'Contador e consultor empresarial, especialista em ensinar contabilidade de forma simples.',
      price: 16900, // R$ 169,00
      duration: 1000, // 16.7 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Accounting+Basics',
    },
    {
      title: 'Fundamentos de Pedagogia Digital',
      description:
        'Metodologias de ensino online, ferramentas digitais para educação e design instrucional.',
      academicArea: AcademicArea.EDUCATION,
      instructorName: 'Profa. Beatriz Souza',
      instructorBio: 'Pedagoga com mestrado em tecnologias educacionais, consultora em EAD.',
      price: 19900, // R$ 199,00
      duration: 1100, // 18.3 horas
      status: CourseStatus.ACTIVE,
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Digital+Pedagogy',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const courseData of courses) {
    try {
      // Verificar se curso já existe pelo título
      const existing = await prisma.course.findFirst({
        where: { title: courseData.title },
      });

      if (existing) {
        console.log(`⏭️  Curso "${courseData.title}" já existe, pulando...`);
        skipped++;
        continue;
      }

      const course = await prisma.course.create({
        data: courseData,
      });

      console.log(`✅ Criado: ${course.title} (${course.id})`);
      created++;
    } catch (error) {
      console.error(`❌ Erro ao criar curso "${courseData.title}":`, error);
    }
  }

  const finalCount = await prisma.course.count();

  console.log('\n📊 Resumo:');
  console.log(`   Cursos criados: ${created}`);
  console.log(`   Cursos pulados: ${skipped}`);
  console.log(`   Total no banco: ${finalCount}`);
  console.log('\n✅ Seed concluído com sucesso!');
}

seedCourses()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro durante seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
