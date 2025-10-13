"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentDashboard = getStudentDashboard;
exports.getStudentCourses = getStudentCourses;
exports.getStudentLibrary = getStudentLibrary;
exports.getStudentDownloads = getStudentDownloads;
exports.getStudentCertificates = getStudentCertificates;
exports.generateCertificateQRCode = generateCertificateQRCode;
exports.completeCourse = completeCourse;
exports.getStudentProfile = getStudentProfile;
exports.updateStudentProfile = updateStudentProfile;
exports.verifyCertificate = verifyCertificate;
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("./prisma");
async function getStudentDashboard(userId) {
    const [user, ordersCount, coursesCount, certificatesCount, libraryCount, recentOrders, recentCertificates,] = await Promise.all([
        prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                verified: true,
            },
        }),
        prisma_1.prisma.order.count({
            where: { userId, status: 'COMPLETED' },
        }),
        prisma_1.prisma.certificate.count({
            where: { userId },
        }),
        prisma_1.prisma.certificate.count({
            where: { userId },
        }),
        prisma_1.prisma.library.count({
            where: { userId },
        }),
        prisma_1.prisma.order.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    select: {
                        title: true,
                        price: true,
                    },
                },
            },
        }),
        prisma_1.prisma.certificate.findMany({
            where: { userId },
            take: 3,
            orderBy: { completionDate: 'desc' },
            include: {
                course: {
                    select: {
                        title: true,
                        thumbnailUrl: true,
                    },
                },
            },
        }),
    ]);
    return {
        user,
        stats: {
            totalOrders: ordersCount,
            enrolledCourses: coursesCount,
            certificates: certificatesCount,
            libraryItems: libraryCount,
        },
        recentOrders,
        recentCertificates,
    };
}
async function getStudentCourses(userId) {
    const enrolledCourses = await prisma_1.prisma.order.findMany({
        where: {
            userId,
            status: 'COMPLETED',
            items: {
                some: {
                    courseId: { not: null },
                },
            },
        },
        select: {
            createdAt: true,
            items: {
                where: {
                    courseId: { not: null },
                },
                include: {
                    course: true,
                },
            },
        },
    });
    const courses = enrolledCourses.flatMap((order) => order.items.map((item) => ({
        ...item.course,
        enrolledAt: order.createdAt,
        progress: 0,
        lastAccessedAt: null,
    })));
    const certificates = await prisma_1.prisma.certificate.findMany({
        where: { userId },
        select: { courseId: true },
    });
    const completedCourseIds = new Set(certificates.map((cert) => cert.courseId));
    return courses.map((course) => ({
        ...course,
        completed: course?.id ? completedCourseIds.has(course.id) : false,
    }));
}
async function getStudentLibrary(userId) {
    const library = await prisma_1.prisma.library.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    const itemsWithDetails = await Promise.all(library.map(async (item) => {
        let details = null;
        if (item.itemType === 'PAPER') {
            details = await prisma_1.prisma.paper.findUnique({
                where: { id: item.itemId },
                select: {
                    title: true,
                    description: true,
                    paperType: true,
                    pageCount: true,
                    authorName: true,
                    thumbnailUrl: true,
                },
            });
        }
        else if (item.itemType === 'EBOOK') {
            details = await prisma_1.prisma.ebook.findUnique({
                where: { id: item.itemId },
                select: {
                    title: true,
                    description: true,
                    pageCount: true,
                    authorName: true,
                    coverUrl: true,
                },
            });
        }
        else if (item.itemType === 'COURSE_MATERIAL') {
            details = await prisma_1.prisma.course.findUnique({
                where: { id: item.itemId },
                select: {
                    title: true,
                    description: true,
                    instructorName: true,
                    duration: true,
                    thumbnailUrl: true,
                },
            });
        }
        return {
            id: item.id,
            type: item.itemType,
            downloadUrl: item.downloadUrl,
            expiresAt: item.expiresAt,
            createdAt: item.createdAt,
            details,
        };
    }));
    return itemsWithDetails;
}
async function getStudentDownloads(userId) {
    const library = await prisma_1.prisma.library.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    const downloads = await Promise.all(library.map(async (item) => {
        let title = 'Documento';
        let type = 'MATERIAL';
        let size = 'N/A';
        if (item.itemType === 'PAPER') {
            const paper = await prisma_1.prisma.paper.findUnique({
                where: { id: item.itemId },
                select: {
                    title: true,
                    pageCount: true,
                },
            });
            if (paper) {
                title = paper.title;
                type = 'PDF';
                size = paper.pageCount ? `${paper.pageCount} páginas` : 'N/A';
            }
        }
        else if (item.itemType === 'EBOOK') {
            const ebook = await prisma_1.prisma.ebook.findUnique({
                where: { id: item.itemId },
                select: {
                    title: true,
                    pageCount: true,
                },
            });
            if (ebook) {
                title = ebook.title;
                type = 'EBOOK';
                size = ebook.pageCount ? `${ebook.pageCount} páginas` : 'N/A';
            }
        }
        else if (item.itemType === 'COURSE_MATERIAL') {
            const course = await prisma_1.prisma.course.findUnique({
                where: { id: item.itemId },
                select: {
                    title: true,
                },
            });
            if (course) {
                title = course.title;
                type = 'MATERIAL';
                size = 'Material do Curso';
            }
        }
        return {
            id: item.id,
            title,
            type,
            size,
            downloadUrl: item.downloadUrl,
            downloadedAt: item.createdAt.toISOString(),
            expiresAt: item.expiresAt?.toISOString(),
        };
    }));
    return downloads;
}
async function getStudentCertificates(userId) {
    const certificates = await prisma_1.prisma.certificate.findMany({
        where: { userId },
        orderBy: { completionDate: 'desc' },
        include: {
            course: {
                select: {
                    title: true,
                    description: true,
                    instructorName: true,
                    duration: true,
                    thumbnailUrl: true,
                },
            },
        },
    });
    return certificates;
}
async function generateCertificateQRCode(certificateId) {
    const certificate = await prisma_1.prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            course: {
                select: {
                    title: true,
                    instructorName: true,
                },
            },
        },
    });
    if (!certificate) {
        throw new Error('Certificate not found');
    }
    const verificationUrl = `https://lneducacional.com.br/verify/certificate/${certificate.certificateNumber}`;
    const qrData = {
        url: verificationUrl,
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.user.name,
        courseTitle: certificate.course.title,
        completionDate: certificate.completionDate.toISOString(),
        grade: certificate.grade,
    };
    const qrCodeDataUrl = await qrcode_1.default.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
    await prisma_1.prisma.certificate.update({
        where: { id: certificateId },
        data: { qrCodeUrl: qrCodeDataUrl },
    });
    return qrCodeDataUrl;
}
async function completeCourse(userId, courseId, grade) {
    const existingCertificate = await prisma_1.prisma.certificate.findFirst({
        where: { userId, courseId },
    });
    if (existingCertificate) {
        throw new Error('Course already completed');
    }
    const course = await prisma_1.prisma.course.findUnique({
        where: { id: courseId },
    });
    if (!course) {
        throw new Error('Course not found');
    }
    const userHasCourse = await prisma_1.prisma.order.findFirst({
        where: {
            userId,
            status: 'COMPLETED',
            items: {
                some: { courseId },
            },
        },
    });
    if (!userHasCourse) {
        throw new Error('User not enrolled in this course');
    }
    const certificateNumber = `CERT-${Date.now()}-${userId.slice(-4).toUpperCase()}`;
    const certificate = await prisma_1.prisma.certificate.create({
        data: {
            userId,
            courseId,
            certificateNumber,
            grade,
            completionDate: new Date(),
            qrCodeUrl: '',
        },
        include: {
            course: true,
            user: true,
        },
    });
    await generateCertificateQRCode(certificate.id);
    return certificate;
}
async function getStudentProfile(userId) {
    const profile = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true,
            createdAt: true,
            _count: {
                select: {
                    orders: true,
                    certificates: true,
                    library: true,
                },
            },
        },
    });
    if (!profile) {
        throw new Error('User not found');
    }
    return {
        ...profile,
        stats: {
            totalOrders: profile._count.orders,
            totalCertificates: profile._count.certificates,
            totalLibraryItems: profile._count.library,
        },
    };
}
async function updateStudentProfile(userId, data) {
    const updateData = {};
    if (data.name) {
        updateData.name = data.name;
    }
    if (data.email) {
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser && existingUser.id !== userId) {
            throw new Error('Email already in use');
        }
        updateData.email = data.email;
        updateData.verified = false;
    }
    if (data.currentPassword && data.newPassword) {
        const { verifyPassword, hashPassword } = await Promise.resolve().then(() => __importStar(require('./auth')));
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await verifyPassword(user.password, data.currentPassword);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        updateData.password = await hashPassword(data.newPassword);
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true,
        },
    });
    return updatedUser;
}
async function verifyCertificate(certificateNumber) {
    const certificate = await prisma_1.prisma.certificate.findUnique({
        where: { certificateNumber },
        include: {
            user: {
                select: {
                    name: true,
                },
            },
            course: {
                select: {
                    title: true,
                    description: true,
                    instructorName: true,
                    duration: true,
                },
            },
        },
    });
    if (!certificate) {
        throw new Error('Certificate not found');
    }
    return {
        valid: true,
        certificate: {
            number: certificate.certificateNumber,
            studentName: certificate.user.name,
            courseTitle: certificate.course.title,
            courseDescription: certificate.course.description,
            instructorName: certificate.course.instructorName,
            courseDuration: certificate.course.duration,
            grade: certificate.grade,
            completionDate: certificate.completionDate,
            issuedAt: certificate.createdAt,
        },
    };
}
//# sourceMappingURL=student.js.map