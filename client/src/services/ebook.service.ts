import type { AcademicArea, Ebook } from '@/types/ebook';
import api from './api';

export interface CreateEbookDto {
  title: string;
  description: string;
  academicArea: AcademicArea;
  authorName: string;
  pageCount: number;
  price: number; // centavos BRL, 0 = gratuito
  fileUrl: string;
  coverUrl?: string;
}

export interface UpdateEbookDto extends Partial<CreateEbookDto> {}

export interface EbookFilters {
  academicArea?: AcademicArea;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  free?: boolean;
  skip?: number;
  take?: number;
}

export interface EbookDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

class EbookService {
  // Public endpoints
  async getPublicEbooks(filters?: EbookFilters): Promise<Ebook[]> {
    const params = new URLSearchParams();

    if (filters?.academicArea) params.append('academicArea', filters.academicArea);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
    if (filters?.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
    if (filters?.free !== undefined) params.append('free', filters.free.toString());
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.take !== undefined) params.append('take', filters.take.toString());

    const response = await api.get(`/ebooks?${params.toString()}`);
    return response.data;
  }

  async getEbookById(id: string): Promise<Ebook> {
    const response = await api.get(`/ebooks/${id}`);
    return response.data;
  }

  async downloadEbook(id: string): Promise<EbookDownloadResponse> {
    const response = await api.get(`/ebooks/${id}/download`);
    return response.data;
  }

  // Student endpoints
  async getMyEbooks(): Promise<Ebook[]> {
    const response = await api.get('/student/purchases/ebooks');
    return response.data;
  }

  // Admin endpoints
  async getAllEbooks(filters?: EbookFilters): Promise<Ebook[]> {
    const params = new URLSearchParams();

    if (filters?.academicArea) params.append('academicArea', filters.academicArea);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.take !== undefined) params.append('take', filters.take.toString());

    const response = await api.get(`/admin/ebooks?${params.toString()}`);
    return response.data;
  }

  async getAdminEbookById(id: string): Promise<Ebook> {
    const response = await api.get(`/admin/ebooks/${id}`);
    return response.data;
  }

  async createEbook(data: CreateEbookDto): Promise<Ebook> {
    const response = await api.post('/admin/ebooks', data);
    return response.data;
  }

  async updateEbook(id: string, data: UpdateEbookDto): Promise<Ebook> {
    const response = await api.put(`/admin/ebooks/${id}`, data);
    return response.data;
  }

  async deleteEbook(id: string): Promise<void> {
    await api.delete(`/admin/ebooks/${id}`);
  }

  // Search and filter helpers
  async searchEbooks(query: string, filters?: Partial<EbookFilters>): Promise<Ebook[]> {
    return this.getPublicEbooks({
      search: query,
      ...filters,
    });
  }

  async getFreeEbooks(filters?: Partial<EbookFilters>): Promise<Ebook[]> {
    return this.getPublicEbooks({
      free: true,
      ...filters,
    });
  }

  async getEbooksByArea(
    academicArea: AcademicArea,
    filters?: Partial<EbookFilters>
  ): Promise<Ebook[]> {
    return this.getPublicEbooks({
      academicArea,
      ...filters,
    });
  }
}

export default new EbookService();
