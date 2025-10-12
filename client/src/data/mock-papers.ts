import type { ReadyPaper } from '@/types/paper';

export const mockPapers: ReadyPaper[] = [
  {
    id: 1,
    title: 'Gestão de Recursos Humanos na Era Digital',
    description:
      'Análise completa sobre as transformações na gestão de pessoas com o advento das tecnologias digitais e suas implicações organizacionais.',
    paperType: 'article',
    academicArea: 'administration',
    price: 2500, // R$ 25,00
    pageCount: 45,
    authorName: 'Dr. Marina Silva',
    language: 'português',
    keywords: 'gestão, recursos humanos, digital, transformação',
    previewUrl: null,
    fileUrl: '/files/gestao-rh-digital.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    title: 'Direitos Fundamentais na Constituição de 1988',
    description:
      'Estudo aprofundado sobre os direitos fundamentais estabelecidos pela Constituição Federal brasileira e sua aplicação prática.',
    paperType: 'thesis',
    academicArea: 'law',
    price: 4500, // R$ 45,00
    pageCount: 120,
    authorName: 'Prof. João Santos',
    language: 'português',
    keywords: 'direitos fundamentais, constituição, lei',
    previewUrl: null,
    fileUrl: '/files/direitos-fundamentais.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 3,
    title: 'Metodologias Ativas no Ensino Superior',
    description:
      'Pesquisa sobre a implementação de metodologias ativas no ensino superior e seus impactos na aprendizagem dos estudantes.',
    paperType: 'dissertation',
    academicArea: 'education',
    price: 3800, // R$ 38,00
    pageCount: 85,
    authorName: 'Dra. Ana Costa',
    language: 'português',
    keywords: 'educação, metodologias ativas, ensino superior',
    previewUrl: null,
    fileUrl: '/files/metodologias-ativas.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-01-28'),
  },
  {
    id: 4,
    title: 'Sustentabilidade na Engenharia Civil',
    description:
      'Projeto focado em práticas sustentáveis na construção civil e seu impacto ambiental positivo.',
    paperType: 'project',
    academicArea: 'engineering',
    price: 5200, // R$ 52,00
    pageCount: 95,
    authorName: 'Eng. Carlos Oliveira',
    language: 'português',
    keywords: 'sustentabilidade, engenharia civil, meio ambiente',
    previewUrl: null,
    fileUrl: '/files/sustentabilidade-engenharia.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 5,
    title: 'Psicologia Organizacional e Liderança',
    description:
      'Análise dos aspectos psicológicos da liderança em organizações modernas e seu impacto na produtividade.',
    paperType: 'review',
    academicArea: 'psychology',
    price: 2800, // R$ 28,00
    pageCount: 65,
    authorName: 'Dra. Paula Mendes',
    language: 'português',
    keywords: 'psicologia, liderança, organizações',
    previewUrl: null,
    fileUrl: '/files/psicologia-lideranca.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 6,
    title: 'Telemedicina e Inovação em Saúde',
    description:
      'Estudo sobre as inovações tecnológicas na área da saúde, com foco na telemedicina e seus benefícios.',
    paperType: 'article',
    academicArea: 'health',
    price: 0, // Trabalho gratuito
    pageCount: 30,
    authorName: 'Dr. Roberto Lima',
    language: 'português',
    keywords: 'telemedicina, saúde, inovação, tecnologia',
    previewUrl: null,
    fileUrl: '/files/telemedicina.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-03-10'),
  },
];

export const paperTypeLabels = {
  article: 'Artigo',
  review: 'Resenha',
  thesis: 'Tese',
  dissertation: 'Dissertação',
  project: 'Projeto',
  essay: 'Ensaio',
  summary: 'Resumo',
};

export const academicAreaLabels = {
  administration: 'Administração',
  law: 'Direito',
  education: 'Educação',
  engineering: 'Engenharia',
  psychology: 'Psicologia',
  health: 'Saúde',
  accounting: 'Contabilidade',
  arts: 'Artes',
  economics: 'Economia',
  social_sciences: 'Ciências Sociais',
  other: 'Outros',
};
