"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;
const cookie_1 = __importDefault(require("@fastify/cookie"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const fastify_1 = __importDefault(require("fastify"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma_1 = require("./prisma");
const routes_1 = require("./routes");
const upload_service_1 = require("./services/upload.service");
function build(opts = {}) {
    const app = (0, fastify_1.default)({
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
    const getCookieOptions = (maxAge) => ({
        httpOnly: true,
        secure: isProduction,
        sameSite: (isProduction ? 'none' : 'lax'),
        path: '/',
        maxAge,
        domain: isProduction ? 'lneducacional.com.br' : undefined,
    });
    // Adicionar headers de segurança ANTES do CORS
    app.register(helmet_1.default, {
        global: true,
        contentSecurityPolicy: false, // Desabilitar CSP para não quebrar o frontend
        crossOriginResourcePolicy: false, // Permitir recursos cross-origin
        crossOriginOpenerPolicy: false, // Permitir popup cross-origin
    });
    app.register(cors_1.default, {
        origin: allowedOrigins.length > 0
            ? allowedOrigins
            : ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
    });
    app.register(cookie_1.default, { secret: COOKIE_SECRET });
    app.register(jwt_1.default, {
        secret: JWT_SECRET,
        cookie: {
            cookieName: 'token',
            signed: false,
        },
    });
    app.register(multipart_1.default, upload_service_1.uploadConfig);
    app.decorate('authenticate', async (request, reply) => {
        try {
            const token = request.cookies.token;
            if (!token) {
                throw new Error('No token');
            }
            const decoded = await (0, auth_1.verifyToken)(token);
            request.currentUser = decoded;
        }
        catch (err) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });
    app.decorate('requireAdmin', async (request, reply) => {
        if (request.currentUser?.role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Forbidden' });
        }
    });
    const registerSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        name: zod_1.z.string().min(2),
    });
    app.post('/auth/register', async (request, reply) => {
        try {
            const body = registerSchema.parse(request.body);
            const user = await (0, auth_1.registerUser)(body);
            const tokens = await (0, auth_1.generateTokens)(user);
            reply
                .clearCookie('token')
                .clearCookie('refreshToken')
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                // Extrair mensagens amigáveis dos erros do Zod
                const messages = error.errors.map((e) => e.message).join(', ');
                return reply.status(400).send({ message: messages });
            }
            reply.status(400).send({ message: error.message });
        }
    });
    const loginSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
    });
    app.post('/auth/login', async (request, reply) => {
        try {
            const body = loginSchema.parse(request.body);
            const user = await (0, auth_1.loginUser)(body);
            const tokens = await (0, auth_1.generateTokens)(user);
            const cookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000);
            console.log('[LOGIN] 🍪 Setting cookies with options:', cookieOptions);
            console.log('[LOGIN] ✅ User logged in:', user.email, 'Role:', user.role);
            reply
                .clearCookie('token')
                .clearCookie('refreshToken')
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
        }
        catch (error) {
            console.log('[LOGIN] ❌ Login failed:', error.message);
            reply.status(401).send({ error: error.message });
        }
    });
    app.post('/auth/logout', async (_request, reply) => {
        reply
            .clearCookie('token')
            .clearCookie('refreshToken')
            .send({ message: 'Logged out successfully' });
    });
    app.get('/auth/verify', { preHandler: [app.authenticate] }, async (request, reply) => {
        reply.send({ user: request.currentUser });
    });
    // Rota /auth/me - alias para /auth/verify (compatibilidade com frontend)
    app.get('/auth/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        console.log('[AUTH/ME] 📋 Request received from:', request.ip);
        // Buscar dados completos do usuário no banco
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: request.currentUser.id },
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
    });
    app.post('/auth/refresh', async (request, reply) => {
        try {
            const refreshToken = request.cookies.refreshToken;
            if (!refreshToken)
                throw new Error('No refresh token');
            const user = await (0, auth_1.validateRefreshToken)(refreshToken);
            const tokens = await (0, auth_1.generateTokens)(user);
            reply
                .clearCookie('token')
                .setCookie('token', tokens.accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000))
                .send({ success: true });
        }
        catch (_error) {
            reply.status(401).send({ error: 'Invalid refresh token' });
        }
    });
    const forgotPasswordSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
    });
    app.post('/auth/forgot-password', async (request, reply) => {
        try {
            forgotPasswordSchema.parse(request.body);
            reply.send({ message: 'Password reset email sent' });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    const resetPasswordSchema = zod_1.z.object({
        token: zod_1.z.string(),
        password: zod_1.z.string().min(8),
    });
    app.post('/auth/reset-password', async (request, reply) => {
        try {
            resetPasswordSchema.parse(request.body);
            reply.send({ message: 'Password reset successfully' });
        }
        catch (error) {
            reply.status(400).send({ error: error.message });
        }
    });
    // Rota para servir arquivos estáticos da pasta uploads
    app.get('/uploads/*', async (request, reply) => {
        try {
            const filePath = request.url.replace('/uploads/', '');
            const fullPath = path_1.default.join(process.cwd(), 'uploads', filePath);
            // Verificar se o arquivo existe
            await fs_1.promises.access(fullPath);
            // Determinar o tipo de conteúdo baseado na extensão
            const ext = path_1.default.extname(fullPath).toLowerCase();
            const contentTypes = {
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
            const fileBuffer = await fs_1.promises.readFile(fullPath);
            reply.type(contentType).send(fileBuffer);
        }
        catch (error) {
            reply.status(404).send({ error: 'File not found' });
        }
    });
    app.register(routes_1.registerAllRoutes);
    return app;
}
//# sourceMappingURL=app.js.map