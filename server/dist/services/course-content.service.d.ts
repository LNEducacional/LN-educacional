import type { CourseLesson, CourseModule } from '@prisma/client';
export declare function getCourseModules(courseId: string): Promise<({
    lessons: {
        title: string;
        description: string | null;
        order: number;
        id: string;
        createdAt: Date;
        duration: number | null;
        videoUrl: string | null;
        updatedAt: Date;
        moduleId: string;
        content: string | null;
        isEnabled: boolean;
        attachments: string[];
    }[];
} & {
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    courseId: string;
    updatedAt: Date;
})[]>;
export declare function createModule(data: {
    courseId: string;
    title: string;
    description?: string;
    order: number;
}): Promise<{
    lessons: {
        title: string;
        description: string | null;
        order: number;
        id: string;
        createdAt: Date;
        duration: number | null;
        videoUrl: string | null;
        updatedAt: Date;
        moduleId: string;
        content: string | null;
        isEnabled: boolean;
        attachments: string[];
    }[];
} & {
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    courseId: string;
    updatedAt: Date;
}>;
export declare function updateModule(id: string, data: Partial<CourseModule>): Promise<{
    lessons: {
        title: string;
        description: string | null;
        order: number;
        id: string;
        createdAt: Date;
        duration: number | null;
        videoUrl: string | null;
        updatedAt: Date;
        moduleId: string;
        content: string | null;
        isEnabled: boolean;
        attachments: string[];
    }[];
} & {
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    courseId: string;
    updatedAt: Date;
}>;
export declare function deleteModule(id: string): Promise<{
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    courseId: string;
    updatedAt: Date;
}>;
export declare function createLesson(data: {
    moduleId: string;
    title: string;
    description?: string;
    videoUrl?: string;
    content?: string;
    duration?: number;
    order: number;
}): Promise<{
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    duration: number | null;
    videoUrl: string | null;
    updatedAt: Date;
    moduleId: string;
    content: string | null;
    isEnabled: boolean;
    attachments: string[];
}>;
export declare function updateLesson(id: string, data: Partial<CourseLesson>): Promise<{
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    duration: number | null;
    videoUrl: string | null;
    updatedAt: Date;
    moduleId: string;
    content: string | null;
    isEnabled: boolean;
    attachments: string[];
}>;
export declare function deleteLesson(id: string): Promise<{
    title: string;
    description: string | null;
    order: number;
    id: string;
    createdAt: Date;
    duration: number | null;
    videoUrl: string | null;
    updatedAt: Date;
    moduleId: string;
    content: string | null;
    isEnabled: boolean;
    attachments: string[];
}>;
export declare function getUserCourseProgress(userId: string, courseId: string): Promise<{
    modules: ({
        lessons: ({
            progress: {
                id: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                completedAt: Date | null;
                lessonId: string;
                completed: boolean;
                watchTime: number;
            }[];
        } & {
            title: string;
            description: string | null;
            order: number;
            id: string;
            createdAt: Date;
            duration: number | null;
            videoUrl: string | null;
            updatedAt: Date;
            moduleId: string;
            content: string | null;
            isEnabled: boolean;
            attachments: string[];
        })[];
    } & {
        title: string;
        description: string | null;
        order: number;
        id: string;
        createdAt: Date;
        courseId: string;
        updatedAt: Date;
    })[];
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
}>;
export declare function updateLessonProgress(data: {
    userId: string;
    lessonId: string;
    completed?: boolean;
    watchTime?: number;
}): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    completedAt: Date | null;
    lessonId: string;
    completed: boolean;
    watchTime: number;
}>;
export declare function enrollUserInCourse(userId: string, courseId: string): Promise<{
    id: string;
    courseId: string;
    userId: string;
    enrolledAt: Date;
    completedAt: Date | null;
    progress: number;
}>;
export declare function getUserEnrollments(userId: string): Promise<({
    course: {
        title: string;
        description: string;
        academicArea: import(".prisma/client").$Enums.AcademicArea;
        price: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        id: string;
        thumbnailUrl: string | null;
        createdAt: Date;
        instructorName: string;
        instructorBio: string | null;
        duration: number;
        level: import(".prisma/client").$Enums.CourseLevel;
        videoUrl: string | null;
        isFeatured: boolean;
    };
} & {
    id: string;
    courseId: string;
    userId: string;
    enrolledAt: Date;
    completedAt: Date | null;
    progress: number;
})[]>;
export declare function checkEnrollment(userId: string, courseId: string): Promise<boolean>;
//# sourceMappingURL=course-content.service.d.ts.map