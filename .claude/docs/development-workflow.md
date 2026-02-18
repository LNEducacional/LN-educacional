---
type: doc
name: development-workflow
description: Day-to-day engineering processes, branching, and contribution guidelines
category: workflow
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Development Workflow

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** 16 (or Docker)
- **Redis** 7 (optional for development; app degrades gracefully without it)

## Getting Started

### 1. Install Dependencies

```bash
# From the project root -- installs all workspace dependencies
npm install
```

### 2. Set Up Environment Variables

Create environment files for the server:

```bash
# server/.env
DATABASE_URL="postgresql://postgres:secret@localhost:5432/ln_educacional?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
COOKIE_SECRET="your-cookie-secret"
CORS_ORIGIN="http://localhost:3000"
NODE_ENV="development"
PORT=3333
EMAIL_PROVIDER="console"
ADMIN_EMAIL="admin@lneducacional.com.br"
```

Create environment files for the client:

```bash
# client/.env
VITE_API_URL="http://localhost:3333"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to inspect data
npm run prisma:studio
```

### 4. Start Development Servers

```bash
# Start both server and client concurrently
npm run dev

# Or start them individually
npm run dev:server   # Fastify on port 3333 (tsx watch)
npm run dev:client   # Vite dev server on port 3000
```

## Available Scripts

### Root Scripts

| Script | Description |
|--------|------------|
| `npm run dev` | Start both server and client in development mode |
| `npm run dev:server` | Start only the server with hot reload (tsx watch) |
| `npm run dev:client` | Start only the client Vite dev server |
| `npm run build` | Build both server and client for production |
| `npm run build:server` | Build server (TypeScript compilation) |
| `npm run build:client` | Build client (Vite production build) |
| `npm run start` | Start both in production mode |
| `npm run lint` | Run Biome linter on entire codebase |
| `npm run lint:fix` | Auto-fix Biome linting issues |
| `npm run format` | Format code with Biome |
| `npm run typecheck` | Run TypeScript type checking across all workspaces |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |

### Server Scripts

| Script | Description |
|--------|------------|
| `npm run dev` | Start with tsx watch (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled JavaScript from `dist/` |
| `npm run typecheck` | Type check without emitting |

### Client Scripts

| Script | Description |
|--------|------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run serve` | Serve production build with `serve` package |
| `npm run typecheck` | Type check without emitting |

## Branching Strategy

The project uses `master` as the main branch. Commit messages follow conventional commit semantics:

- `feat(scope): description` -- New features
- `fix(scope): description` -- Bug fixes
- `refactor(scope): description` -- Code refactoring
- `docs(scope): description` -- Documentation changes
- `chore(scope): description` -- Maintenance tasks

Common scopes include: `client`, `server`, `infra`, `admin`, `auth`, `payments`, `ebooks`, `courses`, `custom-papers`, `blog`, `collaborator`.

## Build and Commit Workflow

Per the project's CLAUDE.md instructions, every successful change should be:

1. **Built** -- Run `npm run build` to verify both server and client compile without errors.
2. **Committed** -- Create a semantic commit to preserve the working state.

This ensures no successful changes are lost and the build always passes.

## Database Workflow

### Adding a New Model

1. Edit `server/prisma/schema.prisma` to add the model.
2. Run `npm run prisma:migrate` to create a migration.
3. Run `npm run prisma:generate` to update the Prisma client types.
4. Add data access functions in `server/src/prisma.ts` or a dedicated service file.

### Schema Changes

Prisma manages all database schema changes through migrations. Never modify the database schema directly; always go through the Prisma workflow.

## Adding a New API Route

1. Create a new route file in `server/src/routes/` (e.g., `my-feature.ts`).
2. Export a `FastifyPluginAsync` function with route definitions.
3. Register the route in the route index (imported via `registerAllRoutes` in `app.ts`).
4. Use `app.authenticate` and `app.requireAdmin` preHandlers as needed.
5. Validate request bodies with Zod schemas.

## Adding a New Page

1. Create the page component in `client/src/pages/`.
2. Add a lazy export in `client/src/routes/lazy-routes.tsx`.
3. Add the route definition in the router configuration.
4. Use `useAuth()` for authentication checks if needed.

## Docker Development

For a full Docker-based development environment:

```bash
# Start PostgreSQL and Redis only
docker compose up postgres redis -d

# Or start the full stack
docker compose up --build
```

## Production Deployment

### Docker Compose (recommended)

```bash
# Build and start all containers
docker compose up -d --build

# Run database migrations
docker compose exec server npx prisma migrate deploy
```

### PM2 (alternative)

```bash
# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Monitor
pm2 monit

# View logs
pm2 logs
```

### Manual Build

```bash
# Or use the build script
bash build.sh
```
