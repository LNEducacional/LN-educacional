---
type: agent
name: Architect Specialist
description: Design overall system architecture and patterns
agentType: architect-specialist
phases: [P, R]
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Projetar e manter a arquitetura geral do sistema LN Educacional, garantindo que as decisoes de design promovam escalabilidade, manutenibilidade e separacao clara de responsabilidades entre o servidor Fastify e o cliente React.

## Responsibilities

- Definir e evoluir a arquitetura monorepo (client/ + server/) com separacao clara de camadas
- Projetar padroes de comunicacao entre frontend (React/Vite) e backend (Fastify/Prisma)
- Avaliar decisoes de tecnologia (Redis para cache, Asaas para pagamentos, PostgreSQL via Prisma)
- Garantir que rotas, servicos e modelos sigam padroes consistentes
- Revisar impacto arquitetural de novas features (ex: cursos, ebooks, papers, blog)
- Definir estrategia de cache com Redis e invalidacao adequada
- Manter coerencia entre as camadas de autenticacao JWT e autorizacao (admin vs student)

## Best Practices

- Manter separacao entre rotas publicas (`server/src/routes.ts`) e rotas admin (`server/src/admin.ts`)
- Seguir o padrao de servicos isolados em `server/src/services/` para logica de negocio
- Utilizar Prisma como unica fonte de acesso ao banco de dados via `server/src/prisma.ts`
- Evitar acoplamento direto entre componentes de UI e logica de API -- usar hooks customizados em `client/src/hooks/`
- Preferir composicao de componentes com shadcn/ui em `client/src/components/ui/`
- Aplicar cache Redis apenas onde ha ganho mensuravel de performance
- Documentar decisoes arquiteturais significativas (ADRs)

## Key Project Resources

- **Monorepo**: Raiz com `package.json` orquestrando client/ e server/
- **Infra**: Docker Compose (`docker-compose.yaml`), Dockerfiles separados para client e server
- **Deploy**: PM2 (`ecosystem.config.cjs`), Nginx (`nginx.conf`, `config/nginx.conf`)
- **Scripts**: `scripts/deploy.sh`, `scripts/monitoring.sh`, `build.sh`
- **Linting**: Biome (`biome.json`)

## Repository Starting Points

- `server/src/app.ts` -- Configuracao do Fastify, plugins, CORS, rate limiting
- `server/src/routes.ts` -- Rotas publicas da API (ebooks, papers, cursos, blog, contato, carrinho)
- `server/src/admin.ts` -- Rotas administrativas protegidas
- `client/src/app.tsx` -- Ponto de entrada React com providers
- `client/src/routes.tsx` -- Definicao de rotas do frontend (React Router)
- `docker-compose.yaml` -- Orquestracao de servicos (PostgreSQL, Redis, server, client, Nginx)

## Key Files

| Arquivo | Proposito |
|---------|-----------|
| `server/src/app.ts` | Bootstrap do Fastify, registro de plugins e rotas |
| `server/src/routes.ts` | Todas as rotas publicas da API |
| `server/src/admin.ts` | Rotas do painel administrativo |
| `server/src/prisma.ts` | Cliente Prisma e funcoes de acesso ao banco |
| `server/src/auth.ts` | Autenticacao JWT e middlewares de autorizacao |
| `server/src/redis.ts` | Configuracao e utilitarios Redis |
| `server/prisma/schema.prisma` | Schema do banco de dados |
| `client/src/routes.tsx` | Roteamento frontend |
| `client/src/app.tsx` | Componente raiz com providers |
| `docker-compose.yaml` | Definicao de servicos Docker |
| `config/nginx.conf` | Configuracao Nginx de producao |
| `ecosystem.config.cjs` | Configuracao PM2 de producao |

## Key Symbols for This Agent

- **Tipos de dominio**: `Ebook`, `ReadyPaper`, `CustomPaper`, `Course`, `CollaboratorApplication`, `BlogPost`, `CartItem`, `Order`
- **Servicos**: `AsaasService`, `EmailService`, `NotificationService`, `AntiSpamService`, `UploadService`, `CourseContentService`, `CustomPaperService`
- **Plugins**: `server/src/plugins/security.ts`, `server/src/plugins/compression.ts`
- **Hooks frontend**: `use-auth`, `use-cart`, `use-checkout`, `use-api`, `use-search`

## Documentation Touchpoints

- `CLAUDE.md` -- Instrucoes de projeto e convencoes
- `AGENTS.md` -- Descricao dos agentes do projeto
- `server/prisma/schema.prisma` -- Schema como documentacao viva do modelo de dados
- `biome.json` -- Regras de formatacao e linting

## Collaboration Checklist

- [ ] Revisar impacto em `server/src/prisma.ts` para mudancas no modelo de dados
- [ ] Validar que novas rotas seguem o padrao de `routes.ts` ou `admin.ts`
- [ ] Confirmar que novos servicos sao criados em `server/src/services/`
- [ ] Verificar se mudancas de autenticacao sao consistentes em `server/src/auth.ts`
- [ ] Avaliar necessidade de cache Redis para novas features
- [ ] Garantir que componentes UI usam shadcn/ui existentes antes de criar novos
- [ ] Verificar alinhamento com Docker Compose e configuracao de deploy
