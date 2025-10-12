import { z } from 'zod';
export declare const EBOOK_VALIDATION_CONSTANTS: {
    readonly MAX_FILE_SIZE_MB: 50;
    readonly MIN_PAGE_COUNT: 1;
    readonly MAX_PAGE_COUNT: 2000;
    readonly MIN_PRICE: 0;
    readonly MAX_PRICE: 999999;
    readonly MIN_TITLE_LENGTH: 3;
    readonly MAX_TITLE_LENGTH: 200;
    readonly MIN_DESCRIPTION_LENGTH: 10;
    readonly MAX_DESCRIPTION_LENGTH: 5000;
    readonly MIN_AUTHOR_LENGTH: 2;
    readonly MAX_AUTHOR_LENGTH: 100;
    readonly ALLOWED_FILE_EXTENSIONS: readonly [".pdf", ".epub", ".mobi"];
    readonly ALLOWED_IMAGE_EXTENSIONS: readonly [".jpg", ".jpeg", ".png", ".webp"];
};
export declare const createEbookValidationSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    academicArea: z.ZodString;
    authorName: z.ZodString;
    price: z.ZodNumber;
    pageCount: z.ZodNumber;
    fileUrl: z.ZodString;
    coverUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    academicArea: string;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl?: string | undefined;
}, {
    title: string;
    description: string;
    academicArea: string;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl?: string | undefined;
}>;
export declare const updateEbookValidationSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    academicArea: z.ZodOptional<z.ZodString>;
    authorName: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    pageCount: z.ZodOptional<z.ZodNumber>;
    fileUrl: z.ZodOptional<z.ZodString>;
    coverUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    academicArea?: string | undefined;
    authorName?: string | undefined;
    price?: number | undefined;
    pageCount?: number | undefined;
    fileUrl?: string | undefined;
    coverUrl?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    academicArea?: string | undefined;
    authorName?: string | undefined;
    price?: number | undefined;
    pageCount?: number | undefined;
    fileUrl?: string | undefined;
    coverUrl?: string | undefined;
}>;
export declare class EbookValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
/**
 * Validates file extension from URL
 */
export declare function validateFileExtension(fileUrl: string): void;
/**
 * Validates cover image extension from URL
 */
export declare function validateCoverImageExtension(coverUrl: string): void;
/**
 * Validates that price and page count are consistent
 */
export declare function validatePricePageConsistency(price: number, pageCount: number): void;
/**
 * Validates ebook title for uniqueness and quality
 */
export declare function validateEbookTitle(title: string): void;
/**
 * Validates academic area enum value
 */
export declare function validateAcademicArea(academicArea: string): void;
/**
 * Comprehensive validation function for ebook data
 */
export declare function validateEbookData(data: {
    title: string;
    description: string;
    academicArea: string;
    authorName: string;
    price: number;
    pageCount: number;
    fileUrl: string;
    coverUrl?: string;
}): void;
/**
 * Sanitizes ebook data by trimming strings and normalizing values
 */
export declare function sanitizeEbookData<T extends Record<string, any>>(data: T): T;
//# sourceMappingURL=ebook.d.ts.map