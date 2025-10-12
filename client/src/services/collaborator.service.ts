import api from './api';

export interface CollaboratorApplication {
  fullName: string;
  email: string;
  phone: string;
  area: string;
  experience: string;
  availability: string;
  resumeUrl?: string;
}

export interface CollaboratorResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  experience: string;
  availability: string;
  resumeUrl?: string;
  portfolioUrls?: string[];
  linkedin?: string;
  github?: string;
  status: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED';
  stage: 'RECEIVED' | 'SCREENING' | 'INTERVIEW' | 'TECHNICAL_TEST' | 'FINAL_REVIEW' | 'OFFER' | 'HIRED';
  score?: number;
  createdAt: string;
  updatedAt: string;
  evaluations?: Evaluation[];
  interviews?: Interview[];
}

export interface Evaluation {
  id: string;
  totalScore: number;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'NO_HIRE' | 'STRONG_NO_HIRE';
  createdAt: string;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  duration: number;
  type: 'PHONE_SCREENING' | 'TECHNICAL' | 'BEHAVIORAL' | 'FINAL';
  location?: string;
  meetingUrl?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  result?: 'PASS' | 'FAIL' | 'UNDECIDED';
}

export interface CollaboratorsQuery {
  status?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export const collaboratorService = {
  // Apply as collaborator
  apply: async (data: CollaboratorApplication): Promise<CollaboratorResponse> => {
    const response = await api.post('/collaborator/apply', data);
    return response.data;
  },

  // Admin: Get all applications
  getApplications: async (query?: CollaboratorsQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.skip !== undefined) params.append('skip', query.skip.toString());
    if (query?.take !== undefined) params.append('take', query.take.toString());

    const response = await api.get(`/admin/collaborators?${params.toString()}`);
    return response.data;
  },

  // Admin: Update application status
  updateStatus: async (
    id: string,
    status: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED'
  ) => {
    const response = await api.put(`/admin/collaborators/${id}/status`, { status });
    return response.data;
  },

  // Collaborator: Get own profile
  getProfile: async (): Promise<CollaboratorResponse> => {
    const response = await api.get('/collaborator/profile');
    return response.data;
  },

  // Check application status (public)
  checkStatus: async (id: string, email: string) => {
    const response = await api.get(`/collaborator/application/status/${id}?email=${email}`);
    return response.data;
  },
};

export default collaboratorService;
