import LoadingSpinner from '@/components/loading-spinner';
import type React from 'react';
import { type ComponentType, Suspense } from 'react';

interface LazyWrapperProps {
  component: ComponentType<Record<string, unknown>>;
  fallback?: React.ReactNode;
  [key: string]: unknown;
}

export function LazyWrapper({
  component: Component,
  fallback = <LoadingSpinner />,
  ...props
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
