# Project Rules and Guidelines

> Auto-generated from .context/docs on 2026-02-02T19:55:04.412Z

## README

# Documentation Index

Welcome to the LN Educacional knowledge base. This documentation provides comprehensive coverage of the platform architecture, development workflow, and domain concepts.

## Quick Start

New to the project? Read these in order:

1. [Project Overview](./project-overview.md) -- What the platform does, tech stack, repository structure
2. [Architecture Notes](./architecture.md) -- System design, layers, services, deployment
3. [Development Workflow](./development-workflow.md) -- Setup, scripts, branching, deployment

## Core Guides

| Guide | Description |
|-------|------------|
| [Project Overview](./project-overview.md) | High-level overview of LN Educacional, its business model, tech stack, and key user roles |
| [Architecture Notes](./architecture.md) | Server/client architecture, service layer, database design, deployment stack |
| [Data Flow & Integrations](./data-flow.md) | Authentication flow, Asaas payment integration, custom paper workflow, email/notification pipelines |
| [Development Workflow](./development-workflow.md) | Setup instructions, available scripts, branching strategy, build and deployment |
| [Glossary & Domain Concepts](./glossary.md) | All domain entities (User, Paper, Course, Ebook, Order, etc.), enums, and business rules |
| [Security & Compliance Notes](./security.md) | JWT auth, HTTP security, anti-spam, file upload security, LGPD, known considerations |
| [Testing Strategy](./testing-strategy.md) | Current test state, quality gates, recommended testing approach, mocking guidelines |
| [Tooling & Productivity Guide](./tooling.md) | Biome, Vite, Prisma, Redis, Docker, PM2, key libraries reference |

## Repository Snapshot

```
ln-educacional/
  biome.json          # Shared linter/formatter configuration
  build.sh            # Build script for both workspaces
  CLAUDE.md           # AI assistant instructions
  client/             # React 19 + Vite + TailwindCSS frontend
  config/             # Additional configuration files
  docker-compose.yaml # Full production Docker stack
  Dockerfile.client   # Client container definition
  Dockerfile.server   # Server container definition
  ecosystem.config.cjs    # PM2 production configuration
  ecosystem.dev.config.cjs # PM2 development configuration
  nginx/              # Nginx reverse proxy configuration
  nginx.conf          # Main Nginx configuration
  package.json        # Root monorepo configuration
  scripts/            # Utility scripts
  server/             # Fastify + Prisma + Redis backend
  uploads/            # User-uploaded files (not in git)
```

## Key Entry Points

| File | Description |
|------|------------|
| `server/src/index.ts` | Server entry -- creates Fastify and starts listening |
| `server/src/app.ts` | App builder -- registers all plugins, auth, and routes |
| `server/src/auth.ts` | Authentication logic -- JWT, password hashing, login/register |
| `server/src/prisma.ts` | Database client and data access functions |
| `server/src/redis.ts` | Redis caching layer |
| `server/prisma/schema.prisma` | Database schema (30+ models) |
| `client/src/main.tsx` | React entry point |
| `client/src/app.tsx` | Root component with providers |
| `client/src/routes/lazy-routes.tsx` | All lazy-loaded page imports |
| `client/src/context/auth-context.tsx` | Authentication state management |


## qa/README

# Q&A Index

Project type: **library**

Generated: 2026-02-02T19:46:30.386Z

## Getting-started

- [How do I set up and run this project?](./getting-started.md)

## Architecture

- [How is the codebase organized?](./project-structure.md)

## Features

- [How does authentication work?](./authentication.md)
- [What API endpoints are available?](./api-endpoints.md)

## Operations

- [How does caching work?](./caching.md)
- [How are errors handled?](./error-handling.md)
- [How do background jobs work?](./background-jobs.md)
- [How do I deploy this project?](./deployment.md)

