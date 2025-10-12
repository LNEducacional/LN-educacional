import { useCallback, useRef } from 'react';

interface PrefetchCache {
  [key: string]: Promise<any> | any;
}

const prefetchCache: PrefetchCache = {};

export function usePrefetch() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchData = useCallback(async (url: string, delay = 200) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a delay before prefetching to avoid unnecessary requests
    timeoutRef.current = setTimeout(async () => {
      // Check if already cached or in progress
      if (prefetchCache[url]) {
        return;
      }

      try {
        // Create the prefetch promise
        const prefetchPromise = fetch(`${import.meta.env.VITE_API_URL}${url}`, {
          credentials: 'include',
        }).then((response) => {
          if (!response.ok) {
            throw new Error('Prefetch failed');
          }
          return response.json();
        });

        // Store the promise in cache
        prefetchCache[url] = prefetchPromise;

        // Wait for completion and store the result
        const data = await prefetchPromise;
        prefetchCache[url] = data;

        console.log(`Prefetched data for: ${url}`);
      } catch (error) {
        // Remove failed prefetch from cache
        delete prefetchCache[url];
        console.warn(`Prefetch failed for: ${url}`, error);
      }
    }, delay);
  }, []);

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const getCachedData = useCallback((url: string) => {
    const cached = prefetchCache[url];
    return cached && typeof cached !== 'function' ? cached : null;
  }, []);

  return {
    prefetchData,
    cancelPrefetch,
    getCachedData,
  };
}
