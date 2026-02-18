---
type: doc
name: architecture
description: System architecture, layers, patterns, and design decisions
category: architecture
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Architecture Notes

## System Overview

LN Educacional follows a classic client-server architecture with a clear separation between the React SPA frontend and the Fastify REST API backend. Both are managed as npm workspaces within a single monorepo.

```
                         +-------------------+
                         |     Nginx (SSL)   |
                         |  Reverse Proxy    |
                         +--------+----------+
                                  |
                  +---------------+----------------+
                  |                                 |
         +--------v--------+            +----------v---------+
         |  Client (React) |            |   Server (Fastify) |
         |  Port 3000      |            |   Port 3333        |
         |  Served by Nginx|            +----------+---------+
         +-----------------+                       |
                                       +-----------+-----------+
                                       |                       |
                                +------v------+        +-------v------+
                                | PostgreSQL  |        |    Redis     |
                                | Port 5432   |        |  Port 6379   |
                                +-------------+        +--------------+
```

## Server Architecture

### Entry Points

- `server/src/index.ts` -- Creates the Fastify instance and starts listening on PORT (default 3333).
- `server/src/app.ts` -- The `build()` function that configures all Fastify plugins, decorators, auth routes, and registers all domain routes.

### Plugin Registration Order

1. **Helmet** -- Security headers (CSP disabled for frontend compatibility)
2. **CORS** -- Configurable allowed origins (env-based)
3. **Cookie** -- Signed cookies with secret
4. **JWT** -- Token extraction from `token` cookie
5. **Multipart** -- File upload handling (50MB limit, up to 5 files)
6. **Route registration** -- All domain routes via `registerAllRoutes`

### Authentication Decorators

The app decorates two Fastify hooks:

- `app.authenticate` -- Extracts JWT from `token` cookie, verifies it, and attaches `request.currentUser`.
- `app.requireAdmin` -- Checks `request.currentUser.role === 'ADMIN'`, returns 403 otherwise.

Routes use these as `preHandler` hooks: `{ preHandler: [app.authenticate] }` or `{ preHandler: [app.authenticate, app.requireAdmin] }`.

### Data Access Layer

`server/src/prisma.ts` serves dual purposes:

1. **Prisma client singleton** -- Uses the global singleton pattern to prevent multiple instances in development.
2. **Data access functions** -- Contains query functions for Papers, Courses, Ebooks, Orders, Library items. These functions encapsulate Prisma queries with filtering, pagination, and business logic.

### Caching Layer

`server/src/redis.ts` provides a graceful Redis wrapper:

- **Lazy connection** -- Redis connects only when first accessed.
- **Graceful degradation** -- If Redis is unavailable, operations silently return null/void. The application continues to function without cache.
- **Key operations:** `setCache(key, value, ttlSeconds)`, `getCache<T>(key)`, `deleteCache(key)`, `deleteCachePattern(pattern)`.
- **Default TTL:** 300 seconds (5 minutes).

### Service Layer

Services encapsulate business logic and external integrations:

| Service | File | Purpose |
|---------|------|---------|
| `AsaasService` | `asaas.service.ts` | Payment gateway integration (customers, charges, PIX QR codes, refunds) |
| `EmailService` | `email.service.ts` | Multi-provider email (console, SendGrid, Resend, Nodemailer) with newsletter templates |
| `NotificationService` | `notification.service.ts` | Email + webhook (Discord/Slack) + WebSocket notifications |
| `AntiSpamService` | `anti-spam.service.ts` | Rate limiting, content analysis, honeypot, IP blacklisting |
| `AutoReplyService` | `auto-reply.service.ts` | Keyword-based auto-reply templates for contact messages |
| `UploadService` | `upload.service.ts` | File upload handling with folder organization and validation |
| `CustomPaperService` | `custom-paper.service.ts` | Custom paper workflow management |
| `CustomPaperMessageService` | `custom-paper-message.service.ts` | Messaging system for custom papers |
| `CourseContentService` | `course-content.service.ts` | Course module and lesson management |

### Route Modules

Routes are organized by domain in `server/src/routes/`:

- `payments.ts` -- Checkout flow, payment status, Asaas webhook
- `courses.ts` -- Course CRUD and enrollment
- `custom-papers.ts` -- Student-facing custom paper requests
- `admin/custom-papers.ts` -- Admin-facing custom paper management
- `analytics.ts` -- Download tracking and analytics
- `notifications.ts` -- Notification management
- `newsletter.ts` -- Newsletter subscription and sending

## Client Architecture

### Component Hierarchy

```
<BrowserRouter>
  <QueryClientProvider>        // TanStack React Query (5min stale, 10min GC)
    <AuthProvider>             // JWT auth state management
      <CartProvider>           // Shopping cart state
        <FavoritesProvider>    // Favorites state
          <Suspense>
            <AppRoutes />      // Lazy-loaded route tree
          </Suspense>
          <Toaster />          // Sonner toast notifications
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
</BrowserRouter>
```

### Code Splitting Strategy

All pages are lazy-loaded via `React.lazy()` in `client/src/routes/lazy-routes.tsx`. Admin pages use webpack magic comments for prefetching (`/* webpackPrefetch: true */`). This keeps the initial bundle small while preloading admin pages for authenticated users.

### State Management Patterns

1. **Server state:** TanStack React Query for all API data (papers, courses, ebooks, orders). Configured with 5-minute stale time and 10-minute garbage collection.
2. **Auth state:** React Context (`AuthProvider`) manages user session, login, logout, registration.
3. **Cart state:** React Context (`CartProvider`) manages shopping cart items.
4. **Favorites state:** React Context (`FavoritesProvider`) manages user favorites.
5. **Form state:** React Hook Form + Zod validation for all forms.

### UI Library

The client uses a shadcn/ui-inspired approach:

- **Radix UI primitives** for accessible, unstyled components (Dialog, Dropdown, Tabs, etc.)
- **TailwindCSS** for styling with `class-variance-authority` for component variants
- **Lucide React** for icons
- **Framer Motion** for animations
- **Recharts** for admin analytics charts
- **TipTap** for rich text editing in blog posts

## Database Design

The Prisma schema (`server/prisma/schema.prisma`) defines 30+ models organized around these domains:

- **Users & Auth:** User (with roles), password reset tokens
- **Products:** Paper, Course (with CourseModule, CourseLesson), Ebook (with EbookFile)
- **Commerce:** Order, OrderItem, Library, Certificate, DownloadTracking
- **Custom Papers:** CustomPaper, CustomPaperMessage (student-admin messaging)
- **Blog:** BlogPost, Category, Tag, BlogTag, Comment, Like, PostAnalytics
- **Collaborators:** CollaboratorApplication, Evaluation, Note, Interview
- **Communication:** Message, MessageTemplate, NewsletterSubscriber, NewsletterSubscription, PostNotification
- **System:** SystemSetting, LegalDocument, ApiIntegration

### Key Design Decisions

- **Prices stored in cents (integers)** -- Avoids floating-point precision issues. Converted to reais (BRL) at display and payment time.
- **CUID identifiers** -- All primary keys use `@default(cuid())` for URL-safe, sortable IDs.
- **Soft references in OrderItem** -- Each OrderItem can reference a Paper, Course, or Ebook via optional foreign keys.
- **Cascade deletes** -- Used selectively (e.g., CourseModule -> CourseLesson, BlogPost -> Comments/Likes).
- **Composite unique constraints** -- CourseProgress (userId, lessonId), CourseEnrollment (userId, courseId), Like (postId, userId).

## Deployment Architecture

### Docker Compose Stack

The production stack consists of 5 containers:

1. **postgres** -- PostgreSQL 16 Alpine with health checks
2. **redis** -- Redis 7 Alpine with AOF persistence and 256MB LRU eviction
3. **server** -- Fastify API (depends on postgres + redis healthy)
4. **client** -- React SPA served by Nginx (depends on server)
5. **nginx** -- Reverse proxy with SSL termination (Let's Encrypt via Certbot)
6. **certbot** -- Auto-renewing SSL certificates (12-hour renewal loop)

### PM2 Configuration

For non-Docker deployments, PM2 manages processes:

- **Server:** Cluster mode (`instances: 'max'`), 1GB memory limit, JSON logging, auto-restart
- **Client:** Fork mode (single instance), served via `npx serve`, 512MB memory limit
