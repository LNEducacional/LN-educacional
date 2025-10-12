import React, { Suspense, lazy, startTransition, useTransition } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { InlineLoadingSpinner, LoadingSpinner } from '../ui/loading-spinner';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Algo deu errado</h2>
      <pre className="text-sm text-gray-600 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </div>
  );
}

// Progressive enhancement wrapper with Suspense
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  progressive?: boolean;
}

export function SuspenseWrapper({
  children,
  fallback = <LoadingSpinner />,
  delay = 0,
  progressive = true,
}: SuspenseWrapperProps) {
  const [isPending, startTransition] = useTransition();

  // Progressive loading with delay
  const delayedFallback =
    delay > 0 ? <DelayedComponent delay={delay} fallback={fallback} /> : fallback;

  if (progressive) {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={delayedFallback}>
          <div className={isPending ? 'opacity-50 transition-opacity' : ''}>{children}</div>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Delayed component to prevent flash of loading state
function DelayedComponent({ delay, fallback }: { delay: number; fallback: React.ReactNode }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return show ? <>{fallback}</> : null;
}

// Lazy component loader with retry logic
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  maxRetries = 3
) {
  return lazy(async () => {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        return await componentImport();
      } catch (error) {
        retries++;
        if (retries === maxRetries) throw error;

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }

    throw new Error('Failed to load component after retries');
  });
}

// Streaming Suspense list for ordered loading
interface StreamingSuspenseListProps {
  children: React.ReactNode[];
  revealOrder?: 'forwards' | 'backwards' | 'together';
  tail?: 'collapsed' | 'hidden';
}

export function StreamingSuspenseList({
  children,
  revealOrder = 'forwards',
  tail = 'collapsed',
}: StreamingSuspenseListProps) {
  return (
    <div className="space-y-4">
      {children.map((child, index) => (
        <SuspenseWrapper
          key={index}
          fallback={<InlineLoadingSpinner size="sm" />}
          delay={revealOrder === 'forwards' ? index * 100 : (children.length - index) * 100}
          progressive={tail === 'collapsed'}
        >
          {child}
        </SuspenseWrapper>
      ))}
    </div>
  );
}

// Intersection Observer Suspense for viewport-based loading
export function ViewportSuspense({
  children,
  fallback = <LoadingSpinner />,
  rootMargin = '100px',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}) {
  const [isInView, setIsInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setIsInView(true);
          });
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      <SuspenseWrapper fallback={fallback}>{isInView ? children : fallback}</SuspenseWrapper>
    </div>
  );
}

// Priority-based loading with React 19's new features
export function PrioritySuspense({
  children,
  priority = 'high',
}: {
  children: React.ReactNode;
  priority?: 'immediate' | 'high' | 'normal' | 'low';
}) {
  const [shouldLoad, setShouldLoad] = React.useState(priority === 'immediate');

  React.useEffect(() => {
    if (priority === 'immediate') return;

    const delays = {
      high: 0,
      normal: 100,
      low: 500,
    };

    const timer = setTimeout(() => {
      startTransition(() => {
        setShouldLoad(true);
      });
    }, delays[priority]);

    return () => clearTimeout(timer);
  }, [priority]);

  if (!shouldLoad) {
    return <InlineLoadingSpinner size="sm" />;
  }

  return <SuspenseWrapper>{children}</SuspenseWrapper>;
}
