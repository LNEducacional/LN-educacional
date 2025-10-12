import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import type React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="animate-fade-in">{children}</main>
      <Footer />
    </div>
  );
}
