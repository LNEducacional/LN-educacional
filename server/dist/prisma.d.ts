import { type Course, type Ebook, type Paper, type Prisma, PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function getPapers(filters: {
    type?: string;
    area?: string;
    free?: boolean;
    maxPrice?: number;
    maxPages?: number;
    skip?: number;
    take?: number;
}): Promise<{
    papers: {
        title: string;
        description: string;
        academicArea: import(".prisma/client").$Enums.AcademicArea;
        authorName: string;
        price: number;
        pageCount: number;
        fileUrl: string;
        id: string;
        paperType: import(".prisma/client").$Enums.PaperType;
        language: string;
        keywords: string | null;
        previewUrl: string | null;
        thumbnailUrl: string | null;
        isFree: boolean;
        createdAt: Date;
    }[];
    total: number;
}>;
export declare function getPaperById(id: string): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    id: string;
    paperType: import(".prisma/client").$Enums.PaperType;
    language: string;
    keywords: string | null;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    isFree: boolean;
    createdAt: Date;
} | null>;
export declare function createPaper(data: {
    title: string;
    description: string;
    paperType: string;
    academicArea: string;
    price: number;
    pageCount: number;
    authorName: string;
    language?: string;
    keywords?: string;
    previewUrl?: string;
    fileUrl: string;
    thumbnailUrl?: string;
    isFree?: boolean;
}): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    id: string;
    paperType: import(".prisma/client").$Enums.PaperType;
    language: string;
    keywords: string | null;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    isFree: boolean;
    createdAt: Date;
}>;
export declare function updatePaper(id: string, data: Partial<{
    title: string;
    description: string;
    paperType: string;
    academicArea: string;
    price: number;
    pageCount: number;
    authorName: string;
    language: string;
    keywords: string;
    previewUrl: string;
    fileUrl: string;
    thumbnailUrl: string;
    isFree: boolean;
}>): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    id: string;
    paperType: import(".prisma/client").$Enums.PaperType;
    language: string;
    keywords: string | null;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    isFree: boolean;
    createdAt: Date;
}>;
export declare function deletePaper(id: string): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    id: string;
    paperType: import(".prisma/client").$Enums.PaperType;
    language: string;
    keywords: string | null;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    isFree: boolean;
    createdAt: Date;
}>;
export declare function addPaperToLibrary(userId: string, paperId: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    itemType: import(".prisma/client").$Enums.LibraryItemType;
    itemId: string;
    downloadUrl: string;
    expiresAt: Date | null;
}>;
export declare function trackDownload(userId: string, itemId: string, itemType: string): Promise<{
    id: string;
    userId: string;
    itemType: string;
    itemId: string;
    downloadedAt: Date;
}>;
export declare function getCourses(filters: {
    area?: string;
    status?: string;
    featured?: boolean;
    skip?: number;
    take?: number;
}): Promise<{
    courses: {
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
    }[];
    total: number;
}>;
export declare function getCourseById(id: string): Promise<{
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
} | null>;
export declare function createCourse(data: {
    title: string;
    description: string;
    academicArea: string;
    instructorName: string;
    instructorBio?: string;
    price: number;
    duration: number;
    thumbnailUrl?: string;
    videoUrl?: string;
    status?: string;
    isFeatured?: boolean;
}): Promise<{
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
}>;
export declare function updateCourse(id: string, data: Partial<{
    title: string;
    description: string;
    academicArea: string;
    instructorName: string;
    instructorBio: string;
    price: number;
    duration: number;
    thumbnailUrl: string;
    videoUrl: string;
    status: string;
    isFeatured: boolean;
}>): Promise<{
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
}>;
export declare function deleteCourse(id: string): Promise<{
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
}>;
export declare function getEbooks(filters: {
    area?: string;
    skip?: number;
    take?: number;
}): Promise<{
    ebooks: {
        title: string;
        description: string;
        academicArea: import(".prisma/client").$Enums.AcademicArea;
        authorName: string;
        price: number;
        pageCount: number;
        coverUrl: string | null;
        id: string;
        createdAt: Date;
    }[];
    total: number;
}>;
export declare function getEbookById(id: string): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string | null;
    id: string;
    createdAt: Date;
} | null>;
export declare function createEbook(data: {
    title: string;
    description: string;
    academicArea: string;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl?: string;
}): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string | null;
    id: string;
    createdAt: Date;
}>;
export declare function updateEbook(id: string, data: Partial<{
    title: string;
    description: string;
    academicArea: string;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string;
}>): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string | null;
    id: string;
    createdAt: Date;
}>;
export declare function deleteEbook(id: string): Promise<{
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string | null;
    id: string;
    createdAt: Date;
}>;
export declare function getEbooksByUserId(userId: string): Promise<({
    title: string;
    description: string;
    academicArea: import(".prisma/client").$Enums.AcademicArea;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl: string | null;
    id: string;
    createdAt: Date;
} | null)[]>;
export declare function hasUserPurchasedEbook(userId: string, ebookId: string): Promise<boolean>;
export declare function addEbookToLibrary(userId: string, ebookId: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    itemType: import(".prisma/client").$Enums.LibraryItemType;
    itemId: string;
    downloadUrl: string;
    expiresAt: Date | null;
}>;
export declare function searchProducts(query: string, type?: 'paper' | 'course' | 'ebook'): Promise<{
    papers?: Paper[];
    courses?: Course[];
    ebooks?: Ebook[];
}>;
export declare function createOrder(data: {
    userId?: string;
    items: Array<{
        title: string;
        description?: string;
        price: number;
        paperId?: string;
        courseId?: string;
        ebookId?: string;
    }>;
    totalAmount: number;
    paymentMethod?: string;
    customerName: string;
    customerEmail: string;
    customerCpfCnpj: string;
    customerPhone?: string;
}): Promise<{
    items: ({
        paper: {
            title: string;
            description: string;
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            authorName: string;
            price: number;
            pageCount: number;
            fileUrl: string;
            id: string;
            paperType: import(".prisma/client").$Enums.PaperType;
            language: string;
            keywords: string | null;
            previewUrl: string | null;
            thumbnailUrl: string | null;
            isFree: boolean;
            createdAt: Date;
        } | null;
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
        } | null;
        ebook: {
            title: string;
            description: string;
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            authorName: string;
            price: number;
            pageCount: number;
            fileUrl: string;
            coverUrl: string | null;
            id: string;
            createdAt: Date;
        } | null;
    } & {
        title: string;
        description: string | null;
        price: number;
        id: string;
        orderId: string;
        courseId: string | null;
        ebookId: string | null;
        paperId: string | null;
    })[];
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
}>;
export declare function getOrderById(id: string): Promise<({
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
    items: ({
        paper: {
            title: string;
            description: string;
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            authorName: string;
            price: number;
            pageCount: number;
            fileUrl: string;
            id: string;
            paperType: import(".prisma/client").$Enums.PaperType;
            language: string;
            keywords: string | null;
            previewUrl: string | null;
            thumbnailUrl: string | null;
            isFree: boolean;
            createdAt: Date;
        } | null;
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
        } | null;
        ebook: {
            title: string;
            description: string;
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            authorName: string;
            price: number;
            pageCount: number;
            fileUrl: string;
            coverUrl: string | null;
            id: string;
            createdAt: Date;
        } | null;
    } & {
        title: string;
        description: string | null;
        price: number;
        id: string;
        orderId: string;
        courseId: string | null;
        ebookId: string | null;
        paperId: string | null;
    })[];
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
}) | null>;
export declare function getOrdersByUserId(userId: string, filters?: {
    status?: string;
    skip?: number;
    take?: number;
}): Promise<{
    orders: ({
        items: {
            title: string;
            description: string | null;
            price: number;
            id: string;
            orderId: string;
            courseId: string | null;
            ebookId: string | null;
            paperId: string | null;
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
    total: number;
}>;
export declare function getAllOrders(filters?: {
    status?: string;
    paymentStatus?: string;
    skip?: number;
    take?: number;
}): Promise<{
    orders: ({
        user: {
            id: string;
            name: string;
            email: string;
        } | null;
        items: {
            title: string;
            description: string | null;
            price: number;
            id: string;
            orderId: string;
            courseId: string | null;
            ebookId: string | null;
            paperId: string | null;
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
    total: number;
}>;
export declare function updateOrderStatus(id: string, status: string): Promise<{
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
}>;
export declare function updateOrderPaymentStatus(id: string, paymentStatus: string, paymentData?: {
    pixCode?: string;
    boletoUrl?: string;
}): Promise<{
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
}>;
export declare function generatePixCode(orderId: string): Promise<string>;
export declare function generateBoletoUrl(orderId: string): Promise<string>;
export declare function processPaymentWebhook(data: {
    orderId: string;
    status: 'paid' | 'failed' | 'canceled';
    paymentMethod: string;
}): Promise<{
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
    items: ({
        paper: {
            title: string;
            description: string;
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            authorName: string;
            price: number;
            pageCount: number;
            fileUrl: string;
            id: string;
            paperType: import(".prisma/client").$Enums.PaperType;
            language: string;
            keywords: string | null;
            previewUrl: string | null;
            thumbnailUrl: string | null;
            isFree: boolean;
            createdAt: Date;
        } | null;
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
        } | null;
        ebook: {
            title: string;
            description: string;
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            authorName: string;
            price: number;
            pageCount: number;
            fileUrl: string;
            coverUrl: string | null;
            id: string;
            createdAt: Date;
        } | null;
    } & {
        title: string;
        description: string | null;
        price: number;
        id: string;
        orderId: string;
        courseId: string | null;
        ebookId: string | null;
        paperId: string | null;
    })[];
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
}>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map