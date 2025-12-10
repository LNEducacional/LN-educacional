export type PaperType =
  | 'article'
  | 'review'
  | 'thesis'
  | 'dissertation'
  | 'project'
  | 'essay'
  | 'summary'
  | 'monography'
  | 'case_study'
  | 'other';

export type AcademicArea =
  | 'administration'
  | 'law'
  | 'education'
  | 'engineering'
  | 'psychology'
  | 'health'
  | 'accounting'
  | 'arts'
  | 'economics'
  | 'social_sciences'
  | 'other'
  | 'exact_sciences'
  | 'biological_sciences'
  | 'health_sciences'
  | 'applied_social_sciences'
  | 'humanities'
  | 'languages'
  | 'agricultural_sciences'
  | 'multidisciplinary';

export interface ReadyPaper {
  id: string; // UUID do Prisma
  title: string;
  description: string;
  paperType: PaperType;
  academicArea: AcademicArea;
  price: number; // centavos BRL
  pageCount: number;
  authorName: string;
  language: string;
  keywords: string | null;
  previewUrl: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  isFree: boolean;
  downloadCount?: number; // contador de downloads
  createdAt: Date | string; // Aceita tanto Date quanto string ISO
}

export interface PaperFilters {
  academicArea: AcademicArea | 'all';
  paperType: PaperType | 'all';
  maxPages: number;
  maxPrice: number;
}
