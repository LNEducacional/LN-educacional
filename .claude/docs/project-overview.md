---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Project Overview

## What is LN Educacional?

LN Educacional is a Brazilian educational platform (edtech) that provides academic papers, ebooks, online courses, and custom academic writing services. The platform targets Brazilian students and academic professionals, offering both free and paid educational content.

**Production domain:** `lneducacional.com.br`

## Business Model

The platform monetizes through:

1. **Ready-Made Academic Papers** -- Pre-written articles, theses, dissertations, reviews, and more, available for immediate purchase and download.
2. **Custom Academic Papers** -- Students submit requests with specific requirements (topic, page count, urgency, academic area), receive a quote from administrators, and once approved, a custom paper is produced.
3. **Ebooks & Guides** -- Downloadable ebooks across various academic disciplines.
4. **Online Courses** -- Structured courses with modules, video lessons, attachments, progress tracking, and certificates upon completion.

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Monorepo** | npm workspaces (`server/`, `client/`) |
| **Server** | Node.js + Fastify 4 + TypeScript |
| **Database** | PostgreSQL 16 via Prisma ORM |
| **Cache** | Redis 7 (ioredis) |
| **Client** | React 19 + Vite 5 + TailwindCSS 3 |
| **UI Components** | Radix UI + shadcn/ui patterns |
| **State Management** | React Context (Auth, Cart, Favorites) + TanStack React Query |
| **Payments** | Asaas (Brazilian payment gateway -- PIX, Boleto, Credit Card) |
| **Rich Text** | TipTap editor (blog posts) |
| **Auth** | JWT (access + refresh tokens) via HTTP-only cookies |
| **Linting** | Biome |
| **Deployment** | Docker Compose + Nginx + PM2 + Let's Encrypt SSL |
| **Process Manager** | PM2 (cluster mode for server, fork for client) |

## Repository Structure

```
ln-educacional/
  package.json            # Root monorepo config (npm workspaces)
  biome.json              # Shared linter/formatter config
  docker-compose.yaml     # Full production stack
  Dockerfile.server       # Server container
  Dockerfile.client       # Client container (Nginx-served)
  ecosystem.config.cjs    # PM2 production config
  build.sh                # Build script for both workspaces
  nginx/                  # Nginx configuration files
  server/
    package.json
    prisma/schema.prisma  # Database schema (30+ models)
    src/
      index.ts            # Server entry point
      app.ts              # Fastify app builder (plugins, auth, routes)
      auth.ts             # JWT auth logic (argon2 hashing)
      prisma.ts           # Prisma client + data access functions
      redis.ts            # Redis caching layer
      routes/             # API route modules
      services/           # Business logic services
  client/
    package.json
    src/
      main.tsx            # React entry point
      app.tsx             # Root component (providers, lazy routing)
      routes/             # Route definitions with code splitting
      pages/              # Page components (public, student, admin)
      components/         # Reusable UI components
      context/            # React Context providers
      services/           # API client (axios)
      lib/                # Utilities
```

## Key User Roles

| Role | Description |
|------|------------|
| **STUDENT** | Default role. Can browse content, purchase papers/ebooks/courses, access student dashboard, track orders, request custom papers. |
| **ADMIN** | Full access. Manages all content (papers, ebooks, courses, blog), processes orders, reviews collaborator applications, manages custom paper requests, views analytics. |
| **COLLABORATOR** | Applied collaborators. Can access a limited portal to check application status and upload documents. |

## Key Pages

**Public:** Home, Free Papers, Ready Papers, Custom Papers, Courses, Ebooks, Blog, Contact, Collaborator Application, Testimonials

**Student Portal:** Dashboard, My Courses (with video player), My Orders, Library, Custom Papers (messaging), Certificates, Profile, Downloads

**Admin Panel:** Dashboard, Ready Papers CRUD, Free Papers CRUD, Ebooks CRUD, Courses CRUD (with module/lesson management), Blog Posts CRUD (TipTap editor), Orders Management, Collaborator Applications (pipeline with evaluations/interviews), Custom Papers Management, User Management, API Integrations, Analytics, Newsletter Management
