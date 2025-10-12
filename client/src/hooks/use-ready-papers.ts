import api from '@/services/api';
import type { ReadyPaper } from '@/types/paper';
import { useCallback, useEffect, useState } from 'react';

interface UseReadyPapersOptions {
  type?: string;
  area?: string;
  skip?: number;
  take?: number;
}

interface ReadyPapersResponse {
  papers: ReadyPaper[];
  total: number;
}

export function useReadyPapers(options?: UseReadyPapersOptions) {
  const [papers, setPapers] = useState<ReadyPaper[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPapers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = {
        free: false, // Ready papers são os PAGOS (não gratuitos)
      };

      if (options?.type) params.type = options.type;
      if (options?.area) params.area = options.area;
      if (options?.skip !== undefined) params.skip = options.skip;
      if (options?.take !== undefined) params.take = options.take;

      const response = await api.get<ReadyPapersResponse>('/admin/papers', { params });

      setPapers(response.data.papers);
      setTotal(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch papers'));
      setPapers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [options?.type, options?.area, options?.skip, options?.take]);

  const deletePaper = useCallback(async (id: string) => {
    try {
      await api.delete(`/admin/papers/${id}`);
      // Atualizar lista local removendo o paper deletado
      setPapers((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
      return { success: true };
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete paper');
    }
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  return {
    papers,
    total,
    isLoading,
    error,
    refetch: fetchPapers,
    deletePaper,
  };
}
