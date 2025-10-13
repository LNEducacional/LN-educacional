import type { AcademicArea } from '@prisma/client';
import { z } from 'zod';

// Constants for validation
export const EBOOK_VALIDATION_CONSTANTS = {
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
} as const;

// Validation schema for ebook creation
export const createEbookValidationSchema = z.object({
  title: z
    .string()
    .min(
      EBOOK_VALIDATION_CONSTANTS.MIN_TITLE_LENGTH,
      `Title must be at least ${EBOOK_VALIDATION_CONSTANTS.MIN_TITLE_LENGTH} characters`
    )
    .max(
      EBOOK_VALIDATION_CONSTANTS.MAX_TITLE_LENGTH,
      `Title must be at most ${EBOOK_VALIDATION_CONSTANTS.MAX_TITLE_LENGTH} characters`
    )
    .trim(),
  description: z
    .string()
    .min(
      EBOOK_VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH,
      `Description must be at least ${EBOOK_VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH} characters`
    )
    .max(
      EBOOK_VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${EBOOK_VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .trim(),
  academicArea: z.string().min(1, 'Academic area is required'),
  authorName: z
    .string()
    .min(
      EBOOK_VALIDATION_CONSTANTS.MIN_AUTHOR_LENGTH,
      `Author name must be at least ${EBOOK_VALIDATION_CONSTANTS.MIN_AUTHOR_LENGTH} characters`
    )
    .max(
      EBOOK_VALIDATION_CONSTANTS.MAX_AUTHOR_LENGTH,
      `Author name must be at most ${EBOOK_VALIDATION_CONSTANTS.MAX_AUTHOR_LENGTH} characters`
    )
    .trim(),
  price: z
    .number()
    .min(
      EBOOK_VALIDATION_CONSTANTS.MIN_PRICE,
      `Price must be at least ${EBOOK_VALIDATION_CONSTANTS.MIN_PRICE}`
    )
    .max(
      EBOOK_VALIDATION_CONSTANTS.MAX_PRICE,
      `Price must be at most ${EBOOK_VALIDATION_CONSTANTS.MAX_PRICE}`
    )
    .int('Price must be an integer (in cents)'),
  pageCount: z
    .number()
    .min(
      EBOOK_VALIDATION_CONSTANTS.MIN_PAGE_COUNT,
      `Page count must be at least ${EBOOK_VALIDATION_CONSTANTS.MIN_PAGE_COUNT}`
    )
    .max(
      EBOOK_VALIDATION_CONSTANTS.MAX_PAGE_COUNT,
      `Page count must be at most ${EBOOK_VALIDATION_CONSTANTS.MAX_PAGE_COUNT}`
    )
    .int('Page count must be an integer'),
  fileUrl: z.string().min(1, 'File URL is required'),
  coverUrl: z.string().optional().or(z.literal('')),
});

// Validation schema for ebook update (all fields optional except id)
export const updateEbookValidationSchema = createEbookValidationSchema.partial();

// Business validation functions
export class EbookValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'EbookValidationError';
  }
}

/**
 * Validates file extension from URL or path
 */
export function validateFileExtension(fileUrl: string): void {
  const pathname = fileUrl.toLowerCase();
  const hasValidExtension = EBOOK_VALIDATION_CONSTANTS.ALLOWED_FILE_EXTENSIONS.some((ext) =>
    pathname.endsWith(ext)
  );

  if (!hasValidExtension) {
    throw new EbookValidationError(
      `File extension not allowed. Allowed extensions: ${EBOOK_VALIDATION_CONSTANTS.ALLOWED_FILE_EXTENSIONS.join(', ')}`,
      'fileUrl'
    );
  }
}

/**
 * Validates cover image extension from URL or path
 */
export function validateCoverImageExtension(coverUrl: string): void {
  if (!coverUrl) return; // Cover is optional

  const pathname = coverUrl.toLowerCase();
  const hasValidExtension = EBOOK_VALIDATION_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    pathname.endsWith(ext)
  );

  if (!hasValidExtension) {
    throw new EbookValidationError(
      `Cover image extension not allowed. Allowed extensions: ${EBOOK_VALIDATION_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
      'coverUrl'
    );
  }
}

/**
 * Validates that price and page count are consistent
 */
export function validatePricePageConsistency(price: number, pageCount: number): void {
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
export function validateEbookTitle(title: string): void {
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
export function validateAcademicArea(academicArea: string): void {
  const validAreas: AcademicArea[] = [
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

  if (!validAreas.includes(academicArea as AcademicArea)) {
    throw new EbookValidationError(
      `Invalid academic area. Valid areas: ${validAreas.join(', ')}`,
      'academicArea'
    );
  }
}

/**
 * Comprehensive validation function for ebook data
 */
export function validateEbookData(data: {
  title: string;
  description: string;
  academicArea: string;
  authorName: string;
  price: number;
  pageCount: number;
  fileUrl: string;
  coverUrl?: string;
}): void {
  // Schema validation first
  const result = createEbookValidationSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new EbookValidationError(firstError.message, firstError.path[0] as string);
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
export function sanitizeEbookData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as any;

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

  return sanitized as T;
}
