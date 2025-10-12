/**
 * Performance utilities for the LN Educacional application
 * Includes lazy loading, memoization, and optimization helpers
 */

import { lazy, ComponentType } from 'react';

/**
 * Enhanced lazy loading with error boundary and loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(factory);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <React.Suspense fallback={fallback ? <fallback /> : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

/**
 * Debounce function for search inputs and API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function for scroll events and frequent updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Intersection Observer hook for lazy loading images and components
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
}

/**
 * Memory-based cache for API responses
 */
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    return this.cache.delete(key);
  }
}

export const memoryCache = new MemoryCache();

/**
 * Hook for cached API calls
 */
export function useCachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string,
  ttl?: number
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const key = cacheKey || url;

  React.useEffect(() => {
    const cachedData = memoryCache.get(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        memoryCache.set(key, data, ttl);
        setData(data);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, key, ttl]);

  return { data, loading, error };
}

/**
 * Image preloader for better UX
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      })
    )
  );
}

/**
 * Web Worker utility for heavy computations
 */
export class WebWorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor(workerScript: string, poolSize = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
      worker.onerror = (e) => this.handleWorkerError(worker, e);
      this.workers.push(worker);
    }
  }

  execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this.runTask(availableWorker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private runTask(
    worker: Worker & { busy?: boolean },
    data: any,
    resolve: (value: any) => void,
    reject: (reason: any) => void
  ) {
    worker.busy = true;
    worker.currentResolve = resolve;
    worker.currentReject = reject;
    worker.postMessage(data);
  }

  private handleWorkerMessage(worker: Worker & { busy?: boolean }, e: MessageEvent) {
    if (worker.currentResolve) {
      worker.currentResolve(e.data);
    }

    worker.busy = false;
    delete worker.currentResolve;
    delete worker.currentReject;

    // Process queue
    if (this.queue.length > 0) {
      const { data, resolve, reject } = this.queue.shift()!;
      this.runTask(worker, data, resolve, reject);
    }
  }

  private handleWorkerError(worker: Worker & { busy?: boolean }, error: ErrorEvent) {
    if (worker.currentReject) {
      worker.currentReject(error);
    }

    worker.busy = false;
    delete worker.currentResolve;
    delete worker.currentReject;
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
  }
}

/**
 * Bundle analyzer for development
 */
export function analyzeBundle() {
  if (process.env.NODE_ENV === 'development') {
    const chunks = document.querySelectorAll('script[src*="chunk"]');
    const total = Array.from(chunks).reduce((sum, script) => {
      const src = script.getAttribute('src');
      if (src) {
        return sum + (script as any).size || 0;
      }
      return sum;
    }, 0);

    console.log(`Total bundle size: ${total} bytes`);
    console.log(`Number of chunks: ${chunks.length}`);
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics: { [key: string]: number } = {};

  start(label: string) {
    this.metrics[`${label}_start`] = performance.now();
  }

  end(label: string) {
    const startTime = this.metrics[`${label}_start`];
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics[label] = duration;

      if (process.env.NODE_ENV === 'development') {
        console.log(`${label}: ${duration.toFixed(2)}ms`);
      }

      return duration;
    }
    return 0;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  clear() {
    this.metrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React component performance wrapper
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo(function PerformanceTrackedComponent(props: P) {
    React.useEffect(() => {
      performanceMonitor.start(`${componentName}_render`);

      return () => {
        performanceMonitor.end(`${componentName}_render`);
      };
    });

    return <Component {...props} />;
  });
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }
  return null;
}

/**
 * Network speed detection
 */
export function getConnectionSpeed() {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
}