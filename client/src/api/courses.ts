import api from '@/services/api';
import type { Course, CourseLesson, CourseModule, CourseProgress } from '@/types/course';

export const coursesApi = {
  // Public APIs
  getCourses: (params?: {
    area?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ courses: Course[]; total: number }>('/courses', { params }),

  getCourse: async (id: string) => {
    const response = await api.get<Course & { isEnrolled: boolean }>(`/courses/${id}`);
    return response.data;
  },

  getCourseModules: async (courseId: string) => {
    const response = await api.get<CourseModule[]>(`/courses/${courseId}/modules`);
    return response.data;
  },

  // Student APIs
  enrollInCourse: (courseId: string) => api.post(`/courses/${courseId}/enroll`),

  getCourseProgress: (courseId: string) => api.get(`/courses/${courseId}/progress`),

  updateLessonProgress: (
    lessonId: string,
    data: {
      completed?: boolean;
      watchTime?: number;
    }
  ) => api.put(`/lessons/${lessonId}/progress`, data),

  // Admin APIs
  createCourse: (data: Partial<Course>) => api.post<Course>('/admin/courses', data),

  updateCourse: (id: string, data: Partial<Course>) =>
    api.put<Course>(`/admin/courses/${id}`, data),

  deleteCourse: (id: string) => api.delete(`/admin/courses/${id}`),

  uploadThumbnail: (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/courses/${courseId}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createModule: (
    courseId: string,
    data: {
      title: string;
      description?: string;
      order: number;
    }
  ) => api.post<CourseModule>(`/admin/courses/${courseId}/modules`, data),

  updateModule: (moduleId: string, data: Partial<CourseModule>) =>
    api.put<CourseModule>(`/admin/modules/${moduleId}`, data),

  deleteModule: (moduleId: string) => api.delete(`/admin/modules/${moduleId}`),

  createLesson: (
    moduleId: string,
    data: {
      title: string;
      description?: string;
      content?: string;
      duration?: number;
      order: number;
    }
  ) => api.post<CourseLesson>(`/admin/modules/${moduleId}/lessons`, data),

  updateLesson: (lessonId: string, data: Partial<CourseLesson>) =>
    api.put<CourseLesson>(`/admin/lessons/${lessonId}`, data),

  deleteLesson: (lessonId: string) => api.delete(`/admin/lessons/${lessonId}`),

  uploadVideo: (lessonId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/lessons/${lessonId}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
