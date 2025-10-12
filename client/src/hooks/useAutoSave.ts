import { useEffect, useCallback, useRef } from 'react';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

export function useAutoSave(key: string, data: any, delay = 1000) {
  const saveData = useCallback(
    debounce((value) => {
      if (value && Object.keys(value).length > 0) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, delay),
    [key, delay]
  );

  useEffect(() => {
    saveData(data);
  }, [data, saveData]);

  const getSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error reading saved data:', error);
      return null;
    }
  }, [key]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { getSavedData, clearSavedData };
}