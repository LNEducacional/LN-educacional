import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Cache keys factory
export const queryKeys = {
  all: [''] as const,
  auth: () => ['auth'] as const,
  user: () => ['user'] as const,

  // Student
  student: {
    all: () => ['student'] as const,
    dashboard: () => ['student', 'dashboard'] as const,
    courses: () => ['student', 'courses'] as const,
    course: (id: string) => ['student', 'courses', id] as const,
    certificates: () => ['student', 'certificates'] as const,
    certificate: (id: string) => ['student', 'certificates', id] as const,
    library: () => ['student', 'library'] as const,
    profile: () => ['student', 'profile'] as const,
  },

  // Products
  products: {
    all: () => ['products'] as const,
    papers: (filters?: Record<string, unknown>) => ['products', 'papers', filters] as const,
    paper: (id: string) => ['products', 'papers', id] as const,
    courses: (filters?: Record<string, unknown>) => ['products', 'courses', filters] as const,
    course: (id: string) => ['products', 'courses', id] as const,
    ebooks: (filters?: Record<string, unknown>) => ['products', 'ebooks', filters] as const,
    ebook: (id: string) => ['products', 'ebooks', id] as const,
  },

  // Admin
  admin: {
    all: () => ['admin'] as const,
    dashboard: () => ['admin', 'dashboard'] as const,
    analytics: (period?: string) => ['admin', 'analytics', period] as const,
    downloadAnalytics: (filters?: Record<string, unknown>) =>
      ['admin', 'analytics', 'downloads', filters] as const,
    users: (filters?: Record<string, unknown>) => ['admin', 'users', filters] as const,
    orders: (filters?: Record<string, unknown>) => ['admin', 'orders', filters] as const,
    collaborators: (filters?: Record<string, unknown>) =>
      ['admin', 'collaborators', filters] as const,
    messages: () => ['admin', 'messages'] as const,
  },

  // Blog
  blog: {
    all: () => ['blog'] as const,
    posts: (filters?: Record<string, unknown>) => ['blog', 'posts', filters] as const,
    post: (slug: string) => ['blog', 'posts', slug] as const,
  },

  // Search
  search: (query: string, type?: string) => ['search', query, type] as const,
};
