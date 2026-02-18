---
type: doc
name: testing-strategy
description: Test frameworks, patterns, coverage requirements, and quality gates
category: testing
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Testing Strategy

## Current State

The project has a nascent testing setup. Test infrastructure has been configured but most tests have been removed or are pending implementation. The current focus is on building features rapidly with manual testing.

## Test Infrastructure

### Client-Side Testing

The client previously had Vitest configured as the test runner:

- **Framework:** Vitest (compatible with Vite)
- **Config:** `client/vitest.config.ts` (previously existed, currently removed)
- **Setup:** `client/src/tests/setup.ts` (previously existed, currently removed)

Previously existing tests:
- `client/src/components/ebooks/ebook-card.test.tsx` -- Component test for the EbookCard component (removed)

### End-to-End Testing

Playwright was previously configured for E2E tests:

- **Framework:** Playwright
- **Binary:** Available in `node_modules/.bin/playwright`
- **Test files** (previously existed, currently removed):
  - `e2e/collaborator-application.spec.ts`
  - `e2e/contact.spec.ts`
  - `e2e/ebooks.spec.ts`

## Quality Gates

### Type Checking

TypeScript strict type checking is the primary quality gate:

```bash
# Check types across all workspaces
npm run typecheck
```

This runs `tsc --noEmit` in both the server and client workspaces.

### Linting

Biome provides linting and formatting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

### Build Verification

The build process serves as an integration quality gate:

```bash
# Build both server and client
npm run build
```

Per project conventions (CLAUDE.md), every change should be built successfully before committing.

## Recommended Testing Strategy

### Unit Tests (Priority: High)

Focus areas for unit testing:

1. **Server services** -- `AsaasService`, `AntiSpamService`, `AutoReplyService`, `EmailService` contain testable business logic with clear inputs and outputs.
2. **Auth module** -- `auth.ts` has pure functions for password hashing, token generation, and validation.
3. **Data access functions** -- Functions in `prisma.ts` can be tested with a test database or mocked Prisma client.
4. **Zod schemas** -- Validation schemas can be tested for correct acceptance and rejection of inputs.

### Integration Tests (Priority: Medium)

Focus areas:

1. **API routes** -- Test the full request-response cycle using Fastify's `inject()` method (no network required).
2. **Payment flow** -- Test the checkout flow with mocked Asaas responses.
3. **Authentication flow** -- Test register -> login -> access protected route -> refresh -> logout.
4. **Custom paper workflow** -- Test state transitions through the custom paper lifecycle.

### E2E Tests (Priority: Medium)

Focus areas for Playwright tests:

1. **Public pages** -- Home, papers listing, course listing, ebook listing, contact form.
2. **Authentication** -- Register, login, logout, password reset.
3. **Student flow** -- Browse -> add to cart -> checkout -> access content.
4. **Admin flow** -- Login -> CRUD operations for papers/courses/ebooks.
5. **Collaborator flow** -- Application submission -> status tracking.

### Component Tests (Priority: Lower)

Focus areas:

1. **Form components** -- Test form validation, submission, error states.
2. **Card components** -- Test rendering with different props (free vs paid, different statuses).
3. **Admin data tables** -- Test filtering, sorting, pagination.

## Test Database Setup

For integration tests, use a separate PostgreSQL database:

```bash
# Use a test database URL
DATABASE_URL="postgresql://postgres:secret@localhost:5432/ln_educacional_test?schema=public"

# Run migrations on the test database
npx prisma migrate deploy
```

## Mocking Guidelines

### External Services

- **Asaas API** -- Mock axios responses. The `AsaasService` constructor accepts a config object, making it easy to test.
- **Email Service** -- The `console` provider is already a no-op suitable for testing.
- **Redis** -- The redis client returns `null` gracefully when unavailable, so tests work without Redis.

### Prisma

For unit tests that need Prisma, consider:
1. Using `prismock` or `prisma-mock` for in-memory mocking.
2. Using a real test database with cleanup between tests.
3. Extracting business logic into pure functions that can be tested without Prisma.

## Biome Linting Rules

The project enforces these Biome rules as quality gates:

| Rule | Level | Description |
|------|-------|-------------|
| `noExcessiveCognitiveComplexity` | error | Prevents overly complex functions |
| `noUnusedVariables` | error | No dead code |
| `useConst` | error | Prefer `const` over `let` |
| `useTemplate` | error | Prefer template literals |
| `noExplicitAny` | warn | Discourage `any` types |
| `noDoubleEquals` | error | Require strict equality |
