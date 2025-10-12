import type { ReadyPaper } from '@/types/paper';

export const mockReadyPapers: ReadyPaper[] = [
  {
    id: 1,
    title: 'Análise de Sistemas de Informação em Empresas de Tecnologia',
    description:
      'Estudo completo sobre implementação e gestão de sistemas de informação em empresas de médio e grande porte do setor tecnológico.',
    paperType: 'thesis',
    academicArea: 'administration',
    price: 15000, // R$ 150,00
    pageCount: 85,
    authorName: 'Maria Silva Santos',
    language: 'pt',
    keywords: 'sistemas de informação, tecnologia, gestão empresarial, TI',
    previewUrl: '/previews/paper-1-preview.pdf',
    fileUrl: '/papers/paper-1.pdf',
    thumbnailUrl: '/thumbnails/paper-1.jpg',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    title: 'Marketing Digital e Redes Sociais: Estratégias para Pequenas Empresas',
    description:
      'Análise das principais estratégias de marketing digital aplicáveis a pequenas empresas, com foco em redes sociais e ROI.',
    paperType: 'monography',
    academicArea: 'economics',
    price: 12000, // R$ 120,00
    pageCount: 65,
    authorName: 'João Pedro Oliveira',
    language: 'pt',
    keywords: 'marketing digital, redes sociais, pequenas empresas, ROI',
    previewUrl: null,
    fileUrl: '/papers/paper-2.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 3,
    title: 'Psicologia Organizacional e Clima Empresarial',
    description:
      'Estudo sobre a influência da psicologia organizacional no clima empresarial e na produtividade dos colaboradores.',
    paperType: 'dissertation',
    academicArea: 'psychology',
    price: 25000, // R$ 250,00
    pageCount: 120,
    authorName: 'Ana Beatriz Costa',
    language: 'pt',
    keywords: 'psicologia organizacional, clima empresarial, produtividade, RH',
    previewUrl: '/previews/paper-3-preview.pdf',
    fileUrl: '/papers/paper-3.pdf',
    thumbnailUrl: '/thumbnails/paper-3.jpg',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 4,
    title: 'Sustentabilidade em Projetos de Engenharia Civil',
    description:
      'Análise de práticas sustentáveis aplicadas em projetos de engenharia civil, com enfoque em materiais ecológicos.',
    paperType: 'project',
    academicArea: 'engineering',
    price: 18000, // R$ 180,00
    pageCount: 95,
    authorName: 'Carlos Roberto Mendes',
    language: 'pt',
    keywords: 'sustentabilidade, engenharia civil, materiais ecológicos, meio ambiente',
    previewUrl: '/previews/paper-4-preview.pdf',
    fileUrl: '/papers/paper-4.pdf',
    thumbnailUrl: null,
    createdAt: new Date('2024-04-05'),
  },
  {
    id: 5,
    title: 'Direito Digital e Proteção de Dados Pessoais',
    description:
      'Estudo sobre as implicações legais do direito digital e LGPD na proteção de dados pessoais no Brasil.',
    paperType: 'article',
    academicArea: 'law',
    price: 8000, // R$ 80,00
    pageCount: 35,
    authorName: 'Fernanda Lima Rodrigues',
    language: 'pt',
    keywords: 'direito digital, LGPD, proteção de dados, privacidade',
    previewUrl: null,
    fileUrl: '/papers/paper-5.pdf',
    thumbnailUrl: '/thumbnails/paper-5.jpg',
    createdAt: new Date('2024-05-12'),
  },
];
