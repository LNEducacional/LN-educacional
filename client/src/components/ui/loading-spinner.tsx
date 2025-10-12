import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <div className="absolute inset-0 rounded-full h-16 w-16 border-r-2 border-primary/20"></div>
      </div>
    </div>
  );
}

export function InlineLoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="inline-flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]}`} />
    </div>
  );
}
