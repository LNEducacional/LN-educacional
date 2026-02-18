---
type: agent
name: Frontend Specialist
description: Design and implement user interfaces
agentType: frontend-specialist
phases: [P, E]
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Projetar e implementar interfaces de usuario da plataforma LN Educacional com React, Vite e TailwindCSS, proporcionando experiencia fluida e responsiva para alunos, administradores e colaboradores.

## Responsibilities

- Desenvolver paginas e componentes React com TypeScript
- Utilizar e estender componentes shadcn/ui
- Implementar roteamento com React Router e lazy loading
- Criar hooks customizados para logica de estado e chamadas de API
- Garantir responsividade e acessibilidade
- Implementar otimizacoes de performance (code splitting, lazy images, memoizacao)
- Integrar com APIs do backend via hooks em `client/src/hooks/`
- Manter consistencia visual com TailwindCSS e tema do projeto

## Best Practices

- Usar componentes shadcn/ui como base -- nao reinventar componentes de UI
- Criar hooks customizados para logica reutilizavel
- Aplicar lazy loading para paginas e componentes pesados
- Usar `useMemo` e `useCallback` para evitar re-renders desnecessarios
- Manter componentes pequenos e com responsabilidade unica
- Seguir padroes de layout existentes (`MainLayout`, `AdminLayout`, `StudentLayout`)
- Testar em diferentes tamanhos de tela (mobile, tablet, desktop)
- Usar o hook `use-mobile.tsx` para deteccao de dispositivo

## Key Project Resources

- **Framework**: React 19 com TypeScript
- **Bundler**: Vite com otimizacoes de build
- **Styling**: TailwindCSS com configuracao personalizada
- **Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router com lazy loading
- **Icons**: Lucide React
- **Charts**: Recharts via componente Chart shadcn

## Repository Starting Points

- `client/src/main.tsx` -- Ponto de entrada React
- `client/src/app.tsx` -- Componente raiz com providers
- `client/src/routes.tsx` -- Definicao de todas as rotas com lazy loading
- `client/src/components/ui/` -- Componentes base shadcn/ui
- `client/src/pages/` -- Todas as paginas da aplicacao
- `client/src/hooks/` -- Hooks customizados

## Key Files

| Arquivo | Proposito |
|---------|-----------|
| `client/src/main.tsx` | Bootstrap React |
| `client/src/app.tsx` | Root component, providers |
| `client/src/routes.tsx` | Roteamento completo (lazy loading) |
| `client/src/index.css` | Estilos globais e variaveis CSS |
| `client/tailwind.config.ts` | Configuracao TailwindCSS |
| `client/vite.config.ts` | Configuracao Vite (proxy, plugins, build) |
| `client/components.json` | Configuracao shadcn/ui |
| `client/src/components/main-layout.tsx` | Layout principal do site |
| `client/src/components/ui/sidebar.tsx` | Sidebar reutilizavel (admin/student) |
| `client/src/components/ui/button.tsx` | Componente Button base |
| `client/src/components/ui/form.tsx` | Componente Form (React Hook Form) |
| `client/src/components/ui/table.tsx` | Componente Table |
| `client/src/components/ui/dialog.tsx` | Componente Dialog/Modal |
| `client/src/components/ui/card.tsx` | Componente Card |
| `client/src/components/ui/sheet.tsx` | Componente Sheet (drawer lateral) |
| `client/src/components/cart/cart-drawer.tsx` | Drawer do carrinho |
| `client/src/components/cart/cart-item.tsx` | Item do carrinho |
| `client/src/components/blog/*.tsx` | Componentes de blog (comments, likes, share) |
| `client/src/components/seo/*.tsx` | Meta tags e structured data |
| `client/src/components/admin/*.tsx` | Componentes do painel admin |
| `client/src/components/student/*.tsx` | Componentes do portal aluno |
| `client/src/components/collaborator/*.tsx` | Steps do formulario de colaborador |
| `client/src/components/islands/*.tsx` | Islands architecture components |
| `client/src/hooks/use-auth.ts` | Autenticacao e sessao |
| `client/src/hooks/use-cart.ts` | Gerenciamento do carrinho |
| `client/src/hooks/use-checkout.ts` | Fluxo de checkout |
| `client/src/hooks/use-api.ts` | Chamadas de API |
| `client/src/hooks/use-search.ts` | Busca global |
| `client/src/hooks/use-debounce.ts` | Debounce de valores |
| `client/src/hooks/use-prefetch.ts` | Prefetch de dados |
| `client/src/hooks/use-favorites.ts` | Favoritos |
| `client/src/hooks/use-toast.ts` | Notificacoes toast |
| `client/src/providers/theme-provider.tsx` | Tema dark/light |
| `client/src/components/error-boundary.tsx` | Error boundary |
| `client/src/components/loading-spinner.tsx` | Loading spinner |
| `client/src/components/optimized-image.tsx` | Imagem otimizada |
| `client/src/components/lazy-wrapper.tsx` | Lazy loading wrapper |
| `client/src/components/progressive-hydration.tsx` | Hydration progressiva |

## Key Symbols for This Agent

- **Layouts**: `MainLayout`, `AdminLayout`, `StudentLayout`
- **Hooks**: `useAuth`, `useCart`, `useCheckout`, `useApi`, `useSearch`, `useFavorites`, `useDebounce`, `usePrefetch`, `useToast`, `useMobile`, `useAutoSave`, `useViaCEP`, `useCollaborator`, `useAdminUsers`, `useReadyPapers`, `useStudentOrders`
- **Providers**: `ThemeProvider`, `QueryClientProvider`
- **Componentes UI**: Todos em `client/src/components/ui/` (40+ componentes shadcn)
- **Paginas publicas**: `index`, `ebooks-guides`, `ebook-detail`, `online-courses`, `course-detail`, `ready-papers`, `free-papers`, `custom-papers`, `blog`, `blog-post`, `contact`, `checkout`, `login`, `register`, `testimonials`
- **Paginas admin**: `admin`, `admin-users`, `admin-courses`, `admin-orders`, `ebooks-page`, `blog-posts-page`, `collaborators`, `analytics`, `integrations`, `newsletter`
- **Paginas student**: `student-dashboard`, `student-courses`, `student-orders`, `student-library`, `student-downloads`, `student-certificates`, `student-profile`, `student-custom-papers`

## Documentation Touchpoints

- `client/components.json` -- Configuracao shadcn/ui
- `client/tailwind.config.ts` -- Cores, fontes, breakpoints
- `client/vite.config.ts` -- Proxy de API, aliases, plugins
- `CLAUDE.md` -- Convencoes de build e commit

## Collaboration Checklist

- [ ] Componentes usam shadcn/ui como base
- [ ] Paginas registradas em `routes.tsx` com lazy loading
- [ ] Hooks criados para logica reutilizavel
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Dark mode compativel via `ThemeProvider`
- [ ] Formularios usam React Hook Form com validacao
- [ ] Loading states implementados (skeletons, spinners)
- [ ] Error boundaries para componentes criticos
- [ ] SEO meta tags implementados onde necessario
- [ ] Acessibilidade basica (labels, alt text, focus management)
- [ ] Build Vite passa sem erros
- [ ] Commit semantico criado
