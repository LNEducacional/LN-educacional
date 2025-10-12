import type { Ebook } from '@/types/ebook';

export const mockEbooks: Ebook[] = [
  {
    id: 201,
    title: 'Fundamentos de Administração Moderna',
    description:
      'E-book completo sobre os princípios fundamentais da administração moderna, incluindo gestão de pessoas, processos e estratégias empresariais.',
    area: 'administration',
    pageCount: 120,
    price: 2500, // R$ 25,00
    fileUrl: '/ebooks/admin-fundamentals.pdf',
    coverUrl: '/covers/admin-fundamentals.jpg',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 202,
    title: 'Guia Prático de Python para Iniciantes',
    description:
      'E-book gratuito com exercícios práticos e exemplos para quem está começando a programar em Python.',
    area: 'exact_sciences',
    pageCount: 85,
    price: 0, // Gratuito
    fileUrl: '/ebooks/python-guide.pdf',
    coverUrl: '/covers/python-guide.jpg',
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 203,
    title: 'Psicologia do Desenvolvimento Humano',
    description:
      'Estudo aprofundado sobre as fases do desenvolvimento humano, desde a infância até a idade adulta.',
    area: 'psychology',
    pageCount: 180,
    price: 3500, // R$ 35,00
    fileUrl: '/ebooks/psicologia-desenvolvimento.pdf',
    coverUrl: null,
    createdAt: new Date('2024-03-12'),
  },
  {
    id: 204,
    title: 'Introdução ao Marketing Digital',
    description:
      'E-book gratuito sobre estratégias básicas de marketing digital, SEO e redes sociais.',
    area: 'economics',
    pageCount: 60,
    price: 0, // Gratuito
    fileUrl: '/ebooks/marketing-digital.pdf',
    coverUrl: '/covers/marketing-digital.jpg',
    createdAt: new Date('2024-04-18'),
  },
  {
    id: 205,
    title: 'Direito Civil: Conceitos Essenciais',
    description:
      'Manual completo sobre os principais conceitos do direito civil brasileiro, ideal para estudantes.',
    area: 'law',
    pageCount: 250,
    price: 4500, // R$ 45,00
    fileUrl: '/ebooks/direito-civil.pdf',
    coverUrl: '/covers/direito-civil.jpg',
    createdAt: new Date('2024-05-20'),
  },
  {
    id: 206,
    title: 'Sustentabilidade e Meio Ambiente',
    description: 'E-book gratuito sobre práticas sustentáveis e preservação ambiental.',
    area: 'multidisciplinary',
    pageCount: 75,
    price: 0, // Gratuito
    fileUrl: '/ebooks/sustentabilidade.pdf',
    coverUrl: null,
    createdAt: new Date('2024-06-08'),
  },
];
