import api from './api';

export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  acceptTerms: boolean;
  website?: string; // Honeypot field
  captchaToken?: string; // Optional for now
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface MessagesQuery {
  status?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export const contactService = {
  // Send contact message (public)
  sendMessage: async (data: ContactMessage): Promise<{ success: boolean; messageId: string; message?: string }> => {
    const response = await api.post('/contact', data);
    return response.data;
  },

  // Admin: Get all messages
  getMessages: async (query?: MessagesQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.skip !== undefined) params.append('skip', query.skip.toString());
    if (query?.take !== undefined) params.append('take', query.take.toString());

    const response = await api.get(`/admin/messages?${params.toString()}`);
    return response.data;
  },

  // Admin: Update message status
  updateMessageStatus: async (id: string, status: 'UNREAD' | 'READ' | 'ARCHIVED') => {
    const response = await api.put(`/admin/messages/${id}/status`, { status });
    return response.data;
  },
};

export default contactService;
