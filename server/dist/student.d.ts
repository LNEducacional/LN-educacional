export declare function getStudentDashboard(userId: string): Promise<{
    user: {
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        verified: boolean;
    } | null;
    stats: {
        totalOrders: number;
        enrolledCourses: number;
        certificates: number;
        libraryItems: number;
    };
    recentOrders: ({
        items: {
            title: string;
            price: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        id: string;
        createdAt: Date;
        userId: string | null;
        updatedAt: Date;
        totalAmount: number;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        customerName: string;
        customerEmail: string;
        customerCpfCnpj: string;
        customerPhone: string | null;
        pixCode: string | null;
        boletoUrl: string | null;
    })[];
    recentCertificates: ({
        course: {
            title: string;
            thumbnailUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        courseId: string;
        userId: string;
        certificateNumber: string;
        grade: number;
        completionDate: Date;
        qrCodeUrl: string;
    })[];
}>;
export declare function getStudentCourses(userId: string): Promise<{
    completed: boolean;
    enrolledAt: Date;
    progress: number;
    lastAccessedAt: null;
    title?: string | undefined;
    description?: string | undefined;
    academicArea?: import(".prisma/client").$Enums.AcademicArea | undefined;
    price?: number | undefined;
    status?: import(".prisma/client").$Enums.CourseStatus | undefined;
    id?: string | undefined;
    thumbnailUrl?: string | null | undefined;
    createdAt?: Date | undefined;
    instructorName?: string | undefined;
    instructorBio?: string | null | undefined;
    duration?: number | undefined;
    level?: import(".prisma/client").$Enums.CourseLevel | undefined;
    videoUrl?: string | null | undefined;
}[]>;
export declare function getStudentLibrary(userId: string): Promise<{
    id: string;
    type: import(".prisma/client").$Enums.LibraryItemType;
    downloadUrl: string;
    expiresAt: Date | null;
    createdAt: Date;
    details: Record<string, unknown> | null;
}[]>;
export declare function getStudentDownloads(userId: string): Promise<{
    id: string;
    title: string;
    type: "EBOOK" | "PDF" | "MATERIAL";
    size: string;
    downloadUrl: string;
    downloadedAt: string;
    expiresAt: string | undefined;
}[]>;
export declare function getStudentCertificates(userId: string): Promise<({
    course: {
        title: string;
        description: string;
        thumbnailUrl: string | null;
        instructorName: string;
        duration: number;
    };
} & {
    id: string;
    createdAt: Date;
    courseId: string;
    userId: string;
    certificateNumber: string;
    grade: number;
    completionDate: Date;
    qrCodeUrl: string;
})[]>;
export declare function generateCertificateQRCode(certificateId: string): Promise<string>;
export declare function completeCourse(userId: string, courseId: string, grade: number): Promise<{
    user: {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        verified: boolean;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
    };
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
    };
} & {
    id: string;
    createdAt: Date;
    courseId: string;
    userId: string;
    certificateNumber: string;
    grade: number;
    completionDate: Date;
    qrCodeUrl: string;
}>;
export declare function getStudentProfile(userId: string): Promise<{
    stats: {
        totalOrders: number;
        totalCertificates: number;
        totalLibraryItems: number;
    };
    id: string;
    createdAt: Date;
    _count: {
        library: number;
        certificates: number;
        orders: number;
    };
    name: string;
    email: string;
    role: import(".prisma/client").$Enums.UserRole;
    verified: boolean;
}>;
export declare function updateStudentProfile(userId: string, data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}): Promise<{
    id: string;
    name: string;
    email: string;
    role: import(".prisma/client").$Enums.UserRole;
    verified: boolean;
}>;
export declare function verifyCertificate(certificateNumber: string): Promise<{
    valid: boolean;
    certificate: {
        number: string;
        studentName: string;
        courseTitle: string;
        courseDescription: string;
        instructorName: string;
        courseDuration: number;
        grade: number;
        completionDate: Date;
        issuedAt: Date;
    };
}>;
//# sourceMappingURL=student.d.ts.map