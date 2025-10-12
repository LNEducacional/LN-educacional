import type { User } from '@prisma/client';
import { z } from 'zod';
interface JWTPayload {
    id: string;
    email: string;
    name: string;
    role: string;
}
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
export declare function generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function verifyToken(token: string): Promise<JWTPayload>;
export declare function validateRefreshToken(token: string): Promise<User>;
declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export declare function registerUser(data: z.infer<typeof registerSchema>): Promise<User>;
declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare function loginUser(data: z.infer<typeof loginSchema>): Promise<User>;
export declare function createPasswordResetToken(email: string): Promise<string>;
export declare function resetPassword(token: string, newPassword: string): Promise<void>;
export declare function getUserById(id: string): Promise<User | null>;
export declare function updateUserVerificationStatus(id: string, verified: boolean): Promise<User>;
export {};
//# sourceMappingURL=auth.d.ts.map