export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
}

export interface ChatMessage {
  id: number;
  content: string;
  createdAt: Date;
  senderId: string;
  isRead: boolean;
}

export interface ChatSupportMessage {
  id: number;
  name: string;
  createdAt: Date;
  latestMessage: {
    content: string;
    createdAt: Date;
    senderName: string;
  };
  messageCount: number;
  unreadCount: number;
  userInfo: {
    name: string;
    email: string;
  };
  messages: ChatMessage[];
}
