import type { ChatSupportMessage, ContactMessage } from '@/types/message';

export const mockContactMessages: ContactMessage[] = [
  {
    id: 1,
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    subject: 'Dúvida sobre pagamento',
    message:
      'Olá, gostaria de saber quais são as formas de pagamento aceitas para os cursos. Vocês aceitam cartão de débito? Aguardo retorno.',
    status: 'unread',
    createdAt: new Date(2024, 2, 15, 14, 30),
  },
  {
    id: 2,
    name: 'João Santos',
    email: 'joao.santos@gmail.com',
    subject: 'Problema com acesso ao curso',
    message:
      'Comprei o curso de React ontem mas não estou conseguindo acessar. Já tentei fazer login várias vezes. Podem me ajudar?',
    status: 'replied',
    createdAt: new Date(2024, 2, 14, 16, 45),
  },
  {
    id: 3,
    name: 'Ana Oliveira',
    email: 'ana.oliveira@hotmail.com',
    subject: 'Solicitação de certificado',
    message:
      'Finalizei o curso de JavaScript há uma semana, mas ainda não recebi o certificado. Como faço para obtê-lo?',
    status: 'read',
    createdAt: new Date(2024, 2, 14, 10, 20),
  },
  {
    id: 4,
    name: 'Carlos Pereira',
    email: 'carlos.pereira@outlook.com',
    subject: 'Sugestão de novo curso',
    message:
      'Seria interessante ter um curso sobre Vue.js. Há muita demanda no mercado e vocês poderiam aproveitar essa oportunidade.',
    status: 'unread',
    createdAt: new Date(2024, 2, 13, 9, 15),
  },
  {
    id: 5,
    name: 'Fernanda Costa',
    email: 'fernanda.costa@company.com',
    subject: 'Parceria empresarial',
    message:
      'Represento uma empresa de tecnologia e gostaríamos de discutir uma possível parceria para treinamentos corporativos. Podemos agendar uma reunião?',
    status: 'read',
    createdAt: new Date(2024, 2, 12, 15, 0),
  },
];

export const mockChatMessages: ChatSupportMessage[] = [
  {
    id: 1,
    name: 'Pedro Lima',
    createdAt: new Date(2024, 2, 15, 11, 0),
    latestMessage: {
      content: 'Obrigado pela ajuda! Consegui resolver o problema.',
      createdAt: new Date(2024, 2, 15, 11, 45),
      senderName: 'Pedro Lima',
    },
    messageCount: 8,
    unreadCount: 0,
    userInfo: {
      name: 'Pedro Lima',
      email: 'pedro.lima@email.com',
    },
    messages: [
      {
        id: 1,
        content: 'Olá, preciso de ajuda com o curso de Python',
        createdAt: new Date(2024, 2, 15, 11, 0),
        senderId: 'user',
        isRead: true,
      },
      {
        id: 2,
        content: 'Olá Pedro! Em que posso ajudá-lo?',
        createdAt: new Date(2024, 2, 15, 11, 5),
        senderId: 'admin',
        isRead: true,
      },
      {
        id: 3,
        content: 'Não estou conseguindo baixar os materiais do curso',
        createdAt: new Date(2024, 2, 15, 11, 10),
        senderId: 'user',
        isRead: true,
      },
      {
        id: 4,
        content: 'Vou verificar isso para você. Pode me informar qual aula específica?',
        createdAt: new Date(2024, 2, 15, 11, 15),
        senderId: 'admin',
        isRead: true,
      },
      {
        id: 5,
        content: 'É a aula 5, sobre estruturas de dados',
        createdAt: new Date(2024, 2, 15, 11, 20),
        senderId: 'user',
        isRead: true,
      },
      {
        id: 6,
        content: 'Encontrei o problema. Havia uma falha no servidor. Já foi corrigido!',
        createdAt: new Date(2024, 2, 15, 11, 30),
        senderId: 'admin',
        isRead: true,
      },
      {
        id: 7,
        content: 'Perfeito! Agora está funcionando.',
        createdAt: new Date(2024, 2, 15, 11, 40),
        senderId: 'user',
        isRead: true,
      },
      {
        id: 8,
        content: 'Obrigado pela ajuda! Consegui resolver o problema.',
        createdAt: new Date(2024, 2, 15, 11, 45),
        senderId: 'user',
        isRead: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Luiza Fernandes',
    createdAt: new Date(2024, 2, 14, 14, 30),
    latestMessage: {
      content: 'Preciso de mais informações sobre isso',
      createdAt: new Date(2024, 2, 14, 15, 20),
      senderName: 'Luiza Fernandes',
    },
    messageCount: 3,
    unreadCount: 1,
    userInfo: {
      name: 'Luiza Fernandes',
      email: 'luiza.fernandes@gmail.com',
    },
    messages: [
      {
        id: 1,
        content: 'Gostaria de saber sobre os certificados dos cursos',
        createdAt: new Date(2024, 2, 14, 14, 30),
        senderId: 'user',
        isRead: true,
      },
      {
        id: 2,
        content:
          'Nossos certificados são emitidos automaticamente após a conclusão de 100% do curso',
        createdAt: new Date(2024, 2, 14, 15, 0),
        senderId: 'admin',
        isRead: true,
      },
      {
        id: 3,
        content: 'Preciso de mais informações sobre isso',
        createdAt: new Date(2024, 2, 14, 15, 20),
        senderId: 'user',
        isRead: false,
      },
    ],
  },
  {
    id: 3,
    name: 'Roberto Silva',
    createdAt: new Date(2024, 2, 13, 16, 0),
    latestMessage: {
      content: 'Que horas vocês funcionam?',
      createdAt: new Date(2024, 2, 13, 16, 0),
      senderName: 'Roberto Silva',
    },
    messageCount: 1,
    unreadCount: 1,
    userInfo: {
      name: 'Roberto Silva',
      email: 'roberto.silva@empresa.com',
    },
    messages: [
      {
        id: 1,
        content: 'Que horas vocês funcionam?',
        createdAt: new Date(2024, 2, 13, 16, 0),
        senderId: 'user',
        isRead: false,
      },
    ],
  },
];
