import type React from 'react';
import { useEffect, useState } from 'react';

interface ProgressiveHydrationProps {
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

export function ProgressiveHydration({ children, priority = 'medium' }: ProgressiveHydrationProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 300;
    const timer = setTimeout(() => setIsHydrated(true), delay);
    return () => clearTimeout(timer);
  }, [priority]);

  if (!isHydrated) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <>{children}</>;
}
