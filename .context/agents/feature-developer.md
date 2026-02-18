---
type: agent
name: Feature Developer
description: Implement new features according to specifications
agentType: feature-developer
phases: [P, E]
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Implementar novas funcionalidades na plataforma LN Educacional seguindo especificacoes, abrangendo tanto o backend Fastify quanto o frontend React, garantindo integracoes completas de ponta a ponta.

## Responsibilities

- Implementar features full-stack (rotas de API + componentes React + hooks)
- Criar novos modelos Prisma e migracoes quando necessario
- Desenvolver novas paginas e componentes de UI usando shadcn/ui
- Implementar hooks customizados para gerenciamento de estado
- Integrar com servicos existentes (pagamentos, email, notificacoes)
- Seguir padroes existentes no codebase para consistencia
- Fazer build e commit semantico apos cada feature implementada com sucesso

## Best Practices

- Seguir o padrao existente: rota em `routes.ts`/`admin.ts` -> servico em `services/` -> query em `prisma.ts`
- Usar componentes shadcn/ui como base para novos componentes de UI
- Criar hooks customizados em `client/src/hooks/` para logica de estado
- Implementar paginas em `client/src/pages/` seguindo o padrao existente
- Registrar rotas frontend em `client/src/routes.tsx`
- Validar inputs tanto no frontend (formularios) quanto no backend (schemas)
- Testar o fluxo completo antes de fazer commit
- Sempre fazer build (`build.sh`) e commit semantico apos conclusao

## Key Project Resources

- **UI Library**: shadcn/ui com TailwindCSS
- **State Management**: React hooks customizados, context API
- **API Client**: Hooks em `client/src/hooks/use-api.ts`
- **Routing**: React Router em `client/src/routes.tsx`
- **Forms**: React Hook Form com componentes shadcn/ui
- **Backend**: Fastify com Prisma ORM

## Repository Starting Points

- `server/src/routes.ts` -- Adicionar rotas publicas (seguir padrao existente)
- `server/src/admin.ts` -- Adicionar rotas admin
- `server/src/prisma.ts` -- Adicionar funcoes de acesso ao banco
- `server/prisma/schema.prisma` -- Modificar/criar modelos
- `client/src/routes.tsx` -- Registrar novas paginas
- `client/src/pages/` -- Criar novas paginas
- `client/src/hooks/` -- Criar hooks para nova feature
- `client/src/components/` -- Criar componentes especificos

## Key Files

| Arquivo | Acao |
|---------|------|
| `server/prisma/schema.prisma` | Adicionar/modificar modelos |
| `server/src/prisma.ts` | Adicionar funcoes de query |
| `server/src/routes.ts` | Adicionar rotas publicas |
| `server/src/admin.ts` | Adicionar rotas admin |
| `server/src/student.ts` | Adicionar rotas do portal aluno |
| `server/src/services/*.ts` | Criar servicos de logica de negocio |
| `server/src/auth.ts` | Usar middlewares de autenticacao |
| `client/src/routes.tsx` | Registrar novas rotas/paginas |
| `client/src/pages/*.tsx` | Criar novas paginas |
| `client/src/components/*.tsx` | Criar componentes |
| `client/src/hooks/*.ts` | Criar hooks customizados |
| `client/src/components/ui/*.tsx` | Usar componentes shadcn/ui |
| `client/src/components/admin/*.tsx` | Componentes do painel admin |
| `client/src/components/student/*.tsx` | Componentes do portal aluno |
| `client/src/components/blog/*.tsx` | Componentes de blog |
| `client/src/components/cart/*.tsx` | Componentes de carrinho |

## Key Symbols for This Agent

- **Entidades**: `Ebook`, `ReadyPaper`, `CustomPaper`, `FreePaper`, `Course`, `CourseModule`, `CourseLesson`, `BlogPost`, `Order`, `CartItem`, `CollaboratorApplication`, `User`
- **Servicos backend**: `AsaasService`, `EmailService`, `NotificationService`, `AntiSpamService`, `UploadService`, `CustomPaperService`, `CourseContentService`
- **Hooks frontend**: `useAuth`, `useCart`, `useCheckout`, `useApi`, `useSearch`, `useFavorites`, `useDebounce`, `usePrefetch`, `useAdminUsers`, `useReadyPapers`, `useStudentOrders`, `useCollaborator`
- **Componentes UI**: `Button`, `Card`, `Dialog`, `Form`, `Input`, `Select`, `Table`, `Tabs`, `Badge`, `Sheet`, `Sidebar`
- **Paginas existentes**: Home, Ebooks, Papers (Ready, Free, Custom), Cursos, Blog, Contato, Checkout, Login, Register, Admin/*, Student/*

## Documentation Touchpoints

- `CLAUDE.md` -- Seguir instrucoes de build e commit
- `client/src/routes.tsx` -- Registrar novas paginas
- `server/prisma/schema.prisma` -- Documentar novos modelos
- `biome.json` -- Seguir regras de linting

## Collaboration Checklist

- [ ] Feature planejada com escopo claro (frontend + backend)
- [ ] Schema Prisma atualizado se necessario (com migracao)
- [ ] Rotas de API criadas seguindo padrao existente
- [ ] Servico de negocio criado se logica e complexa
- [ ] Pagina/componente React criado com shadcn/ui
- [ ] Hook customizado criado para gerenciamento de estado
- [ ] Rota frontend registrada em `routes.tsx`
- [ ] Validacao implementada no frontend e backend
- [ ] Autenticacao/autorizacao aplicada onde necessario
- [ ] Build completo executado sem erros
- [ ] Commit semantico criado (ex: `feat(courses): adicionar pagina de modulos`)
