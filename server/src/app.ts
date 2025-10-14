import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import type { FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { generateTokens, loginUser, registerUser, validateRefreshToken, verifyToken } from './auth';
import { prisma } from './prisma';
import { registerAllRoutes } from './routes';
import { uploadConfig } from './services/upload.service';

export function build(opts: { logger?: boolean } = {}) {
  const app = fastify({
    logger: opts.logger ?? true,
    ...opts,
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';
  const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-key';
  const isProduction = process.env.NODE_ENV === 'production';

  const allowedOriginsEnv = process.env.CORS_ORIGIN || '';
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Helper para configurar cookies corretamente
  const getCookieOptions = (maxAge: number) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge,
  });

  // Adicionar headers de segurança ANTES do CORS
  app.register(helmet, {
    global: true,
    contentSecurityPolicy: false, // Desabilitar CSP para não quebrar o frontend
    crossOriginResourcePolicy: false, // Permitir recursos cross-origin
    crossOriginOpenerPolicy: false, // Permitir popup cross-origin
  });

  app.register(cors, {
    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  app.register(cookie, { secret: COOKIE_SECRET });

  app.register(jwt, {
    secret: JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });


  app.register(multipart, uploadConfig);

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('[AUTH] 🔍 Checking authentication...');
      console.log('[AUTH] 📋 Cookies received:', Object.keys(request.cookies));
      const token = request.cookies.token;
      console.log('[AUTH] 🎫 Token present:', !!token);
      if (!token) {
        console.log('[AUTH] ❌ No token in cookies');
        throw new Error('No token');
      }
      const decoded = await verifyToken(token);
      console.log('[AUTH] ✅ Token verified for user:', decoded.email);
      request.currentUser = decoded as any;
    } catch (err) {
      console.log('[AUTH] ❌ Authentication failed:', (err as Error).message);
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    if ((request.currentUser as any)?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  });

  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  });

  app.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const user = await registerUser(body);
      const tokens = await generateTokens(user);

      reply
        .setCookie('token', tokens.accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000))
        .setCookie('refreshToken', tokens.refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
        .send({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post('/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await loginUser(body);
      const tokens = await generateTokens(user);

      const cookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000);
      console.log('[LOGIN] 🍪 Setting cookies with options:', cookieOptions);
      console.log('[LOGIN] ✅ User logged in:', user.email, 'Role:', user.role);

      reply
        .setCookie('token', tokens.accessToken, cookieOptions)
        .setCookie('refreshToken', tokens.refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
        .send({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
    } catch (error: unknown) {
      console.log('[LOGIN] ❌ Login failed:', (error as Error).message);
      reply.status(401).send({ error: (error as Error).message });
    }
  });

  app.post('/auth/logout', async (_request, reply) => {
    reply
      .clearCookie('token')
      .clearCookie('refreshToken')
      .send({ message: 'Logged out successfully' });
  });

  app.get(
    '/auth/verify',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send({ user: request.currentUser });
    }
  );

  // Rota /auth/me - alias para /auth/verify (compatibilidade com frontend)
  app.get(
    '/auth/me',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      console.log('[AUTH/ME] 📋 Request received from:', request.ip);
      // Buscar dados completos do usuário no banco
      const user = await prisma.user.findUnique({
        where: { id: (request.currentUser as any).id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          verified: true,
        },
      });

      if (!user) {
        console.log('[AUTH/ME] ❌ User not found in database');
        return reply.status(404).send({ error: 'User not found' });
      }

      console.log('[AUTH/ME] ✅ Returning user data:', user.email);
      reply.send({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.verified,
      });
    }
  );

  app.post('/auth/refresh', async (request, reply) => {
    try {
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) throw new Error('No refresh token');

      const user = await validateRefreshToken(refreshToken);
      const tokens = await generateTokens(user);

      reply
        .setCookie('token', tokens.accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000))
        .send({ success: true });
    } catch (_error: unknown) {
      reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  const forgotPasswordSchema = z.object({
    email: z.string().email(),
  });

  app.post('/auth/forgot-password', async (request, reply) => {
    try {
      forgotPasswordSchema.parse(request.body);
      reply.send({ message: 'Password reset email sent' });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
  });

  app.post('/auth/reset-password', async (request, reply) => {
    try {
      resetPasswordSchema.parse(request.body);
      reply.send({ message: 'Password reset successfully' });
    } catch (error: unknown) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Rota para servir arquivos estáticos da pasta uploads
  app.get('/uploads/*', async (request, reply) => {
    try {
      const filePath = request.url.replace('/uploads/', '');
      const fullPath = path.join(process.cwd(), 'uploads', filePath);

      // Verificar se o arquivo existe
      await fs.access(fullPath);

      // Determinar o tipo de conteúdo baseado na extensão
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';

      // Ler e enviar o arquivo
      const fileBuffer = await fs.readFile(fullPath);
      reply.type(contentType).send(fileBuffer);
    } catch (error) {
      reply.status(404).send({ error: 'File not found' });
    }
  });

  app.register(registerAllRoutes);

  return app;
}
