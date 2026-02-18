---
type: agent
name: Test Writer
description: Write comprehensive unit and integration tests
agentType: test-writer
phases: [E, V]
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Escrever testes unitarios e de integracao abrangentes para a plataforma LN Educacional, cobrindo servicos do backend, rotas da API, componentes React e fluxos criticos de negocio.

## Responsibilities

- Escrever testes unitarios para servicos do backend (`server/src/services/`)
- Criar testes de integracao para rotas da API
- Testar componentes React com testes de renderizacao e interacao
- Cobrir fluxos criticos: autenticacao, checkout, pagamento, entrega de conteudo
- Testar validacoes de input e tratamento de erros
- Implementar mocks para servicos externos (Asaas, email, Redis)
- Manter cobertura de testes em nivel adequado para areas criticas

## Best Practices

- Priorizar testes para areas criticas: pagamentos, autenticacao, dados de usuario
- Usar mocks para dependencias externas (Asaas API, SMTP, Redis)
- Testar cenarios de sucesso E de erro em cada rota/servico
- Nomear testes de forma descritiva em portugues
- Manter testes independentes -- sem dependencia de ordem de execucao
- Usar factories/fixtures para criar dados de teste consistentes
- Testar componentes React com foco em comportamento, nao implementacao
- Seguir padrao AAA (Arrange, Act, Assert) em cada teste

## Key Project Resources

- **Test Runner**: Vitest (configurado em `client/vitest.config.ts`)
- **E2E**: Playwright (specs em `e2e/`)
- **React Testing**: Testing Library
- **Mocking**: Vi mocks para servicos e modulos
- **Dados**: Seeds em `server/src/seed-data.ts` como referencia

## Repository Starting Points

- `server/src/services/` -- Servicos de negocio para testar unitariamente
- `server/src/routes.ts` -- Rotas publicas para testes de integracao
- `server/src/admin.ts` -- Rotas admin para testes com autenticacao
- `server/src/auth.ts` -- Autenticacao para testes criticos
- `client/src/hooks/` -- Hooks para testes unitarios
- `client/src/pages/` -- Paginas para testes de renderizacao
- `client/src/components/` -- Componentes para testes de UI

## Key Files

| Arquivo | O Que Testar |
|---------|--------------|
| `server/src/services/asaas.service.ts` | Criacao de pagamento, webhook processing, status updates |
| `server/src/services/email.service.ts` | Envio de email, templates, tratamento de erros |
| `server/src/services/notification.service.ts` | Criacao e entrega de notificacoes |
| `server/src/services/anti-spam.service.ts` | Deteccao de spam, rate limiting |
| `server/src/services/upload.service.ts` | Validacao de arquivo, upload, path safety |
| `server/src/services/custom-paper.service.ts` | Fluxo de papers personalizados |
| `server/src/services/course-content.service.ts` | Gestao de conteudo de cursos |
| `server/src/auth.ts` | Login, registro, JWT, middlewares |
| `server/src/prisma.ts` | Funcoes de query (com mock do Prisma) |
| `server/src/routes.ts` | Endpoints publicos (integracao) |
| `server/src/admin.ts` | Endpoints admin com autorizacao |
| `server/src/student.ts` | Portal do aluno |
| `server/src/redis.ts` | Cache get/set/invalidate |
| `client/src/hooks/use-auth.ts` | Fluxo de autenticacao frontend |
| `client/src/hooks/use-cart.ts` | Adicionar, remover, calcular total |
| `client/src/hooks/use-checkout.ts` | Fluxo completo de checkout |
| `client/src/hooks/use-api.ts` | Chamadas de API, tratamento de erros |
| `client/src/components/cart/cart-drawer.tsx` | Renderizacao do carrinho |
| `client/src/components/cart/cart-item.tsx` | Item do carrinho |
| `client/src/pages/checkout.tsx` | Pagina de checkout |
| `client/src/pages/login.tsx` | Pagina de login |
| `client/src/components/error-boundary.tsx` | Error boundary |
| `server/src/validations/ebook.ts` | Validacao de ebook |

## Key Symbols for This Agent

- **Servicos testáveis**: `AsaasService`, `EmailService`, `NotificationService`, `AntiSpamService`, `UploadService`, `CustomPaperService`, `CourseContentService`, `AutoReplyService`
- **Auth**: `verifyToken`, `authenticate`, `hashPassword`, `comparePassword`
- **Prisma (mock)**: `prisma.ebook.findMany`, `prisma.user.create`, `prisma.$transaction`
- **Redis (mock)**: `getCache`, `setCache`, `invalidateCache`
- **Hooks (test)**: `useAuth`, `useCart`, `useCheckout`, `useApi`
- **Modelos de dados**: `User`, `Ebook`, `ReadyPaper`, `CustomPaper`, `Course`, `Order`, `BlogPost`

## Documentation Touchpoints

- `client/vitest.config.ts` -- Configuracao do Vitest
- `server/src/seed-data.ts` -- Dados de exemplo para fixtures
- `server/prisma/schema.prisma` -- Modelo de dados para criar mocks
- `CLAUDE.md` -- Convencoes de commit

## Collaboration Checklist

- [ ] Testes cobrem cenarios de sucesso e erro
- [ ] Servicos externos mockados (Asaas, SMTP, Redis)
- [ ] Prisma client mockado para testes unitarios
- [ ] Testes de autenticacao cobrem login, registro, token invalido
- [ ] Testes de pagamento cobrem criacao, webhook, falhas
- [ ] Componentes React testados com Testing Library
- [ ] Hooks testados com renderHook
- [ ] Testes nomeados de forma descritiva
- [ ] Nenhum teste depende de estado externo ou ordem de execucao
- [ ] Build e testes passam sem erros
- [ ] Commit semantico criado (ex: `test(services): adicionar testes para AsaasService`)
