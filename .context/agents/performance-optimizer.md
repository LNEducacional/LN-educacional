---
type: agent
name: Performance Optimizer
description: Identify performance bottlenecks
agentType: performance-optimizer
phases: [E, V]
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Identificar e resolver gargalos de performance na plataforma LN Educacional, otimizando tanto o servidor Fastify quanto o cliente React para proporcionar experiencia rapida e fluida.

## Responsibilities

- Identificar queries Prisma lentas ou ineficientes (N+1, falta de indices)
- Otimizar estrategia de cache Redis para reduzir carga no banco
- Reduzir bundle size do frontend com code splitting e tree shaking
- Implementar lazy loading de componentes e imagens
- Otimizar Nginx para compressao e cache de estaticos
- Monitorar metricas de performance (TTFB, LCP, FID, CLS)
- Otimizar build de producao (Vite config, Docker multi-stage)

## Best Practices

- Usar `select` em queries Prisma para buscar apenas campos necessarios
- Aplicar cache Redis com TTL adequado para listagens frequentes (ebooks, cursos, papers)
- Invalidar cache Redis cirurgicamente -- nao invalidar tudo em toda mutacao
- Code splitting agressivo em `client/src/routes.tsx` com `React.lazy`
- Usar `useMemo` e `useCallback` para evitar re-renders em listas grandes
- Compressao gzip/brotli no Nginx para respostas de API e estaticos
- Otimizar imagens com `OptimizedImage` e `LazyImage` components
- Prefetch de dados com `use-prefetch.ts` para navegacao antecipada

## Key Project Resources

- **Cache**: Redis com utilitarios em `server/src/redis.ts`
- **Banco**: Prisma ORM com PostgreSQL
- **Bundler**: Vite com configuracao de chunk splitting
- **Proxy**: Nginx com compressao e cache
- **Monitoramento**: `scripts/monitoring.sh`

## Repository Starting Points

- `server/src/prisma.ts` -- Queries do banco (22KB, alvo principal de otimizacao)
- `server/src/redis.ts` -- Estrategia de cache
- `server/src/routes.ts` -- Rotas com potencial de otimizacao (122KB)
- `client/vite.config.ts` -- Configuracao de build e otimizacao
- `client/src/routes.tsx` -- Lazy loading de paginas
- `config/nginx.conf` -- Cache e compressao Nginx

## Key Files

| Arquivo | Tipo de Otimizacao |
|---------|-------------------|
| `server/src/prisma.ts` | Queries: select, include, indices, paginacao |
| `server/src/redis.ts` | Cache: TTL, invalidacao, estrategia |
| `server/src/routes.ts` | API: respostas menores, paginacao, cache |
| `server/src/admin.ts` | Admin: queries pesadas, listagens grandes |
| `client/vite.config.ts` | Build: chunks, tree shaking, minificacao |
| `client/src/routes.tsx` | Frontend: lazy loading de paginas |
| `client/src/components/optimized-image.tsx` | Imagens: lazy, responsive, formatos |
| `client/src/components/ui/lazy-image.tsx` | Lazy loading de imagens |
| `client/src/components/lazy-wrapper.tsx` | Lazy loading generico |
| `client/src/components/progressive-hydration.tsx` | Hydration progressiva |
| `client/src/components/concurrent-list.tsx` | Renderizacao concorrente de listas |
| `client/src/components/streaming-components.tsx` | Streaming SSR components |
| `client/src/hooks/use-prefetch.ts` | Prefetch de dados |
| `client/src/hooks/use-debounce.ts` | Debounce para busca |
| `client/src/hooks/use-optimistic.ts` | Atualizacoes otimistas |
| `client/src/components/skeletons/card-skeleton.tsx` | Skeleton loading |
| `config/nginx.conf` | Compressao, cache de estaticos |
| `nginx.conf` | Gzip, headers de cache |
| `server/src/plugins/compression.ts` | Compressao de respostas API |
| `scripts/monitoring.sh` | Monitoramento de performance |

## Key Symbols for This Agent

- **Cache Redis**: `getCache`, `setCache`, `invalidateCache`, `cacheMiddleware`
- **Prisma**: `select`, `include`, `take`, `skip`, `orderBy`, `where` -- otimizacao de queries
- **React**: `React.lazy`, `Suspense`, `useMemo`, `useCallback`, `useTransition`
- **Componentes**: `OptimizedImage`, `LazyImage`, `LazyWrapper`, `ProgressiveHydration`, `ConcurrentList`, `CardSkeleton`
- **Hooks**: `usePrefetch`, `useDebounce`, `useOptimistic`
- **Vite**: `manualChunks`, `rollupOptions`, chunk splitting
- **Nginx**: `gzip`, `brotli`, `expires`, `Cache-Control`

## Documentation Touchpoints

- `client/vite.config.ts` -- Documentar estrategia de splitting
- `server/src/redis.ts` -- Documentar TTLs e politica de cache
- `config/nginx.conf` -- Documentar regras de cache
- `CLAUDE.md` -- Convencoes de build

## Collaboration Checklist

- [ ] Queries Prisma usam `select` para limitar campos retornados
- [ ] Cache Redis implementado para listagens frequentes
- [ ] Cache Redis invalidado corretamente em mutacoes
- [ ] Lazy loading aplicado em paginas e componentes pesados
- [ ] Bundle size verificado (nenhum chunk > 200KB)
- [ ] Imagens otimizadas e com lazy loading
- [ ] Compressao ativa no Nginx e/ou no servidor
- [ ] Paginacao implementada em listagens grandes
- [ ] Debounce aplicado em buscas e filtros
- [ ] Metricas de Web Vitals dentro dos limites aceitaveis
- [ ] Build de producao otimizado
- [ ] Commit semantico criado (ex: `perf(api): otimizar query de listagem de ebooks`)
