import type { Course } from '@/types/course';

export const mockCourses: Course[] = [
  {
    id: 1,
    title: 'React do Zero ao Avançado',
    description:
      'Aprenda React desde os conceitos básicos até técnicas avançadas, incluindo hooks, context API, e desenvolvimento de aplicações completas.',
    academicArea: 'engineering',
    instructorName: 'João Silva',
    instructorBio:
      'Desenvolvedor Frontend com mais de 8 anos de experiência em React e JavaScript.',
    price: 19900, // R$ 199,00
    duration: 2400, // 40 horas
    thumbnailUrl: '/course-programming.jpg',
    status: 'ativo',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    title: 'Design UI/UX Completo',
    description:
      'Curso completo de design de interfaces e experiência do usuário, do wireframe ao protótipo final.',
    academicArea: 'arts',
    instructorName: 'Maria Santos',
    instructorBio: 'Designer UX/UI com especialização em design thinking e metodologias ágeis.',
    price: 24900, // R$ 249,00
    duration: 3000, // 50 horas
    thumbnailUrl: '/course-design.jpg',
    status: 'ativo',
    createdAt: '2024-02-20',
  },
  {
    id: 3,
    title: 'Marketing Digital Avançado',
    description:
      'Estratégias avançadas de marketing digital, incluindo SEO, SEM, redes sociais e análise de dados.',
    academicArea: 'administration',
    instructorName: 'Pedro Costa',
    instructorBio: 'Especialista em marketing digital com MBA e certificações Google.',
    price: 29900, // R$ 299,00
    duration: 1800, // 30 horas
    thumbnailUrl: '/course-marketing.jpg',
    status: 'inativo',
    createdAt: '2024-03-10',
  },
  {
    id: 4,
    title: 'Python para Iniciantes',
    description:
      'Introdução completa à programação Python, desde sintaxe básica até desenvolvimento de projetos práticos.',
    academicArea: 'engineering',
    instructorName: 'Ana Lima',
    instructorBio: 'Engenheira de software especializada em Python e ciência de dados.',
    price: 0, // Gratuito
    duration: 1200, // 20 horas
    status: 'ativo',
    createdAt: '2024-01-30',
  },
  {
    id: 5,
    title: 'Fotografia Profissional',
    description:
      'Técnicas avançadas de fotografia, composição, iluminação e pós-produção para fotógrafos profissionais.',
    academicArea: 'arts',
    instructorName: 'Carlos Mendes',
    instructorBio: 'Fotógrafo profissional com 15 anos de experiência em eventos corporativos.',
    price: 18900, // R$ 189,00
    duration: 1500, // 25 horas
    status: 'ativo',
    createdAt: '2023-12-05',
  },
  {
    id: 6,
    title: 'Contabilidade Empresarial',
    description:
      'Curso completo de contabilidade empresarial, incluindo balanços, demonstrações financeiras e análise contábil.',
    academicArea: 'accounting',
    instructorName: 'Roberto Ferreira',
    instructorBio: 'Contador com CRC ativo e especialização em controladoria empresarial.',
    price: 22900, // R$ 229,00
    duration: 2700, // 45 horas
    status: 'ativo',
    createdAt: '2024-02-15',
  },
  {
    id: 7,
    title: 'Psicologia Organizacional',
    description:
      'Fundamentos da psicologia aplicada ao ambiente organizacional, liderança e gestão de pessoas.',
    academicArea: 'psychology',
    instructorName: 'Dra. Lucia Rodrigues',
    instructorBio: 'Psicóloga organizacional com mestrado e 12 anos de experiência em RH.',
    price: 27900, // R$ 279,00
    duration: 2100, // 35 horas
    status: 'ativo',
    createdAt: '2024-01-08',
  },
  {
    id: 8,
    title: 'Introdução ao Direito Digital',
    description:
      'Aspectos jurídicos da era digital, incluindo LGPD, crimes cibernéticos e contratos eletrônicos.',
    academicArea: 'law',
    instructorName: 'Dr. André Oliveira',
    instructorBio: 'Advogado especialista em direito digital e proteção de dados.',
    price: 34900, // R$ 349,00
    duration: 1800, // 30 horas
    status: 'ativo',
    createdAt: '2024-03-01',
  },
];
