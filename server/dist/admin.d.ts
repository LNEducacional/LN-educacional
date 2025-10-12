export declare function getAdminDashboardStats(): Promise<{
    stats: {
        totalUsers: number;
        totalOrders: number;
        totalRevenue: number;
        totalCourses: number;
        totalPapers: number;
        totalEbooks: number;
        totalCertificates: number;
        pendingCollaborators: number;
        unreadMessages: number;
    };
    recentOrders: ({
        user: {
            name: string;
            email: string;
        } | null;
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
    recentUsers: {
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[];
    monthlyRevenue: {
        date: Date;
        revenue: number;
    }[];
    downloads: {
        total: number;
        today: number;
        topPapers: {
            downloads: number;
            title?: string | undefined;
            authorName?: string | undefined;
            id?: string | undefined;
            isFree?: boolean | undefined;
        }[];
    };
}>;
export declare function getAllUsers(filters?: {
    role?: string;
    verified?: boolean;
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    users: {
        id: string;
        createdAt: Date;
        _count: {
            certificates: number;
            orders: number;
        };
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        verified: boolean;
    }[];
    total: number;
}>;
export declare function getUserById(userId: string): Promise<{
    id: string;
    createdAt: Date;
    _count: {
        certificates: number;
        orders: number;
    };
    name: string;
    email: string;
    role: import(".prisma/client").$Enums.UserRole;
    verified: boolean;
} | null>;
export declare function updateUserRole(userId: string, role: 'ADMIN' | 'STUDENT' | 'COLLABORATOR'): Promise<{
    id: string;
    name: string;
    email: string;
    role: import(".prisma/client").$Enums.UserRole;
}>;
export declare function updateUser(userId: string, data: {
    name?: string;
    email?: string;
    role?: 'ADMIN' | 'STUDENT' | 'COLLABORATOR';
}): Promise<{
    id: string;
    createdAt: Date;
    _count: {
        certificates: number;
        orders: number;
    };
    name: string;
    email: string;
    role: import(".prisma/client").$Enums.UserRole;
    verified: boolean;
}>;
export declare function deleteUser(userId: string): Promise<{
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
}>;
export declare function getBlogPosts(filters?: {
    published?: boolean;
    search?: string;
    categoryId?: string;
    tagIds?: string[];
    skip?: number;
    take?: number;
}): Promise<{}>;
export declare function getBlogPostBySlug(slug: string): Promise<(object & Record<"published", unknown>) | null>;
export declare function createBlogPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImageUrl?: string;
    published?: boolean;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
    scheduledAt?: Date;
    authorId: string;
    categoryId?: string;
    tagIds?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    readingTime?: number;
}): Promise<{
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    author: {
        id: string;
        name: string;
        email: string;
    };
    tags: ({
        tag: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
} & {
    title: string;
    status: import(".prisma/client").$Enums.PostStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    published: boolean;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    authorId: string;
    categoryId: string | null;
    views: number;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string[];
    ogImage: string | null;
    canonicalUrl: string | null;
    readingTime: number | null;
}>;
export declare function updateBlogPost(id: string, data: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImageUrl?: string;
    published?: boolean;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
    scheduledAt?: Date;
    categoryId?: string;
    tagIds?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    readingTime?: number;
}): Promise<{
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    author: {
        id: string;
        name: string;
        email: string;
    };
    tags: ({
        tag: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
} & {
    title: string;
    status: import(".prisma/client").$Enums.PostStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    published: boolean;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    authorId: string;
    categoryId: string | null;
    views: number;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string[];
    ogImage: string | null;
    canonicalUrl: string | null;
    readingTime: number | null;
}>;
export declare function deleteBlogPost(id: string): Promise<{
    title: string;
    status: import(".prisma/client").$Enums.PostStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    published: boolean;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    authorId: string;
    categoryId: string | null;
    views: number;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string[];
    ogImage: string | null;
    canonicalUrl: string | null;
    readingTime: number | null;
}>;
export declare function getMessages(filters?: {
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    messages: {
        status: import(".prisma/client").$Enums.MessageStatus;
        message: string;
        category: string | null;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        email: string;
        subject: string;
        phone: string | null;
        replied: boolean;
        repliedAt: Date | null;
        replyContent: string | null;
        assignedTo: string | null;
        priority: import(".prisma/client").$Enums.Priority;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[];
    total: number;
}>;
export declare function createMessage(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    category?: string;
    metadata?: any;
}): Promise<{
    status: import(".prisma/client").$Enums.MessageStatus;
    message: string;
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    email: string;
    subject: string;
    phone: string | null;
    replied: boolean;
    repliedAt: Date | null;
    replyContent: string | null;
    assignedTo: string | null;
    priority: import(".prisma/client").$Enums.Priority;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare function updateMessageStatus(id: string, status: 'UNREAD' | 'READ' | 'ARCHIVED'): Promise<{
    status: import(".prisma/client").$Enums.MessageStatus;
    message: string;
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    email: string;
    subject: string;
    phone: string | null;
    replied: boolean;
    repliedAt: Date | null;
    replyContent: string | null;
    assignedTo: string | null;
    priority: import(".prisma/client").$Enums.Priority;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare function getCollaboratorApplications(filters?: {
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    applications: ({
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ApplicationStatus;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        email: string;
        phone: string;
        area: string;
        fullName: string;
        cpf: string | null;
        birthDate: Date | null;
        zipCode: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        education: string | null;
        experience: string;
        skills: import("@prisma/client/runtime/library").JsonValue | null;
        availability: string;
        expectedSalary: number | null;
        resumeUrl: string | null;
        portfolioUrls: import("@prisma/client/runtime/library").JsonValue | null;
        linkedin: string | null;
        github: string | null;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        score: number | null;
        reviewedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        reviewerId: string | null;
    })[];
    total: number;
}>;
export declare function applyAsCollaborator(userId: string, data: {
    fullName: string;
    email: string;
    phone: string;
    area: string;
    experience: string;
    availability: string;
    resumeUrl?: string;
}): Promise<{
    status: import(".prisma/client").$Enums.ApplicationStatus;
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    email: string;
    phone: string;
    area: string;
    fullName: string;
    cpf: string | null;
    birthDate: Date | null;
    zipCode: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    education: string | null;
    experience: string;
    skills: import("@prisma/client/runtime/library").JsonValue | null;
    availability: string;
    expectedSalary: number | null;
    resumeUrl: string | null;
    portfolioUrls: import("@prisma/client/runtime/library").JsonValue | null;
    linkedin: string | null;
    github: string | null;
    stage: import(".prisma/client").$Enums.ApplicationStage;
    score: number | null;
    reviewedAt: Date | null;
    approvedAt: Date | null;
    rejectedAt: Date | null;
    reviewerId: string | null;
}>;
export declare function updateCollaboratorStatus(id: string, status: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED'): Promise<{
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
} & {
    status: import(".prisma/client").$Enums.ApplicationStatus;
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    email: string;
    phone: string;
    area: string;
    fullName: string;
    cpf: string | null;
    birthDate: Date | null;
    zipCode: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    education: string | null;
    experience: string;
    skills: import("@prisma/client/runtime/library").JsonValue | null;
    availability: string;
    expectedSalary: number | null;
    resumeUrl: string | null;
    portfolioUrls: import("@prisma/client/runtime/library").JsonValue | null;
    linkedin: string | null;
    github: string | null;
    stage: import(".prisma/client").$Enums.ApplicationStage;
    score: number | null;
    reviewedAt: Date | null;
    approvedAt: Date | null;
    rejectedAt: Date | null;
    reviewerId: string | null;
}>;
export declare function getAnalytics(period?: '7d' | '30d' | '90d' | 'day' | 'week' | 'month' | 'year'): Promise<{
    period: "7d" | "30d" | "90d" | "day" | "week" | "month" | "year";
    orders: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "status"[]> & {
        _count: number;
    })[];
    users: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, "role"[]> & {
        _count: number;
    })[];
    revenue: {
        total: number;
        average: number;
        count: number;
    };
    topProducts: {
        product: {
            title: string;
            price: number;
        } | null;
        type: string;
        salesCount: number;
        totalRevenue: number;
    }[];
    conversionRate: number;
}>;
export declare function getDownloadAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    itemType?: string;
    academicArea?: string;
}): Promise<{
    summary: {
        totalDownloads: number;
        uniqueUsers: number;
        averagePerDay: number;
        period: {
            startDate: Date;
            endDate: Date;
        };
    };
    charts: {
        dailyDownloads: {
            date: string;
            downloads: any;
        }[];
        downloadsByType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.DownloadTrackingGroupByOutputType, "itemType"[]> & {
            _count: {
                id: number;
            };
        })[];
        downloadsByArea: {
            academicArea: import(".prisma/client").$Enums.AcademicArea;
            _count: {
                id: number;
            };
        }[];
    };
    topItems: {
        itemType: string;
        downloads: number;
        title?: string | undefined;
        academicArea?: import(".prisma/client").$Enums.AcademicArea | undefined;
        authorName?: string | undefined;
        id?: string | undefined;
    }[];
    filters: {
        startDate: Date;
        endDate: Date;
        itemType: string | undefined;
        academicArea: string | undefined;
    };
}>;
export declare function getEbookAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    academicArea?: string;
}): Promise<{
    summary: {
        totalEbooks: number;
        freeEbooks: number;
        paidEbooks: number;
        totalRevenue: number;
        totalSales: number;
        totalDownloads: number;
        period: {
            startDate: Date;
            endDate: Date;
        };
    };
    topEbooksByDownloads: {
        downloads: number;
        title?: string | undefined;
        academicArea?: import(".prisma/client").$Enums.AcademicArea | undefined;
        authorName?: string | undefined;
        price?: number | undefined;
        pageCount?: number | undefined;
        id?: string | undefined;
    }[];
    topEbooksByRevenue: {
        totalRevenue: number;
        salesCount: number;
        title?: string | undefined;
        academicArea?: import(".prisma/client").$Enums.AcademicArea | undefined;
        authorName?: string | undefined;
        price?: number | undefined;
        pageCount?: number | undefined;
        id?: string | undefined;
    }[];
    ebooksByArea: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.EbookGroupByOutputType, "academicArea"[]> & {
        _count: number;
    })[];
}>;
export declare function getEbookDownloadsByPeriod(ebookId: string, period?: 'day' | 'week' | 'month'): Promise<{
    date: string;
    downloads: any;
}[]>;
export declare function getCategories(filters?: {
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    categories: ({
        _count: {
            posts: number;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
    })[];
    total: number;
}>;
export declare function getCategoryById(id: string): Promise<({
    _count: {
        posts: number;
    };
    posts: {
        title: string;
        id: string;
        createdAt: Date;
        published: boolean;
        slug: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}) | null>;
export declare function createCategory(data: {
    name: string;
    slug?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}>;
export declare function updateCategory(id: string, data: {
    name?: string;
    slug?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}>;
export declare function deleteCategory(id: string): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}>;
export declare function getTags(filters?: {
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    tags: ({
        _count: {
            posts: number;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
    })[];
    total: number;
}>;
export declare function getTagById(id: string): Promise<({
    _count: {
        posts: number;
    };
    posts: ({
        post: {
            title: string;
            id: string;
            createdAt: Date;
            published: boolean;
            slug: string;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}) | null>;
export declare function createTag(data: {
    name: string;
    slug?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}>;
export declare function updateTag(id: string, data: {
    name?: string;
    slug?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}>;
export declare function deleteTag(id: string): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
}>;
export declare function getComments(filters?: {
    postId?: string;
    approved?: boolean;
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    comments: ({
        user: {
            id: string;
            name: string;
            email: string;
        };
        _count: {
            replies: number;
        };
        post: {
            title: string;
            id: string;
            slug: string;
        };
        parent: {
            user: {
                name: string;
            };
            id: string;
            content: string;
        } | null;
        replies: ({
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            content: string;
            approved: boolean;
            postId: string;
            parentId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        content: string;
        approved: boolean;
        postId: string;
        parentId: string | null;
    })[];
    total: number;
}>;
export declare function getCommentsByPostId(postId: string, approved?: boolean): Promise<({
    user: {
        id: string;
        name: string;
    };
    _count: {
        replies: number;
    };
    replies: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        content: string;
        approved: boolean;
        postId: string;
        parentId: string | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    content: string;
    approved: boolean;
    postId: string;
    parentId: string | null;
})[]>;
export declare function createComment(data: {
    content: string;
    postId: string;
    userId: string;
    parentId?: string;
}): Promise<{
    user: {
        id: string;
        name: string;
    };
    post: {
        title: string;
        id: string;
    };
} & {
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    content: string;
    approved: boolean;
    postId: string;
    parentId: string | null;
}>;
export declare function updateComment(id: string, data: {
    content?: string;
    approved?: boolean;
}): Promise<{
    user: {
        id: string;
        name: string;
    };
} & {
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    content: string;
    approved: boolean;
    postId: string;
    parentId: string | null;
}>;
export declare function deleteComment(id: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    content: string;
    approved: boolean;
    postId: string;
    parentId: string | null;
}>;
export declare function approveComment(id: string): Promise<{
    user: {
        id: string;
        name: string;
    };
} & {
    id: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    content: string;
    approved: boolean;
    postId: string;
    parentId: string | null;
}>;
export declare function toggleLike(postId: string, userId: string): Promise<{
    liked: boolean;
}>;
export declare function getPostLikeCount(postId: string): Promise<{
    count: number;
}>;
export declare function getUserLikeStatus(postId: string, userId: string): Promise<{
    liked: boolean;
}>;
export declare function getPostLikes(postId: string): Promise<{
    likes: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
    })[];
    count: number;
}>;
export declare function getRelatedPosts(postId: string, limit?: number): Promise<({
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    _count: {
        comments: number;
        likes: number;
    };
    author: {
        id: string;
        name: string;
    };
    tags: ({
        tag: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
} & {
    title: string;
    status: import(".prisma/client").$Enums.PostStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    published: boolean;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    authorId: string;
    categoryId: string | null;
    views: number;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string[];
    ogImage: string | null;
    canonicalUrl: string | null;
    readingTime: number | null;
})[]>;
export declare function generateSitemap(baseUrl?: string): Promise<string>;
export declare function generateRssFeed(baseUrl?: string): Promise<string>;
export declare function searchBlogPosts(query: {
    search?: string;
    categoryId?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    authorId?: string;
    published?: boolean;
    sortBy?: 'date' | 'popularity' | 'relevance' | 'views';
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
}): Promise<{
    posts: ({
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
        _count: {
            comments: number;
            likes: number;
            tags: number;
        };
        author: {
            id: string;
            name: string;
            email: string;
        };
        tags: ({
            tag: {
                id: string;
                name: string;
                slug: string;
            };
        } & {
            postId: string;
            tagId: string;
        })[];
    } & {
        title: string;
        status: import(".prisma/client").$Enums.PostStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        published: boolean;
        slug: string;
        excerpt: string | null;
        coverImageUrl: string | null;
        scheduledAt: Date | null;
        publishedAt: Date | null;
        authorId: string;
        categoryId: string | null;
        views: number;
        metaTitle: string | null;
        metaDescription: string | null;
        metaKeywords: string[];
        ogImage: string | null;
        canonicalUrl: string | null;
        readingTime: number | null;
    })[];
    total: number;
    query: {
        search?: string;
        categoryId?: string;
        tags?: string[];
        dateFrom?: Date;
        dateTo?: Date;
        authorId?: string;
        published?: boolean;
        sortBy?: "date" | "popularity" | "relevance" | "views";
        sortOrder?: "asc" | "desc";
        skip?: number;
        take?: number;
    };
}>;
export declare function replyToMessage(messageId: string, content: string, adminId: string): Promise<{
    status: import(".prisma/client").$Enums.MessageStatus;
    message: string;
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    email: string;
    subject: string;
    phone: string | null;
    replied: boolean;
    repliedAt: Date | null;
    replyContent: string | null;
    assignedTo: string | null;
    priority: import(".prisma/client").$Enums.Priority;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare function deleteMessage(messageId: string): Promise<{
    status: import(".prisma/client").$Enums.MessageStatus;
    message: string;
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    email: string;
    subject: string;
    phone: string | null;
    replied: boolean;
    repliedAt: Date | null;
    replyContent: string | null;
    assignedTo: string | null;
    priority: import(".prisma/client").$Enums.Priority;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare function bulkMarkMessagesAsRead(messageIds: string[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare function getMessageStats(): Promise<{
    total: number;
    unread: number;
    replied: number;
    replyRate: number;
    statusStats: {
        status: import(".prisma/client").$Enums.MessageStatus;
        count: number;
    }[];
    priorityStats: {
        priority: import(".prisma/client").$Enums.Priority;
        count: number;
    }[];
    recentActivity: {
        date: string;
        count: number;
    }[];
}>;
export declare function getLegalDocuments(filters?: {
    type?: string;
    active?: boolean;
    skip?: number;
    take?: number;
}): Promise<{
    documents: {
        title: string;
        type: import(".prisma/client").$Enums.LegalType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        active: boolean;
        version: string;
        publishedBy: string;
    }[];
    total: number;
}>;
export declare function getLegalDocumentByType(type: string): Promise<{
    title: string;
    type: import(".prisma/client").$Enums.LegalType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    active: boolean;
    version: string;
    publishedBy: string;
} | null>;
export declare function createLegalDocument(data: {
    type: string;
    title: string;
    content: string;
    publishedBy: string;
}): Promise<{
    title: string;
    type: import(".prisma/client").$Enums.LegalType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    active: boolean;
    version: string;
    publishedBy: string;
}>;
export declare function updateLegalDocument(id: string, data: {
    title?: string;
    content?: string;
    active?: boolean;
}): Promise<{
    title: string;
    type: import(".prisma/client").$Enums.LegalType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    active: boolean;
    version: string;
    publishedBy: string;
}>;
export declare function deleteLegalDocument(id: string): Promise<{
    title: string;
    type: import(".prisma/client").$Enums.LegalType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    active: boolean;
    version: string;
    publishedBy: string;
}>;
export declare function getLegalDocumentVersions(type: string): Promise<{
    title: string;
    type: import(".prisma/client").$Enums.LegalType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    active: boolean;
    version: string;
    publishedBy: string;
}[]>;
export declare function getMessageTemplates(filters?: {
    category?: string;
    search?: string;
    skip?: number;
    take?: number;
}): Promise<{
    templates: {
        category: string | null;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        content: string;
        subject: string;
        variables: string[];
        createdBy: string;
    }[];
    total: number;
}>;
export declare function createMessageTemplate(data: {
    name: string;
    subject: string;
    content: string;
    variables?: string[];
    category?: string;
    createdBy: string;
}): Promise<{
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    content: string;
    subject: string;
    variables: string[];
    createdBy: string;
}>;
export declare function updateMessageTemplate(id: string, data: {
    name?: string;
    subject?: string;
    content?: string;
    variables?: string[];
    category?: string;
}): Promise<{
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    content: string;
    subject: string;
    variables: string[];
    createdBy: string;
}>;
export declare function deleteMessageTemplate(id: string): Promise<{
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    content: string;
    subject: string;
    variables: string[];
    createdBy: string;
}>;
export declare function getMessageTemplateById(id: string): Promise<{
    category: string | null;
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    content: string;
    subject: string;
    variables: string[];
    createdBy: string;
} | null>;
//# sourceMappingURL=admin.d.ts.map