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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateTokens = generateTokens;
exports.verifyToken = verifyToken;
exports.validateRefreshToken = validateRefreshToken;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.createPasswordResetToken = createPasswordResetToken;
exports.resetPassword = resetPassword;
exports.getUserById = getUserById;
exports.updateUserVerificationStatus = updateUserVerificationStatus;
const argon2 = __importStar(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("./prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret';
async function hashPassword(password) {
    return argon2.hash(password);
}
async function verifyPassword(hash, password) {
    return argon2.verify(hash, password);
}
async function generateTokens(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
}
async function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (_error) {
        throw new Error('Invalid token');
    }
}
async function validateRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user)
            throw new Error('User not found');
        return user;
    }
    catch (_error) {
        throw new Error('Invalid refresh token');
    }
}
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
});
async function registerUser(data) {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new Error('E-mail já cadastrado');
    }
    const hashedPassword = await hashPassword(data.password);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: 'STUDENT',
        },
    });
    return user;
}
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
async function loginUser(data) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const passwordValid = await verifyPassword(user.password, data.password);
    if (!passwordValid) {
        throw new Error('Invalid credentials');
    }
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
    });
    return user;
}
async function createPasswordResetToken(email) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new Error('User not found');
    }
    const resetToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpiry: new Date(Date.now() + 3600000),
        },
    });
    return resetToken;
}
async function resetPassword(token, newPassword) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                id: decoded.id,
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }
        const hashedPassword = await hashPassword(newPassword);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
    }
    catch (_error) {
        throw new Error('Failed to reset password');
    }
}
async function getUserById(id) {
    return prisma_1.prisma.user.findUnique({
        where: { id },
    });
}
async function updateUserVerificationStatus(id, verified) {
    return prisma_1.prisma.user.update({
        where: { id },
        data: { verified },
    });
}
//# sourceMappingURL=auth.js.map