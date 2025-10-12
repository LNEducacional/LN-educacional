import type { CollaboratorApplication } from '@/types/collaborator';

export const mockCollaboratorApplications: CollaboratorApplication[] = [
  {
    id: 1,
    fullName: 'Ana Paula Santos',
    email: 'ana.santos@email.com',
    phone: '(11) 99999-1234',
    area: 'Desenvolvimento Web',
    experience:
      '5 anos de experiência em React, Node.js e TypeScript. Trabalhei em projetos de e-commerce e plataformas educacionais. Especializada em desenvolvimento client com foco em UX/UI.',
    availability:
      'Disponível para trabalhar 20-25 horas por semana, preferencialmente nos períodos da manhã e tarde. Flexível para reuniões online.',
    resumeUrl: '/curriculos/ana-santos.pdf',
    status: 'pending',
    stage: 'RECEIVED',
    score: 8.5,
    createdAt: new Date(2024, 2, 15, 14, 30),
  },
  {
    id: 2,
    fullName: 'Carlos Eduardo Lima',
    email: 'carlos.lima@dev.com',
    phone: '(21) 98888-5678',
    area: 'Design Gráfico',
    experience:
      '3 anos como designer gráfico freelancer. Experiência em criação de materiais educacionais, identidade visual e design para redes sociais. Domínio de Adobe Creative Suite.',
    availability:
      'Tempo integral disponível. Posso trabalhar em horário comercial ou conforme demanda do projeto. Experiência com trabalho remoto.',
    resumeUrl: '/curriculos/carlos-lima.pdf',
    status: 'interviewing',
    stage: 'INTERVIEW',
    score: 7.8,
    createdAt: new Date(2024, 2, 14, 16, 45),
  },
  {
    id: 3,
    fullName: 'Mariana Costa Oliveira',
    email: 'mariana.costa@educ.com',
    phone: '(31) 97777-9999',
    area: 'Produção de Conteúdo',
    experience:
      '7 anos em produção de conteúdo educacional. Especialista em metodologias ativas de aprendizagem. Experiência na criação de cursos online, e-books e materiais didáticos.',
    availability:
      'Disponível 30 horas por semana. Prefiro trabalhar de segunda a sexta, mas posso ser flexível para deadlines importantes.',
    resumeUrl: null,
    status: 'approved',
    stage: 'HIRED',
    score: 9.2,
    createdAt: new Date(2024, 2, 13, 10, 20),
  },
  {
    id: 4,
    fullName: 'Roberto Silva Mendes',
    email: 'roberto.mendes@marketing.com',
    phone: '(85) 96666-7777',
    area: 'Marketing Digital',
    experience:
      '4 anos em marketing digital para educação. Especialista em SEO, Google Ads e marketing de conteúdo. Experiência com funis de conversão e análise de métricas.',
    availability:
      'Tempo parcial, 15-20 horas por semana. Disponível principalmente nos finais de semana e algumas noites durante a semana.',
    resumeUrl: '/curriculos/roberto-mendes.pdf',
    status: 'rejected',
    stage: 'SCREENING',
    score: 5.2,
    createdAt: new Date(2024, 2, 12, 9, 15),
  },
  {
    id: 5,
    fullName: 'Fernanda Rodrigues Pereira',
    email: 'fernanda.rodrigues@tech.com',
    phone: '(47) 95555-4444',
    area: 'Desenvolvimento Mobile',
    experience:
      '6 anos desenvolvendo aplicativos móveis para iOS e Android. Experiência com React Native, Flutter e desenvolvimento nativo. Trabalhei em apps educacionais e de produtividade.',
    availability:
      'Disponível 25-30 horas por semana. Horário flexível, posso me adaptar conforme necessidade da equipe. Experiência com metodologias ágeis.',
    resumeUrl: '/curriculos/fernanda-pereira.pdf',
    status: 'pending',
    stage: 'SCREENING',
    score: 8.1,
    createdAt: new Date(2024, 2, 11, 15, 0),
  },
  {
    id: 6,
    fullName: 'João Pedro Almeida',
    email: 'joao.almeida@data.com',
    phone: '(62) 94444-3333',
    area: 'Análise de Dados',
    experience:
      '3 anos em análise de dados educacionais. Especialista em Python, R e ferramentas de BI. Experiência em análise de performance de cursos e métricas de engajamento.',
    availability:
      'Tempo integral disponível para projetos de longo prazo. Posso trabalhar em horário comercial ou conforme demanda dos projetos.',
    resumeUrl: '/curriculos/joao-almeida.pdf',
    status: 'interviewing',
    stage: 'TECHNICAL_TEST',
    score: 7.5,
    createdAt: new Date(2024, 2, 10, 11, 30),
  },
  {
    id: 7,
    fullName: 'Luiza Fernandes Costa',
    email: 'luiza.costa@ux.com',
    phone: '(81) 93333-2222',
    area: 'UX/UI Design',
    experience:
      '4 anos em UX/UI Design. Especialista em pesquisa de usuário, prototipagem e design de interfaces. Experiência em plataformas educacionais e aplicativos móveis.',
    availability:
      '20 horas por semana, flexível para reuniões e apresentações. Disponível para trabalho colaborativo e workshops de design thinking.',
    resumeUrl: '/curriculos/luiza-costa.pdf',
    status: 'pending',
    stage: 'FINAL_REVIEW',
    score: 8.9,
    createdAt: new Date(2024, 2, 9, 13, 45),
  },
];
