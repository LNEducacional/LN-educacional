import type { User } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        currentUser?: User;
    }
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
        requireAdmin: (request: FastifyRequest, reply: any) => Promise<void>;
    }
}
export interface RequestWithParams<T = Record<string, string>> extends FastifyRequest {
    params: T;
}
export interface RequestWithBody<T = Record<string, unknown>> extends FastifyRequest {
    body: T;
}
export interface RequestWithQuery<T = Record<string, unknown>> extends FastifyRequest {
    query: T;
}
export interface RequestWithParamsAndBody<P = Record<string, string>, B = Record<string, unknown>> extends FastifyRequest {
    params: P;
    body: B;
}
export interface RequestWithParamsAndQuery<P = Record<string, string>, Q = Record<string, unknown>> extends FastifyRequest {
    params: P;
    query: Q;
}
export interface IdParams {
    id: string;
}
export interface SlugParams {
    slug: string;
}
export interface PaymentData {
    orderId: string;
    pixCode?: string;
    pixQrCode?: string;
    boletoUrl?: string;
    boletoCode?: string;
    paymentMethod?: string;
    redirectUrl?: string;
}
//# sourceMappingURL=fastify.d.ts.map