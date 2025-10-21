import api from '@/services/api';
import type { StudentOrder, StudentOrdersResponse } from '@/types/student-order';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseStudentOrdersOptions {
  status?: string;
  skip?: number;
  take?: number;
}

export function useStudentOrders(options?: UseStudentOrdersOptions) {
  const isMountedRef = useRef(false);
  const [orders, setOrders] = useState<StudentOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, string | number> = {};
      if (options?.status) params.status = options.status;
      if (options?.skip !== undefined) params.skip = options.skip;
      if (options?.take !== undefined) params.take = options.take;

      const response = await api.get<StudentOrdersResponse>('/student/orders', { params });

      if (isMountedRef.current) {
        setOrders(response.data.orders);
        setTotal(response.data.total);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
        setOrders([]);
        setTotal(0);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [options?.status, options?.skip, options?.take]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    total,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
