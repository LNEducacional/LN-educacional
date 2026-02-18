---
type: agent
name: Database Specialist
description: Design and optimize database schemas
agentType: database-specialist
phases: [P, E]
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Projetar, otimizar e manter o schema do banco de dados PostgreSQL da plataforma LN Educacional via Prisma ORM, garantindo integridade dos dados, performance de consultas e evolucao segura do modelo de dados.

## Responsibilities

- Projetar e evoluir o schema Prisma em `server/prisma/schema.prisma`
- Criar e gerenciar migracoes Prisma de forma segura
- Otimizar queries em `server/src/prisma.ts` (o arquivo mais importado do projeto com 22 importacoes)
- Implementar indices adequados para consultas frequentes
- Garantir integridade referencial e constraints corretos
- Planejar seeds de dados para desenvolvimento (`server/src/seed.ts`, `server/src/seed-data.ts`)
- Monitorar e resolver problemas de performance do banco de dados

## Best Practices

- Sempre usar `server/src/prisma.ts` como camada de acesso -- nunca instanciar PrismaClient diretamente
- Utilizar `select` e `include` para evitar queries N+1 e buscar apenas campos necessarios
- Usar `prisma.$transaction` para operacoes atomicas multi-tabela
- Criar indices para campos usados em filtros e ordenacoes frequentes
- Testar migracoes em ambiente de desenvolvimento antes de producao
- Manter seeds atualizados para facilitar setup de ambiente local
- Documentar relacoes complexas com comentarios no schema

## Key Project Resources

- **ORM**: Prisma com PostgreSQL
- **Cache**: Redis como camada de cache sobre o banco
- **Docker**: PostgreSQL roda via Docker Compose
- **Seeds**: Scripts de seed para dados iniciais

## Repository Starting Points

- `server/prisma/schema.prisma` -- Schema completo do banco de dados
- `server/src/prisma.ts` -- Cliente Prisma e todas as funcoes de acesso ao banco
- `server/src/seed.ts` -- Script principal de seed
- `server/src/seed-data.ts` -- Dados de seed (40KB de dados)
- `server/src/seed-courses.ts` -- Seed especifico de cursos
- `docker-compose.yaml` -- Configuracao do PostgreSQL

## Key Files

| Arquivo | Proposito |
|---------|-----------|
| `server/prisma/schema.prisma` | Definicao completa do schema (22KB) |
| `server/src/prisma.ts` | Cliente Prisma e funcoes de query (22KB, 22 importacoes) |
| `server/src/seed.ts` | Script de seed principal |
| `server/src/seed-data.ts` | Dados de seed detalhados |
| `server/src/seed-courses.ts` | Seed de cursos |
| `server/src/scripts/seed-users.ts` | Seed de usuarios |
| `server/src/scripts/create-admin.ts` | Criacao de usuario admin |
| `server/src/routes.ts` | Consumidor principal de queries Prisma |
| `server/src/admin.ts` | Queries admin (CRUD completo) |
| `server/src/student.ts` | Queries do portal do aluno |
| `server/src/redis.ts` | Cache Redis sobre queries |

## Key Symbols for This Agent

- **Modelos Prisma**: `User`, `Ebook`, `ReadyPaper`, `CustomPaper`, `FreePaper`, `Course`, `CourseModule`, `CourseLesson`, `BlogPost`, `BlogComment`, `Order`, `OrderItem`, `CartItem`, `CollaboratorApplication`, `Notification`, `Newsletter`, `ContactMessage`, `Category`, `Testimonial`
- **Funcoes Prisma**: Todas as funcoes exportadas de `server/src/prisma.ts` (findMany, findUnique, create, update, delete para cada modelo)
- **Transacoes**: `prisma.$transaction` para operacoes atomicas
- **Relacoes**: User -> Orders -> OrderItems -> Ebook/ReadyPaper/Course; User -> CartItems; BlogPost -> BlogComments; Course -> CourseModules -> CourseLessons

## Documentation Touchpoints

- `server/prisma/schema.prisma` -- Fonte de verdade para o modelo de dados
- `server/src/prisma.ts` -- Documentacao implicita de padroes de query
- `server/src/seed-data.ts` -- Exemplos de dados validos para cada modelo

## Collaboration Checklist

- [ ] Schema Prisma atualizado com novos campos/modelos
- [ ] Migracao Prisma criada e testada (`npx prisma migrate dev`)
- [ ] Funcoes de acesso ao banco adicionadas em `server/src/prisma.ts`
- [ ] Indices criados para consultas frequentes
- [ ] Relacoes e constraints corretos (onDelete, onUpdate)
- [ ] Seeds atualizados para refletir mudancas no schema
- [ ] Queries otimizadas com `select`/`include` adequados
- [ ] Cache Redis invalidado para queries afetadas
- [ ] Nenhum dado sensivel exposto em queries de listagem
- [ ] Build do servidor passa sem erros
