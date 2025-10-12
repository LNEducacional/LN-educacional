import api from '@/services/api';
import type { CustomPaper, CustomPaperMessage, CustomPaperRequest } from '@/types/custom-paper';

export const customPapersApi = {
  // Public/Student APIs
  createRequest: (data: CustomPaperRequest) => api.post<CustomPaper>('/custom-papers', data),

  getMyRequests: () => api.get<CustomPaper[]>('/custom-papers/my-requests'),

  getRequestDetails: (id: string) => api.get<CustomPaper>(`/custom-papers/${id}`),

  approveQuote: (id: string) => api.post<CustomPaper>(`/custom-papers/${id}/approve`),

  sendMessage: (id: string, data: { content: string; attachments?: string[] }) =>
    api.post<CustomPaperMessage>(`/custom-papers/${id}/messages`, data),

  // Admin APIs
  getAllRequests: (params?: {
    status?: string;
    urgency?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{ items: CustomPaper[]; total: number; page: number; totalPages: number }>(
      '/admin/custom-papers',
      { params }
    ),

  getAdminRequestDetails: (id: string) => api.get<CustomPaper>(`/admin/custom-papers/${id}`),

  updateRequest: (id: string, data: any) => api.put<CustomPaper>(`/admin/custom-papers/${id}`, data),

  provideQuote: (id: string, data: { quotedPrice: number; adminNotes?: string }) =>
    api.patch<CustomPaper>(`/admin/custom-papers/${id}/quote`, data),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch<CustomPaper>(`/admin/custom-papers/${id}/status`, { status, notes }),

  uploadDelivery: (id: string, fileUrls: string[]) =>
    api.post<CustomPaper>(`/admin/custom-papers/${id}/delivery`, { fileUrls }),

  rejectRequest: (id: string, reason: string) =>
    api.patch<CustomPaper>(`/admin/custom-papers/${id}/reject`, { reason }),

  deleteRequest: (id: string) => api.delete(`/admin/custom-papers/${id}`),
};
