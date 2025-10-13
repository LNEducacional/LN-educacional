"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbookValidationError = exports.updateEbookValidationSchema = exports.createEbookValidationSchema = exports.EBOOK_VALIDATION_CONSTANTS = void 0;
exports.validateFileExtension = validateFileExtension;
exports.validateCoverImageExtension = validateCoverImageExtension;
exports.validatePricePageConsistency = validatePricePageConsistency;
exports.validateEbookTitle = validateEbookTitle;
exports.validateAcademicArea = validateAcademicArea;
exports.validateEbookData = validateEbookData;
exports.sanitizeEbookData = sanitizeEbookData;
const zod_1 = require("zod");
// Constants for validation
exports.EBOOK_VALIDATION_CONSTANTS = {
    MAX_FILE_SIZE_MB: 50, // 50MB max file size
    MIN_PAGE_COUNT: 1,
    MAX_PAGE_COUNT: 2000,
    MIN_PRICE: 0,
    MAX_PRICE: 999999, // R$ 9.999,99
    MIN_TITLE_LENGTH: 3,
    MAX_TITLE_LENGTH: 200,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 5000,
    MIN_AUTHOR_LENGTH: 2,
    MAX_AUTHOR_LENGTH: 100,
    ALLOWED_FILE_EXTENSIONS: ['.pdf', '.epub', '.mobi'],
    ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};
// Validation schema for ebook creation
exports.createEbookValidationSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(exports.EBOOK_VALIDATION_CONSTANTS.MIN_TITLE_LENGTH, `Title must be at least ${exports.EBOOK_VALIDATION_CONSTANTS.MIN_TITLE_LENGTH} characters`)
        .max(exports.EBOOK_VALIDATION_CONSTANTS.MAX_TITLE_LENGTH, `Title must be at most ${exports.EBOOK_VALIDATION_CONSTANTS.MAX_TITLE_LENGTH} characters`)
        .trim(),
    description: zod_1.z
        .string()
        .min(exports.EBOOK_VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH, `Description must be at least ${exports.EBOOK_VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH} characters`)
        .max(exports.EBOOK_VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH, `Description must be at most ${exports.EBOOK_VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`)
        .trim(),
    academicArea: zod_1.z.string().min(1, 'Academic area is required'),
    authorName: zod_1.z
        .string()
        .min(exports.EBOOK_VALIDATION_CONSTANTS.MIN_AUTHOR_LENGTH, `Author name must be at least ${exports.EBOOK_VALIDATION_CONSTANTS.MIN_AUTHOR_LENGTH} characters`)
        .max(exports.EBOOK_VALIDATION_CONSTANTS.MAX_AUTHOR_LENGTH, `Author name must be at most ${exports.EBOOK_VALIDATION_CONSTANTS.MAX_AUTHOR_LENGTH} characters`)
        .trim(),
    price: zod_1.z
        .number()
        .min(exports.EBOOK_VALIDATION_CONSTANTS.MIN_PRICE, `Price must be at least ${exports.EBOOK_VALIDATION_CONSTANTS.MIN_PRICE}`)
        .max(exports.EBOOK_VALIDATION_CONSTANTS.MAX_PRICE, `Price must be at most ${exports.EBOOK_VALIDATION_CONSTANTS.MAX_PRICE}`)
        .int('Price must be an integer (in cents)'),
    pageCount: zod_1.z
        .number()
        .min(exports.EBOOK_VALIDATION_CONSTANTS.MIN_PAGE_COUNT, `Page count must be at least ${exports.EBOOK_VALIDATION_CONSTANTS.MIN_PAGE_COUNT}`)
        .max(exports.EBOOK_VALIDATION_CONSTANTS.MAX_PAGE_COUNT, `Page count must be at most ${exports.EBOOK_VALIDATION_CONSTANTS.MAX_PAGE_COUNT}`)
        .int('Page count must be an integer'),
    fileUrl: zod_1.z.string().min(1, 'File URL is required'),
    coverUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
// Validation schema for ebook update (all fields optional except id)
exports.updateEbookValidationSchema = exports.createEbookValidationSchema.partial();
// Business validation functions
class EbookValidationError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'EbookValidationError';
    }
}
exports.EbookValidationError = EbookValidationError;
/**
 * Validates file extension from URL or path
 */
function validateFileExtension(fileUrl) {
    const pathname = fileUrl.toLowerCase();
    const hasValidExtension = exports.EBOOK_VALIDATION_CONSTANTS.ALLOWED_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    if (!hasValidExtension) {
        throw new EbookValidationError(`File extension not allowed. Allowed extensions: ${exports.EBOOK_VALIDATION_CONSTANTS.ALLOWED_FILE_EXTENSIONS.join(', ')}`, 'fileUrl');
    }
}
/**
 * Validates cover image extension from URL or path
 */
function validateCoverImageExtension(coverUrl) {
    if (!coverUrl)
        return; // Cover is optional
    const pathname = coverUrl.toLowerCase();
    const hasValidExtension = exports.EBOOK_VALIDATION_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    if (!hasValidExtension) {
        throw new EbookValidationError(`Cover image extension not allowed. Allowed extensions: ${exports.EBOOK_VALIDATION_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.join(', ')}`, 'coverUrl');
    }
}
/**
 * Validates that price and page count are consistent
 */
function validatePricePageConsistency(price, pageCount) {
    // Free ebooks should have reasonable page counts
    if (price === 0 && pageCount > 100) {
        throw new EbookValidationError('Free ebooks should not exceed 100 pages', 'pageCount');
    }
    // Premium ebooks should have substantial content
    if (price > 0 && pageCount < 10) {
        throw new EbookValidationError('Paid ebooks should have at least 10 pages', 'pageCount');
    }
}
/**
 * Validates ebook title for uniqueness and quality
 */
function validateEbookTitle(title) {
    // Check for common spam patterns
    const spamPatterns = [
        /^\s*test\s*$/i,
        /^\s*sample\s*$/i,
        /^\s*example\s*$/i,
        /^(.)\1{4,}/, // Repeated characters (aaaaa)
    ];
    for (const pattern of spamPatterns) {
        if (pattern.test(title)) {
            throw new EbookValidationError('Title appears to be a test or spam entry', 'title');
        }
    }
    // Check for minimum meaningful content
    const words = title.trim().split(/\s+/);
    if (words.length < 2) {
        throw new EbookValidationError('Title should contain at least 2 words', 'title');
    }
}
/**
 * Validates academic area enum value
 */
function validateAcademicArea(academicArea) {
    const validAreas = [
        'EXACT_SCIENCES',
        'HUMANITIES',
        'BIOLOGICAL_SCIENCES',
        'ENGINEERING',
        'APPLIED_SOCIAL_SCIENCES',
        'LANGUAGES',
        'AGRICULTURAL_SCIENCES',
        'HEALTH_SCIENCES',
        'MULTIDISCIPLINARY',
    ];
    if (!validAreas.includes(academicArea)) {
        throw new EbookValidationError(`Invalid academic area. Valid areas: ${validAreas.join(', ')}`, 'academicArea');
    }
}
/**
 * Comprehensive validation function for ebook data
 */
function validateEbookData(data) {
    // Schema validation first
    const result = exports.createEbookValidationSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        throw new EbookValidationError(firstError.message, firstError.path[0]);
    }
    // Business logic validations
    validateEbookTitle(data.title);
    validateAcademicArea(data.academicArea);
    validateFileExtension(data.fileUrl);
    if (data.coverUrl) {
        validateCoverImageExtension(data.coverUrl);
    }
    validatePricePageConsistency(data.price, data.pageCount);
}
/**
 * Sanitizes ebook data by trimming strings and normalizing values
 */
function sanitizeEbookData(data) {
    const sanitized = { ...data };
    // Trim string values
    for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string') {
            sanitized[key] = value.trim();
        }
    }
    // Normalize academic area
    if ('academicArea' in sanitized && sanitized.academicArea) {
        sanitized.academicArea = sanitized.academicArea.toUpperCase().replace(/-/g, '_');
    }
    return sanitized;
}
//# sourceMappingURL=ebook.js.map