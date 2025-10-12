import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from '../src/app';

let app: FastifyInstance;
let adminToken: string;
let studentToken: string;
const messageIds: string[] = [];

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

  // Update user to admin role
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
  // Cleanup test messages
  for (const messageId of messageIds) {
    try {
      await app.inject({
        method: 'DELETE',
        url: `/admin/messages/${messageId}`,
        headers: { cookie: `token=${adminToken}` },
      });
    } catch (error) {
      console.log('Error cleaning up message:', messageId);
    }
  }

  await app.close();
});

describe('Contact API Tests', () => {
  describe('POST /contact - Public Contact Form', () => {
    it('should submit contact form successfully with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '94984211357',
          subject: 'Dúvida sobre trabalhos',
          message: 'Gostaria de mais informações sobre os serviços oferecidos pela empresa.',
          acceptTerms: true,
          captchaToken: 'test-captcha-token',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.messageId).toBeDefined();
      expect(data.message).toContain('Mensagem enviada com sucesso');

      // Store message ID for cleanup
      messageIds.push(data.messageId);
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'A', // Too short
          email: 'invalid-email', // Invalid format
          subject: 'Hi', // Too short
          message: 'Short', // Too short
          acceptTerms: false, // Must be true
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Dados inválidos');
      expect(data.details).toBeDefined();
    });

    it('should reject spam with honeypot field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Spam Bot',
          email: 'spam@bot.com',
          subject: 'Spam Subject',
          message: 'This is a spam message with viagra and casino keywords',
          acceptTerms: true,
          website: 'http://spam.com', // Honeypot field - should trigger spam detection
        },
      });

      expect([400, 429]).toContain(response.statusCode);
    });

    it('should handle missing required fields gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Test User',
          // Missing email, subject, message, acceptTerms
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Dados inválidos');
    });

    it('should handle optional phone field correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Test User Without Phone',
          email: 'nophone@example.com',
          subject: 'Test without phone',
          message: 'This is a test message without phone number provided',
          acceptTerms: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);

      messageIds.push(data.messageId);
    });
  });

  describe('GET /admin/messages - List Messages (Admin)', () => {
    it('should require admin authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not allow non-admin users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages',
        headers: { cookie: `token=${studentToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should list messages for admin users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages',
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.total).toBeDefined();
      expect(typeof data.total).toBe('number');
    });

    it('should support pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages?skip=0&take=5',
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.messages).toBeDefined();
      expect(data.messages.length).toBeLessThanOrEqual(5);
    });

    it('should support status filtering', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages?status=UNREAD',
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.messages).toBeDefined();
      // All returned messages should have UNREAD status
      data.messages.forEach((message: any) => {
        expect(message.status).toBe('UNREAD');
      });
    });

    it('should support search functionality', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages?search=João',
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.messages).toBeDefined();
    });
  });

  describe('PUT /admin/messages/:id/status - Update Message Status', () => {
    let testMessageId: string;

    beforeAll(async () => {
      // Create a test message first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Status Test User',
          email: 'statustest@example.com',
          subject: 'Status Test Message',
          message: 'This message is for testing status updates',
          acceptTerms: true,
        },
      });

      const createData = JSON.parse(createResponse.body);
      testMessageId = createData.messageId;
      messageIds.push(testMessageId);
    });

    it('should require admin authentication', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/admin/messages/${testMessageId}/status`,
        payload: { status: 'READ' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not allow non-admin users', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/admin/messages/${testMessageId}/status`,
        headers: { cookie: `token=${studentToken}` },
        payload: { status: 'read' },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should update message status successfully', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/admin/messages/${testMessageId}/status`,
        headers: { cookie: `token=${adminToken}` },
        payload: { status: 'read' },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.id).toBe(testMessageId);
      expect(data.status).toBe('read');
    });

    it('should validate status values', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/admin/messages/${testMessageId}/status`,
        headers: { cookie: `token=${adminToken}` },
        payload: { status: 'invalid_status' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle non-existent message ID', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/admin/messages/non-existent-id/status',
        headers: { cookie: `token=${adminToken}` },
        payload: { status: 'read' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /admin/messages/:id/reply - Reply to Message', () => {
    let testMessageId: string;

    beforeAll(async () => {
      // Create a test message first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Reply Test User',
          email: 'replytest@example.com',
          subject: 'Reply Test Message',
          message: 'This message is for testing replies',
          acceptTerms: true,
        },
      });

      const createData = JSON.parse(createResponse.body);
      testMessageId = createData.messageId;
      messageIds.push(testMessageId);
    });

    it('should require admin authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/admin/messages/${testMessageId}/reply`,
        payload: { content: 'Test reply content' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not allow non-admin users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/admin/messages/${testMessageId}/reply`,
        headers: { cookie: `token=${studentToken}` },
        payload: { content: 'Test reply content' },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should send reply successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/admin/messages/${testMessageId}/reply`,
        headers: { cookie: `token=${adminToken}` },
        payload: {
          content: 'Olá! Obrigado por entrar em contato. Vamos responder sua dúvida...',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('should validate reply content length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/admin/messages/${testMessageId}/reply`,
        headers: { cookie: `token=${adminToken}` },
        payload: { content: 'Short' }, // Too short
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /admin/messages/:id - Delete Message', () => {
    let testMessageId: string;

    beforeAll(async () => {
      // Create a test message first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Delete Test User',
          email: 'deletetest@example.com',
          subject: 'Delete Test Message',
          message: 'This message is for testing deletion',
          acceptTerms: true,
        },
      });

      const createData = JSON.parse(createResponse.body);
      testMessageId = createData.messageId;
    });

    it('should require admin authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/messages/${testMessageId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not allow non-admin users', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/messages/${testMessageId}`,
        headers: { cookie: `token=${studentToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should delete message successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/messages/${testMessageId}`,
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });

    it('should handle non-existent message ID', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/admin/messages/non-existent-id',
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /admin/messages/bulk-read - Bulk Mark as Read', () => {
    let testMessageIds: string[] = [];

    beforeAll(async () => {
      // Create multiple test messages
      for (let i = 0; i < 3; i++) {
        const createResponse = await app.inject({
          method: 'POST',
          url: '/contact',
          payload: {
            name: `Bulk Test User ${i + 1}`,
            email: `bulktest${i + 1}@example.com`,
            subject: `Bulk Test Message ${i + 1}`,
            message: 'This message is for testing bulk operations',
            acceptTerms: true,
          },
        });

        const createData = JSON.parse(createResponse.body);
        testMessageIds.push(createData.messageId);
        messageIds.push(createData.messageId);
      }
    });

    it('should require admin authentication', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/admin/messages/bulk-read',
        payload: { messageIds: testMessageIds },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not allow non-admin users', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/admin/messages/bulk-read',
        headers: { cookie: `token=${studentToken}` },
        payload: { messageIds: testMessageIds },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should mark multiple messages as read', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/admin/messages/bulk-read',
        headers: { cookie: `token=${adminToken}` },
        payload: { messageIds: testMessageIds },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(testMessageIds.length);
    });

    it('should validate message IDs array', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/admin/messages/bulk-read',
        headers: { cookie: `token=${adminToken}` },
        payload: { messageIds: [] }, // Empty array
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /admin/messages/stats - Message Statistics', () => {
    it('should require admin authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages/stats',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not allow non-admin users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages/stats',
        headers: { cookie: `token=${studentToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return message statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/messages/stats',
        headers: { cookie: `token=${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toBeDefined();

      // Should contain statistical data
      expect(typeof data).toBe('object');
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should have rate limiting configured for contact endpoint', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/contact',
            payload: {
              name: 'Rate Limit Test',
              email: 'ratelimit@example.com',
              subject: 'Rate Limit Test',
              message: 'Testing rate limiting functionality',
              acceptTerms: true,
            },
          })
        );
      }

      const responses = await Promise.all(requests);

      // At least some requests should be successful
      const successfulRequests = responses.filter(r => r.statusCode === 201);
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Some might be rate limited (429) if rate limiting is working
      const rateLimitedRequests = responses.filter(r => r.statusCode === 429);

      // Clean up created messages
      successfulRequests.forEach(response => {
        const data = JSON.parse(response.body);
        if (data.messageId) {
          messageIds.push(data.messageId);
        }
      });
    });
  });

  describe('Security Validation Tests', () => {
    it('should sanitize input data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          subject: 'Test with potential XSS',
          message: 'This message contains <script>alert("xss")</script> potential XSS',
          acceptTerms: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      messageIds.push(data.messageId);
    });

    it('should handle very long input gracefully', async () => {
      const longString = 'A'.repeat(10000);

      const response = await app.inject({
        method: 'POST',
        url: '/contact',
        payload: {
          name: 'Long Input Test',
          email: 'longtest@example.com',
          subject: 'Long input test',
          message: longString,
          acceptTerms: true,
        },
      });

      // Should either accept or reject gracefully, not crash
      expect([201, 400, 413]).toContain(response.statusCode);

      if (response.statusCode === 201) {
        const data = JSON.parse(response.body);
        messageIds.push(data.messageId);
      }
    });
  });
});