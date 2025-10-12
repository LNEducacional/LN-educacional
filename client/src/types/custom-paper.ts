import type { AcademicArea, PaperType } from './paper';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  emailVerified: boolean;
  profileImageUrl?: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'canceled';
  createdAt: string;
}

export interface CustomPaper {
  id: string;
  userId: string;
  user?: User;

  // Request details
  title: string;
  description: string;
  paperType: PaperType;
  academicArea: AcademicArea;
  pageCount: number;
  deadline: string;
  urgency: 'NORMAL' | 'URGENT' | 'VERY_URGENT';
  requirements: string;
  keywords?: string;
  references?: string;

  // Files
  requirementFiles: string[];
  deliveryFiles: string[];

  // Pricing
  quotedPrice?: number;
  finalPrice?: number;
  paymentStatus: PaymentStatus;

  // Status
  status: CustomPaperStatus;
  adminNotes?: string;
  rejectionReason?: string;

  // Tracking
  requestedAt: string;
  quotedAt?: string;
  approvedAt?: string;
  startedAt?: string;
  completedAt?: string;

  // Relations
  messages?: CustomPaperMessage[];
  order?: Order;
}

export interface CustomPaperRequest {
  title: string;
  description: string;
  paperType: PaperType;
  academicArea: AcademicArea;
  pageCount: number;
  deadline: string;
  urgency: 'NORMAL' | 'URGENT' | 'VERY_URGENT';
  requirements: string;
  keywords?: string;
  references?: string;
  requirementFiles?: string[];
}

export interface CustomPaperMessage {
  id: string;
  customPaperId: string;
  senderId: string;
  sender?: User;
  content: string;
  attachments: string[];
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
}

export type CustomPaperStatus =
  | 'REQUESTED'
  | 'QUOTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
