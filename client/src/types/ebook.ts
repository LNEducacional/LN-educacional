export type AcademicArea =
  | 'ADMINISTRATION'
  | 'LAW'
  | 'EDUCATION'
  | 'ENGINEERING'
  | 'PSYCHOLOGY'
  | 'HEALTH'
  | 'ACCOUNTING'
  | 'ARTS'
  | 'ECONOMICS'
  | 'SOCIAL_SCIENCES'
  | 'OTHER'
  | 'EXACT_SCIENCES'
  | 'BIOLOGICAL_SCIENCES'
  | 'HEALTH_SCIENCES'
  | 'APPLIED_SOCIAL_SCIENCES'
  | 'HUMANITIES'
  | 'LANGUAGES'
  | 'AGRICULTURAL_SCIENCES'
  | 'MULTIDISCIPLINARY';

export interface EbookFile {
  id: string;
  ebookId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  academicArea: AcademicArea;
  authorName: string;
  pageCount: number;
  price: number; // centavos BRL, 0 = gratuito
  fileUrl: string;
  coverUrl: string | null;
  files?: EbookFile[];
  createdAt: string;
  updatedAt?: string;
  // Campos adicionais para funcionalidades
  isPurchased?: boolean;
  downloadUrl?: string;
}
