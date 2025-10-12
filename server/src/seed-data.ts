import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados...');

  // ========================================
  // 1. FREE PAPERS (12)
  // ========================================
  console.log('\n📄 Criando trabalhos gratuitos...');
  
  const freePapers = [
    {
      title: 'Introdução à Administração Moderna',
      description: 'Uma visão geral sobre os conceitos fundamentais da administração contemporânea, abordando planejamento estratégico, organização e controle.',
      paperType: 'ARTICLE' as any,
      academicArea: 'ADMINISTRATION' as any,
      price: 0,
      pageCount: 15,
      authorName: 'Dr. Carlos Silva',
      language: 'pt-BR',
      keywords: 'administração, planejamento, estratégia',
      fileUrl: '/uploads/papers/free/admin-intro.pdf',
      thumbnailUrl: '/uploads/thumbnails/admin-intro.jpg',
      isFree: true,
    },
    {
      title: 'Direito Constitucional: Princípios Fundamentais',
      description: 'Análise dos princípios fundamentais da Constituição Federal brasileira e sua aplicação prática.',
      paperType: 'REVIEW' as any,
      academicArea: 'LAW' as any,
      price: 0,
      pageCount: 20,
      authorName: 'Dra. Ana Oliveira',
      language: 'pt-BR',
      keywords: 'direito, constitucional, princípios',
      fileUrl: '/uploads/papers/free/direito-const.pdf',
      isFree: true,
    },
    {
      title: 'Metodologias Ativas na Educação',
      description: 'Estudo sobre metodologias ativas de ensino e sua aplicação em sala de aula.',
      paperType: 'ARTICLE' as any,
      academicArea: 'EDUCATION' as any,
      price: 0,
      pageCount: 18,
      authorName: 'Prof. João Santos',
      language: 'pt-BR',
      keywords: 'educação, metodologias, ensino',
      fileUrl: '/uploads/papers/free/metodologias.pdf',
      isFree: true,
    },
    {
      title: 'Fundamentos de Engenharia de Software',
      description: 'Conceitos básicos de engenharia de software, incluindo ciclo de vida e boas práticas.',
      paperType: 'SUMMARY' as any,
      academicArea: 'ENGINEERING' as any,
      price: 0,
      pageCount: 12,
      authorName: 'Eng. Pedro Costa',
      language: 'pt-BR',
      keywords: 'engenharia, software, desenvolvimento',
      fileUrl: '/uploads/papers/free/eng-software.pdf',
      isFree: true,
    },
    {
      title: 'Psicologia Organizacional Aplicada',
      description: 'Aplicação dos conceitos de psicologia no ambiente organizacional moderno.',
      paperType: 'ESSAY' as any,
      academicArea: 'PSYCHOLOGY' as any,
      price: 0,
      pageCount: 16,
      authorName: 'Dra. Maria Ferreira',
      language: 'pt-BR',
      keywords: 'psicologia, organizacional, RH',
      fileUrl: '/uploads/papers/free/psico-org.pdf',
      isFree: true,
    },
    {
      title: 'Saúde Pública no Brasil',
      description: 'Panorama atual do sistema de saúde pública brasileiro e seus desafios.',
      paperType: 'ARTICLE' as any,
      academicArea: 'HEALTH' as any,
      price: 0,
      pageCount: 22,
      authorName: 'Dr. Roberto Lima',
      language: 'pt-BR',
      keywords: 'saúde, pública, SUS',
      fileUrl: '/uploads/papers/free/saude-publica.pdf',
      isFree: true,
    },
    {
      title: 'Contabilidade Gerencial para Pequenas Empresas',
      description: 'Guia prático de contabilidade gerencial focado em pequenos negócios.',
      paperType: 'SUMMARY' as any,
      academicArea: 'ACCOUNTING' as any,
      price: 0,
      pageCount: 14,
      authorName: 'Contador José Alves',
      language: 'pt-BR',
      keywords: 'contabilidade, gerencial, PME',
      fileUrl: '/uploads/papers/free/cont-gerencial.pdf',
      isFree: true,
    },
    {
      title: 'História da Arte Brasileira',
      description: 'Panorama histórico da arte brasileira desde o período colonial até a contemporaneidade.',
      paperType: 'REVIEW' as any,
      academicArea: 'ARTS' as any,
      price: 0,
      pageCount: 25,
      authorName: 'Prof. Luciana Martins',
      language: 'pt-BR',
      keywords: 'arte, história, Brasil',
      fileUrl: '/uploads/papers/free/arte-brasileira.pdf',
      isFree: true,
    },
    {
      title: 'Economia Circular e Sustentabilidade',
      description: 'Análise do conceito de economia circular e sua importância para a sustentabilidade.',
      paperType: 'ARTICLE' as any,
      academicArea: 'ECONOMICS' as any,
      price: 0,
      pageCount: 19,
      authorName: 'Dra. Patricia Souza',
      language: 'pt-BR',
      keywords: 'economia, circular, sustentabilidade',
      fileUrl: '/uploads/papers/free/economia-circular.pdf',
      isFree: true,
    },
    {
      title: 'Sociologia Urbana Contemporânea',
      description: 'Estudo sociológico sobre as transformações das cidades contemporâneas.',
      paperType: 'ARTICLE' as any,
      academicArea: 'SOCIAL_SCIENCES' as any,
      price: 0,
      pageCount: 17,
      authorName: 'Prof. Ricardo Mendes',
      language: 'pt-BR',
      keywords: 'sociologia, urbana, cidades',
      fileUrl: '/uploads/papers/free/sociologia-urbana.pdf',
      isFree: true,
    },
    {
      title: 'Cálculo Diferencial e Integral I',
      description: 'Introdução ao cálculo diferencial e integral com exemplos práticos.',
      paperType: 'SUMMARY' as any,
      academicArea: 'EXACT_SCIENCES' as any,
      price: 0,
      pageCount: 30,
      authorName: 'Prof. André Cardoso',
      language: 'pt-BR',
      keywords: 'cálculo, matemática, integral',
      fileUrl: '/uploads/papers/free/calculo1.pdf',
      isFree: true,
    },
    {
      title: 'Filosofia Moderna: Descartes e Kant',
      description: 'Análise comparativa do pensamento de Descartes e Kant na filosofia moderna.',
      paperType: 'ESSAY' as any,
      academicArea: 'HUMANITIES' as any,
      price: 0,
      pageCount: 21,
      authorName: 'Dr. Fernando Rocha',
      language: 'pt-BR',
      keywords: 'filosofia, moderna, racionalismo',
      fileUrl: '/uploads/papers/free/filosofia-moderna.pdf',
      isFree: true,
    },
  ];

  let freePapersCreated = 0;
  for (const paper of freePapers) {
    const exists = await prisma.paper.findFirst({
      where: { title: paper.title },
    });
    if (!exists) {
      await prisma.paper.create({ data: paper as any });
      console.log(`  ✅ Criado: ${paper.title}`);
      freePapersCreated++;
    } else {
      console.log(`  ⏭️  Já existe: ${paper.title}`);
    }
  }

  // ========================================
  // 2. CUSTOM PAPERS (17)
  // ========================================
  console.log('\n📋 Criando trabalhos personalizados...');

  // Primeiro, criar um usuário de teste se não existir
  let testUser = await prisma.user.findUnique({
    where: { email: 'estudante@teste.com' },
  });

  if (!testUser) {
    const argon2 = require('argon2');
    const hashedPassword = await argon2.hash('senha123');
    testUser = await prisma.user.create({
      data: {
        email: 'estudante@teste.com',
        password: hashedPassword,
        name: 'Estudante Teste',
        role: 'STUDENT',
        verified: true,
      },
    });
    console.log('  ✅ Usuário teste criado');
  }

  const customPapers = [
    {
      userId: testUser.id,
      title: 'TCC: Gestão de Projetos Ágeis em Startups',
      description: 'Trabalho de conclusão de curso sobre metodologias ágeis aplicadas em startups de tecnologia.',
      paperType: 'THESIS' as any,
      academicArea: 'ADMINISTRATION' as any,
      pageCount: 60,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Incluir pesquisa de campo com 3 startups, framework Scrum detalhado',
      keywords: 'gestão, projetos, ágeis, startups, scrum',
      status: 'REQUESTED' as any,
      paymentStatus: 'PENDING',
    },
    {
      userId: testUser.id,
      title: 'Artigo: Direito Digital e LGPD',
      description: 'Artigo acadêmico sobre Lei Geral de Proteção de Dados e seus impactos.',
      paperType: 'ARTICLE' as any,
      academicArea: 'LAW' as any,
      pageCount: 15,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      urgency: 'URGENT' as any,
      requirements: 'Análise comparativa com GDPR europeu, casos práticos brasileiros',
      keywords: 'direito, digital, LGPD, privacidade',
      status: 'QUOTED' as any,
      quotedPrice: 45000,
      quotedAt: new Date(),
      paymentStatus: 'PENDING',
    },
    {
      userId: testUser.id,
      title: 'Dissertação: Inclusão na Educação Infantil',
      description: 'Dissertação de mestrado sobre práticas inclusivas na educação infantil.',
      paperType: 'DISSERTATION' as any,
      academicArea: 'EDUCATION' as any,
      pageCount: 120,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Pesquisa qualitativa, entrevistas com professores, análise de políticas públicas',
      keywords: 'educação, inclusão, infantil, mestrado',
      status: 'APPROVED' as any,
      quotedPrice: 150000,
      finalPrice: 150000,
      quotedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Projeto: Sistema de IoT para Smart Cities',
      description: 'Projeto de engenharia para implementação de IoT em cidades inteligentes.',
      paperType: 'PROJECT' as any,
      academicArea: 'ENGINEERING' as any,
      pageCount: 45,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      urgency: 'URGENT' as any,
      requirements: 'Diagramas técnicos, análise de viabilidade, protótipo conceitual',
      keywords: 'IoT, smart cities, engenharia, tecnologia',
      status: 'IN_PROGRESS' as any,
      quotedPrice: 80000,
      finalPrice: 80000,
      quotedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Resenha: Teorias da Personalidade',
      description: 'Resenha crítica sobre principais teorias da personalidade na psicologia.',
      paperType: 'REVIEW' as any,
      academicArea: 'PSYCHOLOGY' as any,
      pageCount: 10,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      urgency: 'VERY_URGENT' as any,
      requirements: 'Mínimo 5 teorias comparadas, referências atualizadas',
      keywords: 'psicologia, personalidade, teorias',
      status: 'REVIEW' as any,
      quotedPrice: 25000,
      finalPrice: 25000,
      quotedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Monografia: Epidemiologia do Diabetes',
      description: 'Monografia sobre aspectos epidemiológicos do diabetes mellitus no Brasil.',
      paperType: 'MONOGRAPHY' as any,
      academicArea: 'HEALTH' as any,
      pageCount: 50,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Dados do DATASUS, análise estatística, mapas epidemiológicos',
      keywords: 'saúde, diabetes, epidemiologia',
      status: 'COMPLETED' as any,
      quotedPrice: 70000,
      finalPrice: 70000,
      quotedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Estudo de Caso: Contabilidade Tributária',
      description: 'Análise de caso real sobre planejamento tributário em empresa de médio porte.',
      paperType: 'CASE_STUDY' as any,
      academicArea: 'ACCOUNTING' as any,
      pageCount: 25,
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      urgency: 'URGENT' as any,
      requirements: 'Empresa real (dados anonimizados), cálculos tributários, propostas',
      keywords: 'contabilidade, tributária, planejamento',
      status: 'REQUESTED' as any,
      paymentStatus: 'PENDING',
    },
    {
      userId: testUser.id,
      title: 'Redação: Crítica de Arte Contemporânea',
      description: 'Ensaio crítico sobre movimentos artísticos contemporâneos brasileiros.',
      paperType: 'ESSAY' as any,
      academicArea: 'ARTS' as any,
      pageCount: 12,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Análise de no mínimo 3 artistas contemporâneos',
      keywords: 'arte, contemporânea, crítica',
      status: 'QUOTED' as any,
      quotedPrice: 30000,
      quotedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PENDING',
    },
    {
      userId: testUser.id,
      title: 'Artigo: Macroeconomia Brasileira Pós-Pandemia',
      description: 'Análise macroeconômica do Brasil após a pandemia de COVID-19.',
      paperType: 'ARTICLE' as any,
      academicArea: 'ECONOMICS' as any,
      pageCount: 18,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Dados do IBGE e Banco Central, gráficos econômicos',
      keywords: 'economia, Brasil, pandemia, macroeconomia',
      status: 'CANCELLED' as any,
      paymentStatus: 'CANCELED',
    },
    {
      userId: testUser.id,
      title: 'TCC: Desigualdade Social no Brasil',
      description: 'Trabalho sobre causas e consequências da desigualdade social brasileira.',
      paperType: 'THESIS' as any,
      academicArea: 'SOCIAL_SCIENCES' as any,
      pageCount: 70,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Pesquisa quantitativa, dados históricos, propostas de políticas',
      keywords: 'sociologia, desigualdade, Brasil',
      status: 'APPROVED' as any,
      quotedPrice: 95000,
      finalPrice: 95000,
      quotedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Resumo: Física Quântica Aplicada',
      description: 'Resumo didático sobre aplicações práticas da física quântica.',
      paperType: 'SUMMARY' as any,
      academicArea: 'EXACT_SCIENCES' as any,
      pageCount: 8,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      urgency: 'VERY_URGENT' as any,
      requirements: 'Linguagem acessível, exemplos práticos',
      keywords: 'física, quântica, aplicações',
      status: 'REJECTED' as any,
      rejectionReason: 'Prazo muito curto para qualidade adequada',
      paymentStatus: 'CANCELED',
    },
    {
      userId: testUser.id,
      title: 'Ensaio: Ética na Era Digital',
      description: 'Discussão filosófica sobre dilemas éticos no mundo digital contemporâneo.',
      paperType: 'ESSAY' as any,
      academicArea: 'HUMANITIES' as any,
      pageCount: 14,
      deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Referências filosóficas clássicas e contemporâneas',
      keywords: 'filosofia, ética, digital',
      status: 'IN_PROGRESS' as any,
      quotedPrice: 35000,
      finalPrice: 35000,
      quotedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Projeto: Aplicativo Mobile de Delivery',
      description: 'Documentação completa para desenvolvimento de app de delivery.',
      paperType: 'PROJECT' as any,
      academicArea: 'ENGINEERING' as any,
      pageCount: 35,
      deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      urgency: 'URGENT' as any,
      requirements: 'UML, protótipos de tela, arquitetura de sistema',
      keywords: 'app, mobile, delivery, engenharia',
      status: 'QUOTED' as any,
      quotedPrice: 65000,
      quotedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PENDING',
    },
    {
      userId: testUser.id,
      title: 'Artigo: Marketing Digital para PMEs',
      description: 'Estratégias de marketing digital para pequenas e médias empresas.',
      paperType: 'ARTICLE' as any,
      academicArea: 'ADMINISTRATION' as any,
      pageCount: 16,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Casos de sucesso, métricas, ROI',
      keywords: 'marketing, digital, PME',
      status: 'COMPLETED' as any,
      quotedPrice: 40000,
      finalPrice: 40000,
      quotedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Resenha: Direito Penal Comparado',
      description: 'Análise comparativa de sistemas penais: Brasil, EUA e Europa.',
      paperType: 'REVIEW' as any,
      academicArea: 'LAW' as any,
      pageCount: 20,
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Legislações atualizadas, tabelas comparativas',
      keywords: 'direito, penal, comparado',
      status: 'REQUESTED' as any,
      paymentStatus: 'PENDING',
    },
    {
      userId: testUser.id,
      title: 'TCC: Neurociência da Aprendizagem',
      description: 'Estudo sobre processos neurológicos envolvidos na aprendizagem.',
      paperType: 'THESIS' as any,
      academicArea: 'PSYCHOLOGY' as any,
      pageCount: 65,
      deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Revisão bibliográfica extensa, neuroimagens',
      keywords: 'neurociência, aprendizagem, psicologia',
      status: 'REVIEW' as any,
      quotedPrice: 85000,
      finalPrice: 85000,
      quotedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
    {
      userId: testUser.id,
      title: 'Monografia: Telemedicina no Brasil',
      description: 'Análise regulatória e prática da telemedicina no contexto brasileiro.',
      paperType: 'MONOGRAPHY' as any,
      academicArea: 'HEALTH' as any,
      pageCount: 42,
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      urgency: 'NORMAL' as any,
      requirements: 'Legislação vigente, tecnologias utilizadas, estatísticas',
      keywords: 'telemedicina, saúde, regulação',
      status: 'APPROVED' as any,
      quotedPrice: 60000,
      finalPrice: 60000,
      quotedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
    },
  ];

  let customPapersCreated = 0;
  for (const paper of customPapers) {
    const exists = await prisma.customPaper.findFirst({
      where: { 
        userId: paper.userId,
        title: paper.title 
      },
    });
    if (!exists) {
      await prisma.customPaper.create({ data: paper as any });
      console.log(`  ✅ Criado: ${paper.title}`);
      customPapersCreated++;
    } else {
      console.log(`  ⏭️  Já existe: ${paper.title}`);
    }
  }

  // ========================================
  // 3. EBOOKS (15)
  // ========================================
  console.log('\n📚 Criando e-books...');

  const ebooks = [
    {
      title: 'Gestão Estratégica de Negócios',
      description: 'Guia completo sobre gestão estratégica para empresas modernas. 3ª edição. ISBN 978-85-123-4567-8. Editora Acadêmica, 2023.',
      authorName: 'Roberto Carlos Mendes',
      academicArea: 'ADMINISTRATION' as any,
      price: 4990,
      pageCount: 250,
      fileUrl: '/uploads/ebooks/gestao-estrategica.pdf',
      coverUrl: '/uploads/ebooks/covers/gestao-estrategica.jpg',
    },
    {
      title: 'Direito Civil Aplicado',
      description: 'Manual prático de direito civil com casos reais e jurisprudência. 5ª edição. ISBN 978-85-234-5678-9. Editora Jurídica, 2024.',
      authorName: 'Dra. Marina Silva Santos',
      academicArea: 'LAW' as any,
      price: 5990,
      pageCount: 380,
      fileUrl: '/uploads/ebooks/direito-civil.pdf',
      coverUrl: '/uploads/ebooks/covers/direito-civil.jpg',
    },
    {
      title: 'Pedagogia Contemporânea',
      description: 'Teorias e práticas pedagógicas para o século XXI. Editora Educacional, 2023.',
      authorName: 'Prof. João Pedro Oliveira',
      academicArea: 'EDUCATION' as any,
      price: 3990,
      pageCount: 180,
      fileUrl: '/uploads/ebooks/pedagogia-contemporanea.pdf',
    },
    {
      title: 'Engenharia de Software Ágil',
      description: 'Metodologias ágeis aplicadas ao desenvolvimento de software. 2ª edição. ISBN 978-85-345-6789-0. Tech Books, 2024.',
      authorName: 'Eng. Carlos Eduardo Lima',
      academicArea: 'ENGINEERING' as any,
      price: 6990,
      pageCount: 420,
      fileUrl: '/uploads/ebooks/engenharia-agil.pdf',
      coverUrl: '/uploads/ebooks/covers/engenharia-agil.jpg',
    },
    {
      title: 'Psicologia Cognitiva',
      description: 'Fundamentos da psicologia cognitiva e suas aplicações práticas. Editora Psique, 2023.',
      authorName: 'Dra. Patricia Fernandes',
      academicArea: 'PSYCHOLOGY' as any,
      price: 4490,
      pageCount: 290,
      fileUrl: '/uploads/ebooks/psicologia-cognitiva.pdf',
    },
    {
      title: 'Nutrição Clínica Avançada',
      description: 'Manual de nutrição clínica para profissionais da saúde. 4ª edição. ISBN 978-85-456-7890-1. Editora Saúde, 2024.',
      authorName: 'Dra. Ana Carolina Costa',
      academicArea: 'HEALTH' as any,
      price: 7990,
      pageCount: 450,
      fileUrl: '/uploads/ebooks/nutricao-clinica.pdf',
    },
    {
      title: 'Contabilidade Financeira Prática',
      description: 'Guia prático de contabilidade financeira para contadores. Editora Contábil, 2023.',
      authorName: 'Contador Marcos Vieira',
      academicArea: 'ACCOUNTING' as any,
      price: 5490,
      pageCount: 320,
      fileUrl: '/uploads/ebooks/contabilidade-financeira.pdf',
    },
    {
      title: 'História da Arte Mundial',
      description: 'Panorama completo da história da arte desde a pré-história. 2ª edição. ISBN 978-85-567-8901-2. Arte & Cultura Editora, 2023.',
      authorName: 'Prof. Fernando Augusto',
      academicArea: 'ARTS' as any,
      price: 5990,
      pageCount: 500,
      fileUrl: '/uploads/ebooks/historia-arte.pdf',
      coverUrl: '/uploads/ebooks/covers/historia-arte.jpg',
    },
    {
      title: 'Economia Internacional',
      description: 'Análise das relações econômicas internacionais contemporâneas. Editora Econômica, 2024.',
      authorName: 'Dr. Ricardo Almeida',
      academicArea: 'ECONOMICS' as any,
      price: 6490,
      pageCount: 380,
      fileUrl: '/uploads/ebooks/economia-internacional.pdf',
    },
    {
      title: 'Sociologia do Trabalho',
      description: 'Estudo sociológico das transformações no mundo do trabalho. Editora Social, 2023.',
      authorName: 'Dra. Juliana Rodrigues',
      academicArea: 'SOCIAL_SCIENCES' as any,
      price: 4290,
      pageCount: 240,
      fileUrl: '/uploads/ebooks/sociologia-trabalho.pdf',
    },
    {
      title: 'Matemática Aplicada à Engenharia',
      description: 'Conceitos matemáticos fundamentais para engenheiros. 6ª edição. ISBN 978-85-678-9012-3. Editora Técnica, 2024.',
      authorName: 'Prof. Dr. André Luiz',
      academicArea: 'EXACT_SCIENCES' as any,
      price: 7490,
      pageCount: 520,
      fileUrl: '/uploads/ebooks/matematica-engenharia.pdf',
    },
    {
      title: 'Filosofia Política Moderna',
      description: 'Principais correntes da filosofia política dos séculos XVIII a XX. Editora Filosófica, 2023.',
      authorName: 'Prof. Dr. Luís Fernando',
      academicArea: 'HUMANITIES' as any,
      price: 4990,
      pageCount: 310,
      fileUrl: '/uploads/ebooks/filosofia-politica.pdf',
    },
    {
      title: 'Marketing Digital 4.0',
      description: 'Estratégias de marketing para a era digital. 1ª edição. ISBN 978-85-789-0123-4. Marketing Press, 2024.',
      authorName: 'Marcelo Santana',
      academicArea: 'ADMINISTRATION' as any,
      price: 5490,
      pageCount: 280,
      fileUrl: '/uploads/ebooks/marketing-digital.pdf',
      coverUrl: '/uploads/ebooks/covers/marketing-digital.jpg',
    },
    {
      title: 'Direito Empresarial Moderno',
      description: 'Aspectos jurídicos da atividade empresarial contemporânea. ISBN 978-85-890-1234-5. Editora Empresarial, 2024.',
      authorName: 'Dr. Paulo Henrique Castro',
      academicArea: 'LAW' as any,
      price: 6990,
      pageCount: 410,
      fileUrl: '/uploads/ebooks/direito-empresarial.pdf',
    },
    {
      title: 'Tecnologias Educacionais',
      description: 'Ferramentas e recursos tecnológicos para educação. EduTech Editora, 2024.',
      authorName: 'Profª. Dra. Camila Torres',
      academicArea: 'EDUCATION' as any,
      price: 3790,
      pageCount: 195,
      fileUrl: '/uploads/ebooks/tecnologias-educacionais.pdf',
    },
  ];

  let ebooksCreated = 0;
  for (const ebook of ebooks) {
    const exists = await prisma.ebook.findFirst({
      where: { title: ebook.title },
    });
    if (!exists) {
      await prisma.ebook.create({ data: ebook as any });
      console.log(`  ✅ Criado: ${ebook.title}`);
      ebooksCreated++;
    } else {
      console.log(`  ⏭️  Já existe: ${ebook.title}`);
    }
  }

  // ========================================
  // 4. BLOG POSTS (19)
  // ========================================
  console.log('\n📝 Criando posts do blog...');

  // Criar um admin se não existir
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@lneducacional.com' },
  });

  if (!adminUser) {
    const argon2 = require('argon2');
    const hashedPassword = await argon2.hash('admin123');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@lneducacional.com',
        password: hashedPassword,
        name: 'Admin LN Educacional',
        role: 'ADMIN',
        verified: true,
      },
    });
    console.log('  ✅ Usuário admin criado');
  }

  // Criar categorias se não existirem
  const categories = [
    { name: 'Educação', slug: 'educacao' },
    { name: 'Tecnologia', slug: 'tecnologia' },
    { name: 'Carreira', slug: 'carreira' },
    { name: 'Pesquisa', slug: 'pesquisa' },
    { name: 'Dicas de Estudo', slug: 'dicas-de-estudo' },
  ];

  const createdCategories: any = {};
  for (const cat of categories) {
    let category = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!category) {
      category = await prisma.category.create({ data: cat });
      console.log(`  ✅ Categoria criada: ${cat.name}`);
    }
    createdCategories[cat.slug] = category;
  }

  const blogPosts = [
    {
      title: 'Como Fazer um TCC de Qualidade em 6 Meses',
      slug: 'como-fazer-tcc-qualidade-6-meses',
      content: '<p>O Trabalho de Conclusão de Curso (TCC) é um dos maiores desafios da vida acadêmica...</p><h2>1. Planejamento é Fundamental</h2><p>Comece escolhendo um tema que você domine e que tenha bibliografia disponível...</p>',
      excerpt: 'Guia completo para desenvolver seu TCC com qualidade e dentro do prazo.',
      coverImageUrl: '/uploads/blog/tcc-qualidade.jpg',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['pesquisa'].id,
      readingTime: 8,
    },
    {
      title: '10 Ferramentas Essenciais para Estudantes Universitários',
      slug: '10-ferramentas-essenciais-estudantes',
      content: '<p>A tecnologia pode ser uma grande aliada nos estudos...</p><h2>1. Notion - Organização</h2><p>O Notion é perfeito para organizar suas anotações...</p>',
      excerpt: 'Descubra as melhores ferramentas digitais para otimizar seus estudos.',
      coverImageUrl: '/uploads/blog/ferramentas-estudantes.jpg',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['tecnologia'].id,
      views: 1250,
      readingTime: 6,
    },
    {
      title: 'ABNT 2024: Principais Mudanças nas Normas Acadêmicas',
      slug: 'abnt-2024-mudancas-normas',
      content: '<p>As normas ABNT são atualizadas periodicamente...</p><h2>Mudanças na Formatação</h2><p>Houve alterações importantes nas margens...</p>',
      excerpt: 'Conheça as atualizações mais recentes das normas ABNT para trabalhos acadêmicos.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['pesquisa'].id,
      views: 2100,
      readingTime: 10,
    },
  ];

  // Adicionar mais 16 posts (continuando o script truncado do anterior...)
  const morePosts = [
    {
      title: 'Metodologias Ágeis na Educação: O Futuro do Ensino',
      slug: 'metodologias-ageis-educacao',
      content: '<p>As metodologias ágeis estão transformando a educação...</p>',
      excerpt: 'Como as metodologias ágeis estão revolucionando a forma de ensinar.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['educacao'].id,
      views: 890,
      readingTime: 7,
    },
    {
      title: 'Gestão de Tempo para Estudantes: Técnica Pomodoro',
      slug: 'gestao-tempo-tecnica-pomodoro',
      content: '<p>A técnica Pomodoro é uma das mais eficazes para gestão de tempo...</p>',
      excerpt: 'Aprenda a usar a técnica Pomodoro para estudar com mais eficiência.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['dicas-de-estudo'].id,
      views: 1560,
      readingTime: 5,
    },
    {
      title: 'Como Escolher o Tema Perfeito para seu TCC',
      slug: 'escolher-tema-perfeito-tcc',
      content: '<p>Escolher o tema do TCC é uma das decisões mais importantes...</p>',
      excerpt: 'Dicas práticas para escolher um tema de TCC relevante e viável.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['pesquisa'].id,
      views: 1820,
      readingTime: 9,
    },
    {
      title: 'Inteligência Artificial na Educação: Oportunidades',
      slug: 'ia-educacao-oportunidades',
      content: '<p>A IA está transformando a educação...</p>',
      excerpt: 'Explore como a IA está moldando o futuro da educação.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['tecnologia'].id,
      views: 2340,
      readingTime: 11,
    },
    {
      title: 'Networking Acadêmico: Como Construir sua Rede',
      slug: 'networking-academico-rede-contatos',
      content: '<p>O networking é importante na academia...</p>',
      excerpt: 'Estratégias para construir uma rede de contatos acadêmicos.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['carreira'].id,
      views: 980,
      readingTime: 8,
    },
    {
      title: 'Mapas Mentais: Ferramenta Poderosa para Estudos',
      slug: 'mapas-mentais-ferramenta-estudos',
      content: '<p>Mapas mentais facilitam a aprendizagem...</p>',
      excerpt: 'Descubra como usar mapas mentais para potencializar estudos.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['dicas-de-estudo'].id,
      views: 1680,
      readingTime: 7,
    },
    {
      title: 'Pós-Graduação: Mestrado ou MBA?',
      slug: 'pos-graduacao-mestrado-ou-mba',
      content: '<p>Escolher entre mestrado e MBA...</p>',
      excerpt: 'Guia para tomar a decisão certa sobre pós-graduação.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['carreira'].id,
      views: 2150,
      readingTime: 12,
    },
    {
      title: 'Apresentação de TCC: Preparar para Banca',
      slug: 'apresentacao-tcc-preparar-banca',
      content: '<p>A apresentação oral é crucial...</p>',
      excerpt: 'Dicas essenciais para apresentação de TCC impecável.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['dicas-de-estudo'].id,
      views: 1890,
      readingTime: 9,
    },
    {
      title: 'Currículo Acadêmico: Destacar Produção Científica',
      slug: 'curriculo-academico-producao-cientifica',
      content: '<p>Um currículo acadêmico bem estruturado...</p>',
      excerpt: 'Aprenda a montar currículo acadêmico valorizado.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(),
      authorId: adminUser.id,
      categoryId: createdCategories['carreira'].id,
      views: 450,
      readingTime: 8,
    },
    {
      title: 'Revisão Bibliográfica: Guia Completo',
      slug: 'revisao-bibliografica-guia-completo',
      content: '<p>A revisão bibliográfica é fundamental em qualquer trabalho acadêmico...</p>',
      excerpt: 'Aprenda a fazer uma revisão bibliográfica completa e eficaz.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['pesquisa'].id,
      views: 980,
      readingTime: 11,
    },
    {
      title: 'Produtividade Acadêmica: Apps Essenciais',
      slug: 'produtividade-academica-apps-essenciais',
      content: '<p>Descubra os melhores aplicativos para aumentar sua produtividade...</p>',
      excerpt: 'Os melhores apps para organizar seus estudos e projetos acadêmicos.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['tecnologia'].id,
      views: 1320,
      readingTime: 6,
    },
    {
      title: 'Metodologia Científica: Erros Comuns',
      slug: 'metodologia-cientifica-erros-comuns',
      content: '<p>Conheça os erros mais frequentes em metodologia científica...</p>',
      excerpt: 'Evite os erros mais comuns em trabalhos de metodologia científica.',
      published: true,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['pesquisa'].id,
      views: 1150,
      readingTime: 9,
    },
    {
      title: 'LinkedIn Acadêmico: Perfil Profissional',
      slug: 'linkedin-academico-perfil-profissional',
      content: '<p>Otimize seu LinkedIn para carreira acadêmica...</p>',
      excerpt: 'Dicas para criar um perfil LinkedIn voltado para academia.',
      published: true,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['carreira'].id,
      views: 890,
      readingTime: 7,
    },
    {
      title: 'Leitura Dinâmica para Estudantes',
      slug: 'leitura-dinamica-estudantes',
      content: '<p>Técnicas de leitura dinâmica para aumentar sua velocidade...</p>',
      excerpt: 'Aprenda a ler mais rápido sem perder compreensão.',
      published: true,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['dicas-de-estudo'].id,
      views: 1450,
      readingTime: 8,
    },
    {
      title: 'Citações e Referências: Guia ABNT',
      slug: 'citacoes-referencias-guia-abnt',
      content: '<p>Domine as citações diretas, indiretas e referências ABNT...</p>',
      excerpt: 'Guia prático de citações e referências nas normas ABNT.',
      published: true,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['pesquisa'].id,
      views: 2300,
      readingTime: 10,
    },
    {
      title: 'Ansiedade Acadêmica: Como Lidar',
      slug: 'ansiedade-academica-como-lidar',
      content: '<p>A ansiedade acadêmica é comum, mas há formas de gerenciá-la...</p>',
      excerpt: 'Estratégias eficazes para lidar com ansiedade nos estudos.',
      published: true,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      authorId: adminUser.id,
      categoryId: createdCategories['dicas-de-estudo'].id,
      views: 1780,
      readingTime: 9,
    },
  ];

  const allBlogPosts = [...blogPosts, ...morePosts];

  let blogPostsCreated = 0;
  for (const post of allBlogPosts) {
    const exists = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    });
    if (!exists) {
      await prisma.blogPost.create({ data: post as any });
      console.log(`  ✅ Criado: ${post.title}`);
      blogPostsCreated++;
    } else {
      console.log(`  ⏭️  Já existe: ${post.title}`);
    }
  }

  // ========================================
  // RESUMO
  // ========================================
  console.log('\n📊 Resumo:');
  console.log(`   Trabalhos gratuitos criados: ${freePapersCreated}`);
  console.log(`   Trabalhos personalizados criados: ${customPapersCreated}`);
  console.log(`   E-books criados: ${ebooksCreated}`);
  console.log(`   Posts do blog criados: ${blogPostsCreated}`);
  
  const totalPapers = await prisma.paper.count();
  const totalCustomPapers = await prisma.customPaper.count();
  const totalEbooks = await prisma.ebook.count();
  const totalBlogPosts = await prisma.blogPost.count();
  
  console.log('\n📈 Total no banco:');
  console.log(`   Papers (livres e pagos): ${totalPapers}`);
  console.log(`   Trabalhos personalizados: ${totalCustomPapers}`);
  console.log(`   E-books: ${totalEbooks}`);
  console.log(`   Posts do blog: ${totalBlogPosts}`);

  console.log('\n✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
