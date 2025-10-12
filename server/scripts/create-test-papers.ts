import { AcademicArea, PaperType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const paperTypes = Object.values(PaperType);
const academicAreas = Object.values(AcademicArea);

const sampleTitles = [
  'Análise Comparativa de Sistemas Educacionais',
  'Impacto da Tecnologia na Sociedade Moderna',
  'Gestão Estratégica em Pequenas Empresas',
  'Sustentabilidade Ambiental e Desenvolvimento',
  'Psicologia Organizacional e Produtividade',
  'Direitos Humanos na Era Digital',
  'Inovação Tecnológica em Saúde',
  'Marketing Digital e Comportamento do Consumidor',
  'Educação Inclusiva: Desafios e Oportunidades',
  'Economia Circular e Sustentabilidade',
];

const sampleAuthors = [
  'Dr. Maria Silva Santos',
  'Prof. João Carlos Oliveira',
  'Dra. Ana Paula Costa',
  'Prof. Roberto Lima',
  'Dra. Fernanda Rodrigues',
  'Prof. Carlos Eduardo Sousa',
  'Dra. Juliana Machado',
  'Prof. Pedro Henrique Alves',
  'Dra. Camila Ferreira',
  'Prof. Ricardo Mendes',
];

const sampleKeywords = [
  'análise, pesquisa, metodologia',
  'tecnologia, inovação, sociedade',
  'gestão, estratégia, negócios',
  'sustentabilidade, meio ambiente, desenvolvimento',
  'psicologia, organizacional, trabalho',
  'direitos humanos, tecnologia, ética',
  'saúde, tecnologia, medicina',
  'marketing, digital, consumidor',
  'educação, inclusão, pedagogia',
  'economia, sustentabilidade, circular',
];

const generateDescription = (title: string, area: AcademicArea): string => {
  return `Este trabalho acadêmico apresenta uma análise detalhada sobre "${title}" no contexto da área de ${area}. O estudo aborda aspectos teóricos e práticos, oferecendo insights valiosos para estudantes e profissionais da área. Desenvolvido com rigor metodológico e fundamentação teórica sólida, este material representa uma contribuição significativa para o conhecimento acadêmico.`;
};

const getRandomPrice = (): number => {
  const prices = [0, 1990, 2990, 3990, 4990, 5990, 7990, 9990, 12990, 15990];
  return prices[Math.floor(Math.random() * prices.length)];
};

const getRandomPageCount = (): number => {
  return Math.floor(Math.random() * 80) + 10; // Entre 10 e 89 páginas
};

const getSampleThumbnail = (index: number): string => {
  const imageIds = [
    '1481627834876-b7833e8f5570', // biblioteca
    '1507003211169-0a1dd7a6bd45', // estudos
    '1434030216411-0b3b2b2b2b2b', // livros
    '1513475382585-d06b60c1a6b7', // educação
    '1456513080510-7bf3a84b82df', // pesquisa
    '1542744173-40e7a9b9d566', // universidade
    '1521587760-8ae86b3bf2f7', // ciência
    '1586953208760-a96c63de7e86', // tecnologia
    '1507003211169-0a1dd7a6bd45', // medicina
    '1434030216411-0b3b2b2b2b2b', // direito
  ];

  return `https://images.unsplash.com/photo-${imageIds[index % imageIds.length]}?w=400&h=300&fit=crop&crop=center`;
};

const getSampleFileUrl = (title: string): string => {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `https://cdn.lneducacional.com.br/papers/${slug}.pdf`;
};

async function createTestPapers() {
  console.log('🚀 Iniciando criação de 50 papers de teste...');

  try {
    const papers = [];

    for (let i = 0; i < 50; i++) {
      const titleIndex = i % sampleTitles.length;
      const authorIndex = i % sampleAuthors.length;
      const keywordsIndex = i % sampleKeywords.length;
      const paperType = paperTypes[i % paperTypes.length];
      const academicArea = academicAreas[i % academicAreas.length];

      const baseTitle = sampleTitles[titleIndex];
      const title = `${baseTitle} ${i + 1}`;
      const price = getRandomPrice();
      const isFree = price === 0;

      const paper = {
        title,
        description: generateDescription(title, academicArea),
        paperType,
        academicArea,
        price,
        pageCount: getRandomPageCount(),
        authorName: sampleAuthors[authorIndex],
        language: 'pt-BR',
        keywords: sampleKeywords[keywordsIndex],
        previewUrl: `${getSampleFileUrl(title).replace('.pdf', '-preview.pdf')}`,
        fileUrl: getSampleFileUrl(title),
        thumbnailUrl: getSampleThumbnail(i),
        isFree,
      };

      papers.push(paper);
    }

    // Inserir todos os papers em batch
    const result = await prisma.paper.createMany({
      data: papers,
      skipDuplicates: true,
    });

    console.log(`✅ ${result.count} papers de teste criados com sucesso!`);

    // Mostrar estatísticas
    const totalPapers = await prisma.paper.count();
    const freePapers = await prisma.paper.count({ where: { isFree: true } });
    const paidPapers = totalPapers - freePapers;

    console.log('\n📊 Estatísticas do banco:');
    console.log(`   Total de papers: ${totalPapers}`);
    console.log(`   Papers gratuitos: ${freePapers}`);
    console.log(`   Papers pagos: ${paidPapers}`);

    // Contar por tipo
    console.log('\n📚 Por tipo:');
    for (const type of paperTypes) {
      const count = await prisma.paper.count({ where: { paperType: type } });
      if (count > 0) {
        console.log(`   ${type}: ${count}`);
      }
    }

    // Contar por área
    console.log('\n🎓 Por área acadêmica:');
    for (const area of academicAreas) {
      const count = await prisma.paper.count({ where: { academicArea: area } });
      if (count > 0) {
        console.log(`   ${area}: ${count}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao criar papers de teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  createTestPapers()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export { createTestPapers };
