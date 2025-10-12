import type { StudentOrder } from '@/types/student-order';

export const mockStudentOrders: StudentOrder[] = [
  {
    id: 'mock-1001',
    userId: 'mock-user-1',
    items: [
      {
        title: 'Curso de React Avançado',
        description: 'Curso completo de React com hooks, context e testes',
        price: 19900, // R$ 199.00
      },
      {
        title: 'E-book JavaScript Moderno',
        description: 'Guia completo de ES6+ com exemplos práticos',
        price: 4900, // R$ 49.00
      },
    ],
    totalAmount: 24800, // R$ 248.00
    status: 'COMPLETED',
    paymentMethod: 'PIX',
    paymentStatus: 'CONFIRMED',
    createdAt: new Date(2024, 2, 15, 14, 30),
  },
  {
    id: 'mock-1002',
    userId: 'mock-user-1',
    items: [
      {
        title: 'Curso de Python para Data Science',
        description: 'Análise de dados com Python, Pandas e Numpy',
        price: 25000, // R$ 250.00
      },
    ],
    totalAmount: 25000,
    status: 'PROCESSING',
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'PROCESSING',
    createdAt: new Date(2024, 2, 14, 10, 20),
  },
  {
    id: 'mock-1003',
    userId: 'mock-user-1',
    items: [
      {
        title: 'E-book Metodologia Científica',
        description: 'Guia para desenvolvimento de TCC e pesquisas',
        price: 2990, // R$ 29.90
      },
    ],
    totalAmount: 2990,
    status: 'PENDING',
    paymentMethod: 'BOLETO',
    paymentStatus: 'PENDING',
    createdAt: new Date(2024, 2, 13, 16, 45),
  },
  {
    id: 'mock-1004',
    userId: 'mock-user-1',
    items: [
      {
        title: 'Template de TCC - Engenharia',
        description: 'Modelo formatado nas normas ABNT para TCCs',
        price: 1990, // R$ 19.90
      },
      {
        title: 'Kit de Apresentação para TCC',
        description: 'Templates de slides para defesa de TCC',
        price: 990, // R$ 9.90
      },
    ],
    totalAmount: 2980,
    status: 'CANCELED',
    paymentMethod: 'PIX',
    paymentStatus: 'CANCELED',
    createdAt: new Date(2024, 2, 12, 9, 15),
  },
  {
    id: 'mock-1005',
    userId: 'mock-user-1',
    items: [
      {
        title: 'Curso de UX/UI Design',
        description: 'Design de interfaces e experiência do usuário',
        price: 29900, // R$ 299.00
      },
    ],
    totalAmount: 29900,
    status: 'COMPLETED',
    paymentMethod: 'DEBIT_CARD',
    paymentStatus: 'CONFIRMED',
    createdAt: new Date(2024, 2, 10, 11, 30),
  },
];
