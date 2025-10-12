export interface CollaboratorApplication {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  experience: string;
  availability: string;
  resumeUrl: string | null;
  status: 'pending' | 'interviewing' | 'approved' | 'rejected';
  stage: ApplicationStage;
  score?: number;
  createdAt: Date;
  updatedAt?: Date;
  reviewedAt?: Date;
  evaluations?: Evaluation[];
  notes?: Note[];
  interviews?: Interview[];
}

export type ApplicationStage =
  | 'RECEIVED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'TECHNICAL_TEST'
  | 'FINAL_REVIEW'
  | 'OFFER'
  | 'HIRED';

export interface Evaluation {
  id: string;
  applicationId: string;
  evaluatorId: string;
  evaluator?: {
    id: string;
    name: string;
  };
  experienceScore: number;
  skillsScore: number;
  educationScore: number;
  culturalFitScore: number;
  totalScore: number;
  recommendation: EvaluationRecommendation;
  comments: string;
  createdAt: Date;
}

export type EvaluationRecommendation =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'MAYBE'
  | 'NO_HIRE'
  | 'STRONG_NO_HIRE';

export interface Note {
  id: string;
  applicationId: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
  };
  content: string;
  isPrivate: boolean;
  createdAt: Date;
}

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: Date;
  duration: number;
  type: InterviewType;
  location?: string;
  meetingUrl?: string;
  interviewerId: string;
  interviewer?: {
    id: string;
    name: string;
  };
  status: InterviewStatus;
  feedback?: string;
  result?: InterviewResult;
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewType =
  | 'PHONE_SCREENING'
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'FINAL';

export type InterviewStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type InterviewResult =
  | 'PASS'
  | 'FAIL'
  | 'UNDECIDED';

export interface CollaboratorAnalytics {
  totalApplications: number;
  approvalRate: number;
  avgTimeToHire: number;
  inPipeline: number;
  applicationsOverTime: {
    month: string;
    applications: number;
  }[];
  conversionFunnel: {
    stage: string;
    count: number;
  }[];
  areaDistribution: {
    name: string;
    value: number;
  }[];
  avgScoreByStage: {
    stage: string;
    avgScore: number;
  }[];
  topCandidates: CollaboratorApplication[];
}
