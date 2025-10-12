import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from '../src/app';

let app: FastifyInstance;
let adminToken: string;
let studentToken: string;
const ebookIds: string[] = [];

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';

  app = build({ logger: false });
  await app.ready();

  // Create admin user for testing
  const timestamp = Date.now();
  const adminResponse = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: `admin_ebook${timestamp}@test.com`,
      password: 'adminpass123',
      name: 'Admin Ebook Test',
    },
  });

  const adminCookies = adminResponse.cookies;
  adminToken = adminCookies.find((c) => c.name === 'token')?.value || '';

  // Update user to admin role
  const { prisma } = await import('../src/prisma');
  const adminUser = await prisma.user.update({
    where: { email: `admin_ebook${timestamp}@test.com` },
    data: { role: 'ADMIN' },
  });

  // Generate new token with admin role
  const { generateTokens } = await import('../src/auth');
  const newTokens = await generateTokens(adminUser);
  adminToken = newTokens.accessToken;

  // Create student user for testing
  const studentResponse = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: `student_ebook${timestamp}@test.com`,
      password: 'studentpass123',
      name: 'Student Ebook Test',
    },
  });

  const studentCookies = studentResponse.cookies;
  studentToken = studentCookies.find((c) => c.name === 'token')?.value || '';
});

afterAll(async () => {
  // Clean up test data
  const validEbookIds = ebookIds.filter((id) => id !== undefined);
  if (validEbookIds.length > 0) {
    const { prisma } = await import('../src/prisma');
    await prisma.ebook.deleteMany({
      where: { id: { in: validEbookIds } },
    });
  }

  if (app) {
    await app.close();
  }
});

describe('Ebook Integration Tests', () => {
  describe('Admin Ebook Management', () => {
    it('should create a new ebook with validation', async () => {
      const ebookData = {
        title: 'Test Ebook: Introduction to Programming',
        description: 'This is a comprehensive guide to programming fundamentals for beginners.',
        academicArea: 'CIENCIAS_EXATAS',
        authorName: 'John Doe',
        price: 2990, // R$ 29.90 in cents
        pageCount: 150,
        fileUrl: 'https://example.com/ebooks/intro-programming.pdf',
        coverUrl: 'https://example.com/covers/intro-programming.jpg',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: ebookData,
      });

      expect(response.statusCode).toBe(201);
      const ebook = JSON.parse(response.body);
      expect(ebook.title).toBe(ebookData.title);
      expect(ebook.price).toBe(ebookData.price);
      expect(ebook.academicArea).toBe(ebookData.academicArea);
      ebookIds.push(ebook.id);
    });

    it('should reject ebook creation with invalid data', async () => {
      const invalidEbookData = {
        title: 'Te', // Too short
        description: 'Short', // Too short
        academicArea: 'INVALID_AREA',
        authorName: 'A', // Too short
        price: -100, // Negative price
        pageCount: 0, // Invalid page count
        fileUrl: 'not-a-url',
        coverUrl: 'also-not-a-url',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: invalidEbookData,
      });

      expect(response.statusCode).toBe(422);
      const error = JSON.parse(response.body);
      expect(error.type).toBe('validation_error');
      expect(error.field).toBeDefined();
    });

    it('should reject duplicate ebook titles', async () => {
      const ebookData = {
        title: 'Duplicate Title Test Book',
        description: 'This is a test ebook to check duplicate titles.',
        academicArea: 'CIENCIAS_HUMANAS',
        authorName: 'Jane Smith',
        price: 1990,
        pageCount: 100,
        fileUrl: 'https://example.com/ebooks/duplicate-test-1.pdf',
      };

      // Create first ebook
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: ebookData,
      });

      expect(firstResponse.statusCode).toBe(201);
      const firstEbook = JSON.parse(firstResponse.body);
      ebookIds.push(firstEbook.id);

      // Try to create second ebook with same title
      const duplicateData = {
        ...ebookData,
        fileUrl: 'https://example.com/ebooks/duplicate-test-2.pdf',
      };

      const secondResponse = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: duplicateData,
      });

      expect(secondResponse.statusCode).toBe(422);
      const error = JSON.parse(secondResponse.body);
      expect(error.field).toBe('title');
      expect(error.error).toContain('already exists');
    });

    it('should update ebook with valid data', async () => {
      // First create an ebook
      const ebookData = {
        title: 'Updateable Ebook Test',
        description: 'This ebook will be updated during the test.',
        academicArea: 'ENGENHARIAS',
        authorName: 'Test Author',
        price: 3490,
        pageCount: 200,
        fileUrl: 'https://example.com/ebooks/updateable.pdf',
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: ebookData,
      });

      const ebook = JSON.parse(createResponse.body);
      ebookIds.push(ebook.id);

      // Update the ebook
      const updateData = {
        title: 'Updated Ebook Title',
        price: 4990,
        pageCount: 250,
      };

      const updateResponse = await app.inject({
        method: 'PUT',
        url: `/admin/ebooks/${ebook.id}`,
        cookies: {
          token: adminToken,
        },
        payload: updateData,
      });

      expect(updateResponse.statusCode).toBe(200);
      const updatedEbook = JSON.parse(updateResponse.body);
      expect(updatedEbook.title).toBe(updateData.title);
      expect(updatedEbook.price).toBe(updateData.price);
      expect(updatedEbook.pageCount).toBe(updateData.pageCount);
    });

    it('should reject free ebooks with too many pages', async () => {
      const freeEbookData = {
        title: 'Free Ebook With Too Many Pages',
        description: 'This free ebook has too many pages and should be rejected.',
        academicArea: 'CIENCIAS_BIOLOGICAS',
        authorName: 'Free Author',
        price: 0, // Free
        pageCount: 150, // Too many pages for free ebook
        fileUrl: 'https://example.com/ebooks/free-too-long.pdf',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: freeEbookData,
      });

      expect(response.statusCode).toBe(422);
      const error = JSON.parse(response.body);
      expect(error.field).toBe('pageCount');
      expect(error.error).toContain('Free ebooks should not exceed 100 pages');
    });

    it('should reject paid ebooks with too few pages', async () => {
      const paidEbookData = {
        title: 'Paid Ebook With Too Few Pages',
        description: 'This paid ebook has too few pages and should be rejected.',
        academicArea: 'CIENCIAS_AGRARIAS',
        authorName: 'Paid Author',
        price: 1990, // Paid
        pageCount: 5, // Too few pages for paid ebook
        fileUrl: 'https://example.com/ebooks/paid-too-short.pdf',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: paidEbookData,
      });

      expect(response.statusCode).toBe(422);
      const error = JSON.parse(response.body);
      expect(error.field).toBe('pageCount');
      expect(error.error).toContain('Paid ebooks should have at least 10 pages');
    });

    it('should delete ebook successfully', async () => {
      // First create an ebook
      const ebookData = {
        title: 'Deletable Ebook Test',
        description: 'This ebook will be deleted during the test.',
        academicArea: 'MULTIDISCIPLINAR',
        authorName: 'Delete Author',
        price: 2490,
        pageCount: 120,
        fileUrl: 'https://example.com/ebooks/deletable.pdf',
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: ebookData,
      });

      const ebook = JSON.parse(createResponse.body);

      // Delete the ebook
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/admin/ebooks/${ebook.id}`,
        cookies: {
          token: adminToken,
        },
      });

      expect(deleteResponse.statusCode).toBe(200);
      const result = JSON.parse(deleteResponse.body);
      expect(result.success).toBe(true);
    });
  });

  describe('Public Ebook Access', () => {
    let testEbookId: string;

    beforeAll(async () => {
      // Create a test ebook for public access tests
      const ebookData = {
        title: 'Public Access Test Ebook',
        description: 'This ebook is used for testing public access endpoints.',
        academicArea: 'CIENCIAS_DA_SAUDE',
        authorName: 'Public Author',
        price: 1990,
        pageCount: 80,
        fileUrl: 'https://example.com/ebooks/public-test.pdf',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: ebookData,
      });

      const ebook = JSON.parse(response.body);
      testEbookId = ebook.id;
      ebookIds.push(ebook.id);
    });

    it('should list ebooks publicly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ebooks',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.ebooks).toBeDefined();
      expect(Array.isArray(result.ebooks)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter ebooks by academic area', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ebooks?area=CIENCIAS_DA_SAUDE',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.ebooks).toBeDefined();
      expect(Array.isArray(result.ebooks)).toBe(true);
    });

    it('should get specific ebook by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/ebooks/${testEbookId}`,
      });

      expect(response.statusCode).toBe(200);
      const ebook = JSON.parse(response.body);
      expect(ebook.id).toBe(testEbookId);
      expect(ebook.title).toBe('Public Access Test Ebook');
    });

    it('should return 404 for non-existent ebook', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ebooks/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body);
      expect(error.error).toBe('Ebook not found');
    });
  });

  describe('Ebook Download and Purchase', () => {
    let freeEbookId: string;
    let paidEbookId: string;

    beforeAll(async () => {
      // Create a free ebook
      const freeEbookData = {
        title: 'Free Download Test Ebook',
        description: 'This is a free ebook for download testing.',
        academicArea: 'LINGUISTICA_LETRAS_ARTES',
        authorName: 'Free Download Author',
        price: 0, // Free
        pageCount: 50,
        fileUrl: 'https://example.com/ebooks/free-download.pdf',
      };

      const freeResponse = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: freeEbookData,
      });

      const freeEbook = JSON.parse(freeResponse.body);
      freeEbookId = freeEbook.id;
      ebookIds.push(freeEbook.id);

      // Create a paid ebook
      const paidEbookData = {
        title: 'Paid Download Test Ebook',
        description: 'This is a paid ebook for download testing.',
        academicArea: 'CIENCIAS_SOCIAIS_APLICADAS',
        authorName: 'Paid Download Author',
        price: 2990, // Paid
        pageCount: 120,
        fileUrl: 'https://example.com/ebooks/paid-download.pdf',
      };

      const paidResponse = await app.inject({
        method: 'POST',
        url: '/admin/ebooks',
        cookies: {
          token: adminToken,
        },
        payload: paidEbookData,
      });

      const paidEbook = JSON.parse(paidResponse.body);
      paidEbookId = paidEbook.id;
      ebookIds.push(paidEbook.id);
    });

    it('should allow download of free ebook', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/ebooks/${freeEbookId}/download`,
        cookies: {
          token: studentToken,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.downloadUrl).toBeDefined();
      expect(result.ebook).toBeDefined();
      expect(result.ebook.id).toBe(freeEbookId);
      expect(result.downloadedAt).toBeDefined();
    });

    it('should reject download of paid ebook without purchase', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/ebooks/${paidEbookId}/download`,
        cookies: {
          token: studentToken,
        },
      });

      expect(response.statusCode).toBe(403);
      const error = JSON.parse(response.body);
      expect(error.error).toBe('You need to purchase this ebook first');
    });

    it('should reject download without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/ebooks/${freeEbookId}/download`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for download of non-existent ebook', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ebooks/non-existent-id/download',
        cookies: {
          token: studentToken,
        },
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body);
      expect(error.error).toBe('Ebook not found');
    });
  });

  describe('Student Ebook Library', () => {
    it('should get student purchased ebooks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/student/purchases/ebooks',
        cookies: {
          token: studentToken,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.ebooks).toBeDefined();
      expect(Array.isArray(result.ebooks)).toBe(true);
    });

    it('should reject student ebooks request without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/student/purchases/ebooks',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Search Functionality', () => {
    it('should search ebooks by title', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/search?q=Test&type=ebook',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.ebooks).toBeDefined();
      expect(Array.isArray(result.ebooks)).toBe(true);
    });

    it('should handle search with minimum query length', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/search?q=T&type=ebook',
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.error).toBeDefined();
    });
  });
});
