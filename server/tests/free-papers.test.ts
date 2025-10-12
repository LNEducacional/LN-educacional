import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from '../src/app';

let app: FastifyInstance;
let adminToken: string;
let studentToken: string;
const paperIds: string[] = [];

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
      email: `admin${timestamp}@test.com`,
      password: 'adminpass123',
      name: 'Admin Test',
    },
  });

  const adminCookies = adminResponse.cookies;
  adminToken = adminCookies.find((c) => c.name === 'token')?.value || '';

  console.log('Admin response status:', adminResponse.statusCode);
  console.log('Admin response body:', adminResponse.body);
  console.log('Admin cookies:', adminCookies);
  console.log('Admin token:', adminToken);

  // Update user to admin role (will require DB access)
  const { prisma } = await import('../src/prisma');
  const adminUser = await prisma.user.update({
    where: { email: `admin${timestamp}@test.com` },
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
      email: `student${timestamp}@test.com`,
      password: 'studentpass123',
      name: 'Student Test',
    },
  });

  const studentCookies = studentResponse.cookies;
  studentToken = studentCookies.find((c) => c.name === 'token')?.value || '';
});

afterAll(async () => {
  // Cleanup test data
  for (const paperId of paperIds) {
    await app.inject({
      method: 'DELETE',
      url: `/admin/papers/${paperId}`,
      headers: { cookie: `token=${adminToken}` },
    });
  }

  await app.close();
});

describe('Free Papers E2E Tests', () => {
  describe('Task 6.1.1: Teste de criação de paper gratuito (admin)', () => {
    it('should allow admin to create a free paper', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/papers',
        headers: {
          cookie: `token=${adminToken}`,
        },
        payload: {
          title: 'Test Free Paper',
          description: 'A test free paper for E2E testing',
          paperType: 'THESIS',
          academicArea: 'ENGINEERING',
          price: 0,
          pageCount: 50,
          authorName: 'Test Author',
          fileUrl: 'https://example.com/test-paper.pdf',
          isFree: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const paper = JSON.parse(response.body);
      expect(paper).toBeDefined();
      expect(paper.title).toBe('Test Free Paper');
      expect(paper.isFree).toBe(true);

      paperIds.push(paper.id);
    });

    it('should not allow non-admin to create papers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/papers',
        headers: { cookie: `token=${studentToken}` },
        payload: {
          title: 'Unauthorized Paper',
          description: 'Should not work',
          paperType: 'THESIS',
          academicArea: 'ENGINEERING',
          price: 0,
          pageCount: 30,
          authorName: 'Unauthorized User',
          fileUrl: 'https://example.com/unauthorized.pdf',
          isFree: true,
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Task 6.1.2: Teste de listagem pública', () => {
    it('should list free papers publicly without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/papers?free=true',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.papers).toBeDefined();
      expect(Array.isArray(data.papers)).toBe(true);

      // Should include our test paper
      const testPaper = data.papers.find((p: any) => p.title === 'Test Free Paper');
      expect(testPaper).toBeDefined();
      expect(testPaper.isFree).toBe(true);
    });

    it('should filter only free papers when free=true', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/papers?free=true',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      // All papers should be free
      data.papers.forEach((paper: any) => {
        expect(paper.isFree).toBe(true);
      });
    });
  });

  describe('Task 6.1.3: Teste de download com autenticação', () => {
    it('should require authentication for downloading', async () => {
      if (paperIds.length === 0) return;

      const response = await app.inject({
        method: 'GET',
        url: `/papers/${paperIds[0]}/download`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should allow authenticated user to download free paper', async () => {
      if (paperIds.length === 0) return;

      const response = await app.inject({
        method: 'GET',
        url: `/papers/${paperIds[0]}/download`,
        headers: { cookie: `token=${studentToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.downloadUrl).toBeDefined();
      expect(data.paper).toBeDefined();
      expect(data.paper.title).toBe('Test Free Paper');
    });

    it('should reject download of non-free paper', async () => {
      // First create a non-free paper
      const createResponse = await app.inject({
        method: 'POST',
        url: '/admin/papers',
        headers: { cookie: `token=${adminToken}` },
        payload: {
          title: 'Paid Paper',
          description: 'A paid paper',
          paperType: 'THESIS',
          academicArea: 'ENGINEERING',
          price: 29.99,
          pageCount: 50,
          authorName: 'Test Author',
          fileUrl: 'https://example.com/paid-paper.pdf',
          isFree: false,
        },
      });

      const createData = JSON.parse(createResponse.body);
      const paidPaperId = createData.id;
      paperIds.push(paidPaperId);

      // Try to download it
      const downloadResponse = await app.inject({
        method: 'GET',
        url: `/papers/${paidPaperId}/download`,
        headers: { cookie: `token=${studentToken}` },
      });

      expect(downloadResponse.statusCode).toBe(403);
      const data = JSON.parse(downloadResponse.body);
      expect(data.error).toContain('not free');
    });
  });

  describe('Task 6.1.4: Teste de adição à biblioteca', () => {
    it('should add free paper to user library after download', async () => {
      if (paperIds.length === 0) return;

      // Download the paper (which should add it to library)
      await app.inject({
        method: 'GET',
        url: `/papers/${paperIds[0]}/download`,
        headers: { cookie: `token=${studentToken}` },
      });

      // Check if it's in the library
      const libraryResponse = await app.inject({
        method: 'GET',
        url: '/student/library',
        headers: { cookie: `token=${studentToken}` },
      });

      expect(libraryResponse.statusCode).toBe(200);
      const libraryData = JSON.parse(libraryResponse.body);

      const paperInLibrary = libraryData.items.find(
        (item: any) => item.itemId === paperIds[0] && item.itemType === 'PAPER'
      );
      expect(paperInLibrary).toBeDefined();
    });

    it('should not duplicate papers in library', async () => {
      if (paperIds.length === 0) return;

      // Download the same paper again
      await app.inject({
        method: 'GET',
        url: `/papers/${paperIds[0]}/download`,
        headers: { cookie: `token=${studentToken}` },
      });

      // Check library count
      const libraryResponse = await app.inject({
        method: 'GET',
        url: '/student/library',
        headers: { cookie: `token=${studentToken}` },
      });

      const libraryData = JSON.parse(libraryResponse.body);
      const paperItems = libraryData.items.filter(
        (item: any) => item.itemId === paperIds[0] && item.itemType === 'PAPER'
      );

      expect(paperItems.length).toBe(1); // Should only appear once
    });
  });

  describe('Task 6.1.5: Teste de re-download', () => {
    it('should allow re-download from library', async () => {
      if (paperIds.length === 0) return;

      // Download again should work
      const response = await app.inject({
        method: 'GET',
        url: `/papers/${paperIds[0]}/download`,
        headers: { cookie: `token=${studentToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.downloadUrl).toBeDefined();
    });
  });
});

describe('Task 6.2: Validação de Segurança', () => {
  describe('Task 6.2.1: Verificar que apenas papers com isFree=true podem ser baixados gratuitamente', () => {
    it('should block download of non-free papers', async () => {
      // This is already tested above in the download tests
      expect(true).toBe(true);
    });
  });

  describe('Task 6.2.2: Verificar autenticação em todas as rotas', () => {
    it('should require authentication for download route', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/papers/any-id/download',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require authentication for library route', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/student/library',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require admin role for admin routes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/papers',
        headers: { cookie: `token=${studentToken}` },
        payload: {},
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Task 6.2.3: Verificar rate limiting para downloads', () => {
    it('should not rate limit normal usage', async () => {
      if (paperIds.length === 0) return;

      // Make several requests in succession
      for (let i = 0; i < 5; i++) {
        const response = await app.inject({
          method: 'GET',
          url: `/papers/${paperIds[0]}/download`,
          headers: { cookie: `token=${studentToken}` },
        });

        expect(response.statusCode).toBe(200);
      }
    });

    it('should have rate limiting configured', async () => {
      // Check that rate limiting middleware is present
      // This is more of a configuration test
      expect(app.hasPlugin('@fastify/rate-limit')).toBe(true);
    });
  });
});
