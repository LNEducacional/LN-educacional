---
type: doc
name: tooling
description: Scripts, IDE settings, automation, and developer productivity tips
category: tooling
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Tooling & Productivity Guide

## Monorepo Setup

LN Educacional uses **npm workspaces** to manage the monorepo:

```json
{
  "workspaces": ["server", "client"]
}
```

Workspace commands follow the pattern:
```bash
npm run <script> --workspace=server
npm run <script> --workspace=client
```

## Biome (Linter & Formatter)

The project uses [Biome](https://biomejs.dev) instead of ESLint/Prettier for linting and formatting. Configuration is in `biome.json` at the project root.

### Configuration Highlights

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

### Key Rules

- **No unused variables** (error)
- **No double equals** (error -- use `===`)
- **Use const** (error -- prefer `const` over `let`)
- **Use template literals** (error -- prefer backtick strings)
- **No explicit any** (warning -- try to type things properly)
- **No excessive cognitive complexity** (error -- break up complex functions)

### Commands

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format all files
npm run format
```

### Ignored Directories

Biome ignores: `dist/`, `build/`, `node_modules/`, `.git/`, `coverage/`, `uploads/`, `logs/`, `backups/`.

## TypeScript Configuration

Both workspaces use TypeScript 5.8+:

- **Server:** Compiles to `server/dist/` via `tsc`
- **Client:** Bundled by Vite (no separate tsc build needed for production, but `tsc --noEmit` is used for type checking)

```bash
# Type check all workspaces
npm run typecheck
```

## Vite (Client Build Tool)

The client uses Vite 5 with:

- **React plugin:** `@vitejs/plugin-react`
- **Compression:** `vite-plugin-compression` for gzip/brotli
- **Bundle visualization:** `rollup-plugin-visualizer` for analyzing bundle size
- **Dev server port:** 3000
- **Preview port:** 3000

### Path Aliases

The client uses `@/` as a path alias for `client/src/`:

```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
```

## Prisma ORM

Prisma is used for database access and schema management.

### Useful Commands

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate

# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Reset database (destructive!)
npx prisma migrate reset --workspace=server

# Deploy migrations (production -- no interactive prompts)
npx prisma migrate deploy --workspace=server
```

### Schema Location

`server/prisma/schema.prisma` -- Contains all 30+ models, enums, and relations.

### Binary Targets

The Prisma client is configured to generate for:
- `native` -- Local development
- `debian-openssl-3.0.x` -- Docker/Linux production

## Redis

Redis is used for caching with graceful degradation.

### Connecting

```bash
# Connect to Redis CLI
redis-cli -u redis://localhost:6379

# Check keys
redis-cli KEYS "*"

# Flush cache
redis-cli FLUSHALL
```

### Cache Patterns

The caching API in `server/src/redis.ts`:

```typescript
import { setCache, getCache, deleteCache, deleteCachePattern } from './redis';

// Set with 5-minute TTL (default)
await setCache('papers:list', papersData);

// Set with custom TTL
await setCache('course:abc123', courseData, 600); // 10 minutes

// Get cached value
const cached = await getCache<PaperList>('papers:list');

// Delete specific key
await deleteCache('papers:list');

// Delete by pattern (e.g., all paper caches)
await deleteCachePattern('papers:*');
```

## Docker

### Dockerfiles

- `Dockerfile.server` -- Builds the Fastify server
- `Dockerfile.client` -- Builds the React SPA and serves via Nginx

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:16-alpine | 5432 | Database |
| redis | redis:7-alpine | 6379 | Cache |
| server | Custom (Dockerfile.server) | 3333 | API |
| client | Custom (Dockerfile.client) | 3000 (80 internal) | Frontend |
| nginx | nginx:alpine | 80, 443 | Reverse proxy + SSL |
| certbot | certbot/certbot | -- | SSL certificate renewal |

### Common Docker Commands

```bash
# Start all services
docker compose up -d

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f server
docker compose logs -f client

# Stop all
docker compose down

# Start only infrastructure
docker compose up postgres redis -d

# Run prisma migrations in container
docker compose exec server npx prisma migrate deploy
```

## PM2 (Process Manager)

PM2 configuration is in `ecosystem.config.cjs`:

### Server Process

- **Mode:** Cluster (all CPU cores)
- **Memory limit:** 1GB (auto-restart)
- **Max restarts:** 10
- **Node args:** `--max-old-space-size=2048 --optimize-for-size`
- **Logs:** JSON format in `logs/` directory

### Client Process

- **Mode:** Fork (single instance)
- **Memory limit:** 512MB
- **Served by:** `npx serve -s client/dist`

### Common PM2 Commands

```bash
# Start
pm2 start ecosystem.config.cjs --env production

# Monitor
pm2 monit

# Logs
pm2 logs ln-educacional-server
pm2 logs ln-educacional-client

# Restart
pm2 restart all

# Reload (zero-downtime)
pm2 reload ln-educacional-server

# Status
pm2 status
```

## Key Client Libraries

| Library | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management and caching |
| `react-hook-form` + `@hookform/resolvers` | Form management with Zod validation |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client (configured with base URL and credentials) |
| `@radix-ui/*` | Accessible UI primitives (30+ packages) |
| `@tiptap/*` | Rich text editor for blog posts |
| `recharts` | Charts for admin analytics |
| `framer-motion` | Animations and transitions |
| `sonner` | Toast notifications |
| `lucide-react` | Icon library |
| `class-variance-authority` | Component variant management |
| `tailwind-merge` | Merge Tailwind classes without conflicts |
| `date-fns` | Date formatting and manipulation |
| `react-imask` | Input masking (CPF, phone, etc.) |
| `react-google-recaptcha` | reCAPTCHA integration for forms |
| `embla-carousel-react` | Carousel/slider component |
| `@hello-pangea/dnd` + `@dnd-kit/*` | Drag and drop (module/lesson reordering) |
| `vaul` | Drawer component |
| `use-debounce` | Debounced search inputs |
| `react-day-picker` | Date picker component |
| `react-resizable-panels` | Resizable panel layouts |
| `qrcode` (server) | QR code generation for certificates |

## Key Server Libraries

| Library | Purpose |
|---------|---------|
| `fastify` | HTTP server framework |
| `@fastify/cookie` | Cookie parsing and setting |
| `@fastify/cors` | CORS handling |
| `@fastify/helmet` | Security headers |
| `@fastify/jwt` | JWT plugin |
| `@fastify/multipart` | File upload handling |
| `@fastify/rate-limit` | Rate limiting (available but using custom AntiSpam instead) |
| `@fastify/static` | Static file serving (available) |
| `@fastify/compress` | Response compression (available) |
| `@prisma/client` | Database ORM |
| `ioredis` | Redis client |
| `argon2` | Password hashing |
| `jsonwebtoken` | JWT signing and verification |
| `zod` | Schema validation |
| `qrcode` | QR code generation |
| `axios` | HTTP client for Asaas API |

## Build Script

The `build.sh` script builds both workspaces sequentially:

```bash
bash build.sh
# Equivalent to:
# cd server && npm run build && cd ..
# cd client && npm run build && cd ..
```

## Deployment Script

PM2 deployment configuration supports two environments:

- **production:** Deploys from `origin/main` to `/var/www/ln-educacional`
- **staging:** Deploys from `origin/develop` to `/var/www/ln-educacional-staging`

Post-deploy: `npm install && npm run build && pm2 reload ecosystem.config.cjs`
