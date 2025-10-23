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
  | 'other';

export type CourseStatus = 'ACTIVE' | 'INACTIVE';

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: CourseLesson[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  content?: string;
  duration?: number;
  order: number;
  isEnabled?: boolean;
  attachments?: string[];
  progress?: CourseProgress[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  watchTime: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  course?: Course;
}

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Course {
  id: string;
  title: string;
  description: string;
  academicArea: string;
  instructorName: string;
  instructorBio?: string;
  price: number;
  duration: number;
  level: CourseLevel;
  thumbnailUrl?: string;
  videoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  createdAt: string;
  modules?: CourseModule[];
  enrollments?: CourseEnrollment[];
  isEnrolled?: boolean;
}

export interface CourseWithProgress extends Course {
  modules: (CourseModule & {
    lessons: (CourseLesson & {
      progress: CourseProgress[];
    })[];
  })[];
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export interface CourseFormData {
  title: string;
  description: string;
  academicArea: AcademicArea;
  instructorName: string;
  instructorBio: string;
  price: number;
  duration: number;
  status: CourseStatus;
  isFeatured?: boolean;
  thumbnail?: File;
  video?: File;
}
