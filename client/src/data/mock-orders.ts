import type { Order } from '@/types/order';

export const mockOrders: Order[] = [
  {
    id: 1001,
    items: [
      {
        title: 'Curso de React Avançado',
        description: 'Curso completo de React com hooks e context',
        price: 19900, // R$ 199.00
      },
      {
        title: 'E-book JavaScript Moderno',
        description: 'Guia completo de JavaScript ES6+',
        price: 4900, // R$ 49.00
      },
    ],
    totalAmount: 24800, // R$ 248.00
    status: 'completed',
    paymentMethod: 'PIX',
    customerName: 'João Silva Santos',
    customerEmail: 'joao.silva@email.com',
    customerCpfCnpj: '123.456.789-00',
    customerPhone: '(11) 99999-1234',
    createdAt: new Date(2024, 2, 15, 14, 30),
  },
  {
    id: 1002,
    items: [
      {
        title: 'Trabalho Pronto - Administração',
        description: 'TCC sobre Gestão de Pessoas nas Organizações',
        price: 8500, // R$ 85.00
      },
    ],
    totalAmount: 8500,
    status: 'processing',
    paymentMethod: 'CREDIT_CARD',
    customerName: 'Maria Oliveira',
    customerEmail: 'maria.oliveira@gmail.com',
    customerCpfCnpj: '987.654.321-00',
    createdAt: new Date(2024, 2, 14, 16, 45),
  },
  {
    id: 1003,
    items: [
      {
        title: 'E-book Metodologia Científica',
        description: 'Guia prático para pesquisa acadêmica',
        price: 2990, // R$ 29.90
      },
      {
        title: 'Template de TCC - Engenharia',
        description: 'Modelo formatado nas normas ABNT',
        price: 1990, // R$ 19.90
      },
    ],
    totalAmount: 4980,
    status: 'pending',
    paymentMethod: 'BOLETO',
    customerName: 'Carlos Eduardo Pereira',
    customerEmail: 'carlos.pereira@hotmail.com',
    customerCpfCnpj: '456.789.123-00',
    customerPhone: '(21) 98888-5678',
    createdAt: new Date(2024, 2, 14, 10, 20),
  },
  {
    id: 1004,
    items: [
      {
        title: 'Curso de Python para Iniciantes',
        description: 'Aprenda Python do zero ao avançado',
        price: 15900, // R$ 159.00
      },
    ],
    totalAmount: 15900,
    status: 'canceled',
    paymentMethod: 'PIX',
    customerName: 'Ana Beatriz Costa',
    customerEmail: 'ana.costa@outlook.com',
    customerCpfCnpj: '789.123.456-00',
    createdAt: new Date(2024, 2, 13, 9, 15),
  },
  {
    id: 1005,
    items: [
      {
        title: 'Trabalho Pronto - Direito',
        description: 'Monografia sobre Direito Digital',
        price: 12000, // R$ 120.00
      },
      {
        title: 'Revisão e Formatação ABNT',
        description: 'Serviço de revisão e formatação',
        price: 5000, // R$ 50.00
      },
    ],
    totalAmount: 17000,
    status: 'completed',
    paymentMethod: 'DEBIT_CARD',
    customerName: 'Rafael Mendes',
    customerEmail: 'rafael.mendes@juridico.com',
    customerCpfCnpj: '321.654.987-00',
    customerPhone: '(85) 97777-9999',
    createdAt: new Date(2024, 2, 12, 15, 0),
  },
  {
    id: 1006,
    items: [
      {
        title: 'Curso de Data Science',
        description: 'Análise de dados com Python e R',
        price: 35000, // R$ 350.00
      },
    ],
    totalAmount: 35000,
    status: 'processing',
    paymentMethod: 'CREDIT_CARD',
    customerName: 'Fernanda Rodrigues',
    customerEmail: 'fernanda.rodrigues@analytics.com',
    customerCpfCnpj: '654.987.321-00',
    createdAt: new Date(2024, 2, 11, 11, 30),
  },
  {
    id: 1007,
    items: [
      {
        title: 'E-book Gestão Financeira',
        description: 'Guia de finanças pessoais e empresariais',
        price: 3990, // R$ 39.90
      },
    ],
    totalAmount: 3990,
    status: 'pending',
    customerName: 'Lucas Fernandes',
    customerEmail: 'lucas.fernandes@finance.com',
    customerCpfCnpj: '147.258.369-00',
    customerPhone: '(31) 96666-7777',
    createdAt: new Date(2024, 2, 10, 13, 45),
  },
  {
    id: 1008,
    items: [
      {
        title: 'Curso de UX/UI Design',
        description: 'Design de interfaces e experiência do usuário',
        price: 25000, // R$ 250.00
      },
      {
        title: 'Kit de Templates de Design',
        description: 'Coleção de templates para designers',
        price: 7500, // R$ 75.00
      },
    ],
    totalAmount: 32500,
    status: 'completed',
    paymentMethod: 'PIX',
    customerName: 'Gabriela Santos',
    customerEmail: 'gabriela.santos@design.com',
    customerCpfCnpj: '258.369.147-00',
    createdAt: new Date(2024, 2, 9, 16, 20),
  },
];
