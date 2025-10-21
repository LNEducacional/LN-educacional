import type { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: unknown[];
}

export function useApi<T = unknown>(url: string, options: UseApiOptions = { immediate: true }) {
  const isMountedRef = useRef(true);
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: options.immediate ?? true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.get<T>(url);

      // Apenas atualizar estado se componente ainda estiver montado
      if (isMountedRef.current) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      }
      return response.data;
    } catch (error) {
      // Apenas atualizar estado se componente ainda estiver montado
      if (isMountedRef.current) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage =
          axiosError.response?.data?.message || axiosError.message || 'Erro ao carregar dados';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
      }
      throw error;
    }
  }, [url]);

  useEffect(() => {
    isMountedRef.current = true;

    if (options.immediate !== false) {
      fetch();
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...(options.dependencies || [])]);

  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  method: 'post' | 'put' | 'patch' | 'delete'
) {
  const isMountedRef = useRef(false);
  const [state, setState] = useState<UseApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (url: string, variables?: TVariables) => {
      if (!isMountedRef.current) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api[method]<TData>(url, variables);

        // Apenas atualizar estado se componente ainda estiver montado
        if (isMountedRef.current) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
        }
        return response.data;
      } catch (error) {
        // Apenas atualizar estado se componente ainda estiver montado
        if (isMountedRef.current) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage =
            axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao processar requisição';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
          });
        }
        throw error;
      }
    },
    [method]
  );

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;

    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    mutate,
    reset,
  };
}
