import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll } from 'vitest';
import { build } from '../src/app';

let app: FastifyInstance;

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://lnuser:c01a29b03f35a043b9246845@localhost:5432/lneducacional_test?schema=public';

  // Build app for testing
  app = build({
    logger: false,
  });

  await app.ready();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

export { app };
