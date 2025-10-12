import { useOptimistic as useReactOptimistic } from 'react';

export function useOptimistic<T>(
  initialState: T,
  updateFn: (currentState: T, optimisticValue: T) => T
): [T, (action: T) => void] {
  return useReactOptimistic(initialState, updateFn);
}
