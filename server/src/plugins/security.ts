import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export async function registerSecurity(app: FastifyInstance) {
  // Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  // Additional security measures
  app.addHook('onRequest', async (request, reply) => {
    // Block requests with suspicious patterns
    const suspiciousPatterns = [
      /(\.\.\/)/, // Path traversal
      /(<script|<iframe|javascript:)/i, // XSS attempts
      /(union.*select|select.*from|insert.*into|delete.*from)/i, // SQL injection
      /(\${|`|\|)/g, // Command injection
    ];

    const url = request.url;
    const body = JSON.stringify(request.body || {});
    const headers = JSON.stringify(request.headers || {});
    const combined = `${url}${body}${headers}`;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(combined)) {
        app.log.warn(`Suspicious request blocked: ${request.ip} - ${url}`);
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid request format',
        });
        return;
      }
    }

    // Add security headers
    reply.header('X-Request-Id', request.id);
    reply.header('X-Powered-By', 'LN Educacional');

    // Remove sensitive headers
    reply.removeHeader('x-powered-by');
  });

  // Content validation
  app.addHook('preHandler', async (request, reply) => {
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type'];

      if (!contentType) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Content-Type header is required',
        });
        return;
      }

      // Check for large payloads
      const maxSize = 10 * 1024 * 1024; // 10MB
      const contentLength = Number.parseInt(request.headers['content-length'] || '0', 10);

      if (contentLength > maxSize) {
        reply.code(413).send({
          error: 'Payload Too Large',
          message: `Request body exceeds maximum size of ${maxSize} bytes`,
        });
        return;
      }
    }
  });

  // IP blocking for production
  if (process.env.NODE_ENV === 'production') {
    const blockedIPs = new Set(process.env.BLOCKED_IPS?.split(',') || []);

    app.addHook('onRequest', async (request, reply) => {
      if (blockedIPs.has(request.ip)) {
        app.log.warn(`Blocked IP attempted access: ${request.ip}`);
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
        return;
      }
    });
  }

  // CORS security
  app.addHook('onRequest', async (request, _reply) => {
    const origin = request.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];

    if (origin && !allowedOrigins.includes(origin)) {
      app.log.warn(`CORS violation from: ${origin}`);
    }
  });

  app.log.info('Security plugins registered successfully');
}
