import type { User } from '@prisma/client';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from './prisma';

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface RefreshTokenPayload {
  id: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function generateTokens(user: User) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

  return { accessToken, refreshToken };
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (_error) {
    throw new Error('Invalid token');
  }
}

export async function validateRefreshToken(token: string): Promise<User> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) throw new Error('User not found');
    return user;
  } catch (_error) {
    throw new Error('Invalid refresh token');
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export async function registerUser(data: z.infer<typeof registerSchema>): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'STUDENT',
    },
  });

  return user;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginUser(data: z.infer<typeof loginSchema>): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordValid = await verifyPassword(user.password, data.password);

  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });

  return user;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 3600000),
    },
  });

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findFirst({
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  } catch (_error) {
    throw new Error('Failed to reset password');
  }
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUserVerificationStatus(id: string, verified: boolean): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { verified },
  });
}
