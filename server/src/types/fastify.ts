import type { User } from '@prisma/client';
import type { FastifyRequest } from 'fastify';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: User;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: any) => Promise<void>;
  }
}

// Type for request with params
export interface RequestWithParams<T = Record<string, string>> extends FastifyRequest {
  params: T;
}

// Type for request with body
export interface RequestWithBody<T = Record<string, unknown>> extends FastifyRequest {
  body: T;
}

// Type for request with query
export interface RequestWithQuery<T = Record<string, unknown>> extends FastifyRequest {
  query: T;
}

// Combined types
export interface RequestWithParamsAndBody<P = Record<string, string>, B = Record<string, unknown>>
  extends FastifyRequest {
  params: P;
  body: B;
}

export interface RequestWithParamsAndQuery<P = Record<string, string>, Q = Record<string, unknown>>
  extends FastifyRequest {
  params: P;
  query: Q;
}

// Specific parameter types
export interface IdParams {
  id: string;
}

export interface SlugParams {
  slug: string;
}

// Payment data type
export interface PaymentData {
  orderId: string;
  pixCode?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  boletoCode?: string;
  paymentMethod?: string;
  redirectUrl?: string;
}
