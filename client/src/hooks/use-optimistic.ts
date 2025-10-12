import { showToast } from '@/lib/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

interface UseOptimisticOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: readonly unknown[];
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: (oldData: unknown, variables: TVariables) => unknown;
}

export function useOptimistic<TData = unknown, TVariables = unknown>({
  mutationFn,
  queryKey,
  onSuccess,
  onError,
  optimisticUpdate,
}: UseOptimisticOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (!optimisticUpdate) return;

      setIsOptimistic(true);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: unknown) => optimisticUpdate(old, variables));

      return { previousData };
    },
    onError: (error: Error, _variables, context: unknown) => {
      setIsOptimistic(false);

      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      onError?.(error);
      showToast.error(error.message || 'Erro ao processar operação');
    },
    onSuccess: (data) => {
      setIsOptimistic(false);
      onSuccess?.(data);
    },
    onSettled: () => {
      setIsOptimistic(false);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...mutation,
    isOptimistic,
  };
}

// Hook para infinite scroll
export function useInfiniteScroll(
  callback: () => void,
  options?: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  }
) {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options || {};
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useCallback(() => {
    if (!ref || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, threshold, rootMargin, enabled]);

  return setRef;
}

// Hook para debounce
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useCallback(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para localStorage com sincronização
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Sincronizar com outras abas
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(valueToStore),
          })
        );
      } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Escutar mudanças de outras abas
  useCallback(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Hook para prefetch de dados
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(
    async (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 1000 * 60 * 5, // 5 minutos
      });
    },
    [queryClient]
  );

  const prefetchOnHover = useCallback(
    (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => {
      let timeout: NodeJS.Timeout;

      return {
        onMouseEnter: () => {
          timeout = setTimeout(() => {
            prefetchQuery(queryKey, queryFn);
          }, 100);
        },
        onMouseLeave: () => {
          clearTimeout(timeout);
        },
      };
    },
    [prefetchQuery]
  );

  return { prefetchQuery, prefetchOnHover };
}
