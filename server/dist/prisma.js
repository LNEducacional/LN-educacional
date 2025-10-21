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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.getPapers = getPapers;
exports.getPaperById = getPaperById;
exports.createPaper = createPaper;
exports.updatePaper = updatePaper;
exports.deletePaper = deletePaper;
exports.addPaperToLibrary = addPaperToLibrary;
exports.trackDownload = trackDownload;
exports.getCourses = getCourses;
exports.getCourseById = getCourseById;
exports.createCourse = createCourse;
exports.updateCourse = updateCourse;
exports.deleteCourse = deleteCourse;
exports.getEbooks = getEbooks;
exports.getEbookById = getEbookById;
exports.createEbook = createEbook;
exports.updateEbook = updateEbook;
exports.deleteEbook = deleteEbook;
exports.getEbooksByUserId = getEbooksByUserId;
exports.hasUserPurchasedEbook = hasUserPurchasedEbook;
exports.addEbookToLibrary = addEbookToLibrary;
exports.searchProducts = searchProducts;
exports.createOrder = createOrder;
exports.getOrderById = getOrderById;
exports.getOrdersByUserId = getOrdersByUserId;
exports.getAllOrders = getAllOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.updateOrderPaymentStatus = updateOrderPaymentStatus;
exports.generatePixCode = generatePixCode;
exports.generateBoletoUrl = generateBoletoUrl;
exports.processPaymentWebhook = processPaymentWebhook;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
async function getPapers(filters) {
    console.log('\n🔍 [getPapers] START - Received filters:', JSON.stringify(filters, null, 2));
    const where = {};
    if (filters.type) {
        where.paperType = filters.type;
        console.log('📝 [getPapers] Filter: paperType =', filters.type);
    }
    if (filters.area) {
        where.academicArea = filters.area;
        console.log('📝 [getPapers] Filter: academicArea =', filters.area);
    }
    if (filters.free !== undefined) {
        where.isFree = filters.free;
        console.log('📝 [getPapers] Filter: isFree =', filters.free);
    }
    if (filters.maxPrice) {
        where.price = { lte: filters.maxPrice };
        console.log('📝 [getPapers] Filter: price <= ', filters.maxPrice);
    }
    if (filters.maxPages) {
        where.pageCount = { lte: filters.maxPages };
        console.log('📝 [getPapers] Filter: pageCount <=', filters.maxPages);
    }
    console.log('🎯 [getPapers] Final WHERE clause:', JSON.stringify(where, null, 2));
    console.log('📊 [getPapers] Query params: skip =', filters.skip || 0, ', take =', filters.take || 20);
    const [papers, total] = await Promise.all([
        exports.prisma.paper.findMany({
            where,
            skip: filters.skip || 0,
            take: filters.take || 20,
            orderBy: { createdAt: 'desc' },
        }),
        exports.prisma.paper.count({ where }),
    ]);
    console.log('✅ [getPapers] Query completed!');
    console.log('📈 [getPapers] Total count:', total);
    console.log('📦 [getPapers] Papers returned:', papers.length);
    if (papers.length > 0) {
        console.log('📄 [getPapers] First paper:', {
            id: papers[0].id,
            title: papers[0].title,
            isFree: papers[0].isFree,
            price: papers[0].price
        });
    }
    else {
        console.log('⚠️  [getPapers] NO PAPERS FOUND!');
    }
    console.log('✅ [getPapers] END\n');
    return { papers, total };
}
async function getPaperById(id) {
    return exports.prisma.paper.findUnique({
        where: { id },
    });
}
async function createPaper(data) {
    return exports.prisma.paper.create({
        data: {
            ...data,
            paperType: data.paperType,
            academicArea: data.academicArea,
        },
    });
}
async function updatePaper(id, data) {
    const updateData = {};
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'paperType' && value) {
            updateData.paperType = value;
        }
        else if (key === 'academicArea' && value) {
            updateData.academicArea = value;
        }
        else if (value !== undefined) {
            updateData[key] = value;
        }
    });
    return exports.prisma.paper.update({
        where: { id },
        data: updateData,
    });
}
async function deletePaper(id) {
    return exports.prisma.paper.delete({
        where: { id },
    });
}
async function addPaperToLibrary(userId, paperId) {
    // Verificar se já existe
    const existing = await exports.prisma.library.findFirst({
        where: {
            userId,
            itemId: paperId,
            itemType: 'PAPER',
        },
    });
    if (existing) {
        return existing;
    }
    // Adicionar à biblioteca
    return exports.prisma.library.create({
        data: {
            userId,
            itemType: 'PAPER',
            itemId: paperId,
            downloadUrl: `https://download.lneducacional.com.br/papers/${paperId}`,
            expiresAt: null, // Papers gratuitos não expiram
        },
    });
}
async function trackDownload(userId, itemId, itemType) {
    return exports.prisma.downloadTracking.create({
        data: {
            userId,
            itemId,
            itemType,
        },
    });
}
async function getCourses(filters) {
    const where = {};
    if (filters.area)
        where.academicArea = filters.area;
    if (filters.status)
        where.status = filters.status;
    if (filters.featured !== undefined)
        where.isFeatured = filters.featured;
    const [courses, total] = await Promise.all([
        exports.prisma.course.findMany({
            where,
            skip: filters.skip || 0,
            take: filters.take || 20,
            orderBy: { createdAt: 'desc' },
        }),
        exports.prisma.course.count({ where }),
    ]);
    return { courses, total };
}
async function getCourseById(id) {
    return exports.prisma.course.findUnique({
        where: { id },
    });
}
async function createCourse(data) {
    return exports.prisma.course.create({
        data: {
            ...data,
            academicArea: data.academicArea.toUpperCase(),
            status: (data.status?.toUpperCase() || 'ACTIVE'),
            isFeatured: data.isFeatured !== undefined ? data.isFeatured : true,
        },
    });
}
async function updateCourse(id, data) {
    const updateData = {};
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'academicArea' && value) {
            updateData.academicArea = value.toUpperCase();
        }
        else if (key === 'status' && value) {
            updateData.status = value.toUpperCase();
        }
        else if (value !== undefined) {
            updateData[key] = value;
        }
    });
    return exports.prisma.course.update({
        where: { id },
        data: updateData,
    });
}
async function deleteCourse(id) {
    // Delete all related records in a transaction
    return exports.prisma.$transaction(async (tx) => {
        // Delete enrollments
        await tx.courseEnrollment.deleteMany({
            where: { courseId: id },
        });
        // Delete certificates
        await tx.certificate.deleteMany({
            where: { courseId: id },
        });
        // Delete order items
        await tx.orderItem.deleteMany({
            where: { courseId: id },
        });
        // Delete course progress for all lessons in this course's modules
        const modules = await tx.courseModule.findMany({
            where: { courseId: id },
            select: {
                lessons: {
                    select: { id: true },
                },
            },
        });
        const lessonIds = modules.flatMap(m => m.lessons.map(l => l.id));
        if (lessonIds.length > 0) {
            await tx.courseProgress.deleteMany({
                where: { lessonId: { in: lessonIds } },
            });
        }
        // Delete modules (and their lessons will be deleted via cascade)
        await tx.courseModule.deleteMany({
            where: { courseId: id },
        });
        // Finally, delete the course
        return tx.course.delete({
            where: { id },
        });
    });
}
async function getEbooks(filters) {
    const where = {};
    if (filters.area)
        where.academicArea = filters.area;
    const [ebooks, total] = await Promise.all([
        exports.prisma.ebook.findMany({
            where,
            skip: filters.skip || 0,
            take: filters.take || 20,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                academicArea: true,
                authorName: true,
                price: true,
                pageCount: true,
                coverUrl: true,
                createdAt: true,
                // Excluir fileUrl da listagem pública por segurança
            },
        }),
        exports.prisma.ebook.count({ where }),
    ]);
    return { ebooks, total };
}
async function getEbookById(id) {
    return exports.prisma.ebook.findUnique({
        where: { id },
    });
}
async function createEbook(data) {
    const { validateEbookData, sanitizeEbookData, EbookValidationError } = await Promise.resolve().then(() => __importStar(require('./validations/ebook')));
    // Sanitize input data
    const sanitizedData = sanitizeEbookData(data);
    // Validate business rules
    validateEbookData(sanitizedData);
    // Check for duplicate title (case-insensitive)
    const existingEbook = await exports.prisma.ebook.findFirst({
        where: {
            title: {
                equals: sanitizedData.title,
                mode: 'insensitive',
            },
        },
    });
    if (existingEbook) {
        throw new EbookValidationError('An ebook with this title already exists', 'title');
    }
    // Check for duplicate file URL
    const existingFileUrl = await exports.prisma.ebook.findFirst({
        where: {
            fileUrl: sanitizedData.fileUrl,
        },
    });
    if (existingFileUrl) {
        throw new EbookValidationError('An ebook with this file URL already exists', 'fileUrl');
    }
    return exports.prisma.ebook.create({
        data: {
            ...sanitizedData,
            academicArea: sanitizedData.academicArea,
        },
    });
}
async function updateEbook(id, data) {
    const { updateEbookValidationSchema, sanitizeEbookData, EbookValidationError } = await Promise.resolve().then(() => __importStar(require('./validations/ebook')));
    // Verify ebook exists
    const existingEbook = await exports.prisma.ebook.findUnique({
        where: { id },
    });
    if (!existingEbook) {
        throw new EbookValidationError('Ebook not found', 'id');
    }
    // Sanitize input data
    const sanitizedData = sanitizeEbookData(data);
    // Validate schema
    const result = updateEbookValidationSchema.safeParse(sanitizedData);
    if (!result.success) {
        const firstError = result.error.errors[0];
        throw new EbookValidationError(firstError.message, firstError.path[0]);
    }
    // Check for duplicate title (case-insensitive) - only if title is being updated
    if (sanitizedData.title && sanitizedData.title !== existingEbook.title) {
        const duplicateTitle = await exports.prisma.ebook.findFirst({
            where: {
                id: { not: id },
                title: {
                    equals: sanitizedData.title,
                    mode: 'insensitive',
                },
            },
        });
        if (duplicateTitle) {
            throw new EbookValidationError('An ebook with this title already exists', 'title');
        }
    }
    // Check for duplicate file URL - only if fileUrl is being updated
    if (sanitizedData.fileUrl && sanitizedData.fileUrl !== existingEbook.fileUrl) {
        const duplicateFileUrl = await exports.prisma.ebook.findFirst({
            where: {
                id: { not: id },
                fileUrl: sanitizedData.fileUrl,
            },
        });
        if (duplicateFileUrl) {
            throw new EbookValidationError('An ebook with this file URL already exists', 'fileUrl');
        }
    }
    // Apply business validations if relevant fields are being updated
    if (sanitizedData.title ||
        sanitizedData.description ||
        sanitizedData.academicArea ||
        sanitizedData.authorName ||
        sanitizedData.price !== undefined ||
        sanitizedData.pageCount !== undefined ||
        sanitizedData.fileUrl ||
        sanitizedData.coverUrl) {
        // Merge with existing data for complete validation
        const completeData = {
            title: sanitizedData.title ?? existingEbook.title,
            description: sanitizedData.description ?? existingEbook.description,
            academicArea: sanitizedData.academicArea ?? existingEbook.academicArea,
            authorName: sanitizedData.authorName ?? existingEbook.authorName,
            price: sanitizedData.price ?? existingEbook.price,
            pageCount: sanitizedData.pageCount ?? existingEbook.pageCount,
            fileUrl: sanitizedData.fileUrl ?? existingEbook.fileUrl,
            coverUrl: sanitizedData.coverUrl ?? existingEbook.coverUrl ?? undefined,
        };
        const { validateEbookData } = await Promise.resolve().then(() => __importStar(require('./validations/ebook')));
        validateEbookData(completeData);
    }
    const updateData = {};
    Object.entries(sanitizedData).forEach(([key, value]) => {
        if (key === 'academicArea' && value) {
            updateData.academicArea = value;
        }
        else if (value !== undefined) {
            updateData[key] = value;
        }
    });
    return exports.prisma.ebook.update({
        where: { id },
        data: updateData,
    });
}
async function deleteEbook(id) {
    return exports.prisma.ebook.delete({
        where: { id },
    });
}
async function getEbooksByUserId(userId) {
    const orderItems = await exports.prisma.orderItem.findMany({
        where: {
            order: {
                userId,
                status: 'COMPLETED',
                paymentStatus: 'CONFIRMED',
            },
            ebookId: { not: null },
        },
        select: {
            ebook: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    academicArea: true,
                    authorName: true,
                    price: true,
                    pageCount: true,
                    coverUrl: true,
                    createdAt: true,
                    // Incluir fileUrl para usuários que compraram
                    fileUrl: true,
                },
            },
        },
    });
    return orderItems.map((item) => item.ebook).filter(Boolean);
}
async function hasUserPurchasedEbook(userId, ebookId) {
    // First check if it's a free ebook
    const ebook = await exports.prisma.ebook.findUnique({
        where: { id: ebookId },
        select: { price: true },
    });
    if (!ebook)
        return false;
    if (ebook.price === 0)
        return true; // Free ebooks are always accessible
    // Check if user has a confirmed purchase
    const purchase = await exports.prisma.orderItem.findFirst({
        where: {
            ebookId,
            order: {
                userId,
                status: 'COMPLETED',
                paymentStatus: 'CONFIRMED',
            },
        },
        select: {
            id: true, // Apenas o ID é suficiente para verificar existência
        },
    });
    return !!purchase;
}
async function addEbookToLibrary(userId, ebookId) {
    // Check if ebook already exists in user's library
    const existingItem = await exports.prisma.library.findFirst({
        where: {
            userId,
            itemType: 'EBOOK',
            itemId: ebookId,
        },
    });
    if (existingItem) {
        return existingItem; // Already in library
    }
    // Get ebook to generate download URL
    const ebook = await exports.prisma.ebook.findUnique({
        where: { id: ebookId },
    });
    if (!ebook) {
        throw new Error('Ebook not found');
    }
    // Add to library
    return exports.prisma.library.create({
        data: {
            userId,
            itemType: 'EBOOK',
            itemId: ebookId,
            downloadUrl: ebook.fileUrl,
            // Free ebooks don't expire, paid ones expire after 1 year
            expiresAt: ebook.price === 0 ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
    });
}
async function searchProducts(query, type) {
    const searchCondition = {
        OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
        ],
    };
    const results = {};
    if (!type || type === 'paper') {
        results.papers = await exports.prisma.paper.findMany({
            where: searchCondition,
            take: 10,
        });
    }
    if (!type || type === 'course') {
        results.courses = await exports.prisma.course.findMany({
            where: searchCondition,
            take: 10,
        });
    }
    if (!type || type === 'ebook') {
        results.ebooks = await exports.prisma.ebook.findMany({
            where: searchCondition,
            take: 10,
        });
    }
    return results;
}
async function createOrder(data) {
    return exports.prisma.order.create({
        data: {
            userId: data.userId,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerCpfCnpj: data.customerCpfCnpj,
            customerPhone: data.customerPhone,
            items: {
                create: data.items.map((item) => ({
                    title: item.title,
                    description: item.description,
                    price: item.price,
                    paperId: item.paperId,
                    courseId: item.courseId,
                    ebookId: item.ebookId,
                })),
            },
        },
        include: {
            items: {
                include: {
                    paper: true,
                    course: true,
                    ebook: true,
                },
            },
        },
    });
}
async function getOrderById(id) {
    return exports.prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    paper: true,
                    course: true,
                    ebook: true,
                },
            },
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });
}
async function getOrdersByUserId(userId, filters) {
    const where = { userId };
    if (filters?.status)
        where.status = filters.status;
    const [orders, total] = await Promise.all([
        exports.prisma.order.findMany({
            where,
            skip: filters?.skip || 0,
            take: filters?.take || 20,
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
            },
        }),
        exports.prisma.order.count({ where }),
    ]);
    return { orders, total };
}
async function getAllOrders(filters) {
    const where = {};
    if (filters?.status)
        where.status = filters.status;
    if (filters?.paymentStatus)
        where.paymentStatus = filters.paymentStatus;
    const [orders, total] = await Promise.all([
        exports.prisma.order.findMany({
            where,
            skip: filters?.skip || 0,
            take: filters?.take || 20,
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        }),
        exports.prisma.order.count({ where }),
    ]);
    return { orders, total };
}
async function updateOrderStatus(id, status) {
    return exports.prisma.order.update({
        where: { id },
        data: {
            status: status,
            updatedAt: new Date(),
        },
    });
}
async function updateOrderPaymentStatus(id, paymentStatus, paymentData) {
    return exports.prisma.order.update({
        where: { id },
        data: {
            paymentStatus: paymentStatus,
            pixCode: paymentData?.pixCode,
            boletoUrl: paymentData?.boletoUrl,
            updatedAt: new Date(),
        },
    });
}
async function generatePixCode(orderId) {
    const order = await getOrderById(orderId);
    if (!order)
        throw new Error('Order not found');
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${orderId}52040000530398654${(order.totalAmount / 100).toFixed(2).padStart(10, '0')}5802BR5913LN_EDUCACIONAL6009SAO_PAULO62070503***6304`;
    await updateOrderPaymentStatus(orderId, 'PENDING', { pixCode });
    return pixCode;
}
async function generateBoletoUrl(orderId) {
    const order = await getOrderById(orderId);
    if (!order)
        throw new Error('Order not found');
    const boletoUrl = `https://boleto.lneducacional.com.br/${orderId}`;
    await updateOrderPaymentStatus(orderId, 'PENDING', { boletoUrl });
    return boletoUrl;
}
async function processPaymentWebhook(data) {
    const order = await getOrderById(data.orderId);
    if (!order)
        throw new Error('Order not found');
    if (data.status === 'paid') {
        const libraryItems = order.items
            .map((item) => {
            const itemId = item.paperId || item.ebookId || item.courseId;
            if (itemId && order.userId) {
                return exports.prisma.library.create({
                    data: {
                        userId: order.userId,
                        itemType: item.paperId ? 'PAPER' : item.ebookId ? 'EBOOK' : 'COURSE_MATERIAL',
                        itemId,
                        downloadUrl: `https://download.lneducacional.com.br/${itemId}`,
                    },
                });
            }
            return null;
        })
            .filter(Boolean);
        await exports.prisma.$transaction([
            exports.prisma.order.update({
                where: { id: data.orderId },
                data: {
                    paymentStatus: 'PAID',
                    status: 'PROCESSING',
                    updatedAt: new Date(),
                },
            }),
            ...libraryItems.filter(Boolean),
        ]);
        await exports.prisma.order.update({
            where: { id: data.orderId },
            data: {
                status: 'COMPLETED',
                paymentStatus: 'CONFIRMED',
            },
        });
    }
    else if (data.status === 'failed') {
        await updateOrderPaymentStatus(data.orderId, 'FAILED');
        await updateOrderStatus(data.orderId, 'CANCELED');
    }
    else if (data.status === 'canceled') {
        await updateOrderPaymentStatus(data.orderId, 'CANCELED');
        await updateOrderStatus(data.orderId, 'CANCELED');
    }
    return order;
}
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map