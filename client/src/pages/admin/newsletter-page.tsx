import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { NewsletterManagement } from '@/components/admin/newsletter-management';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function NewsletterPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in">
            <NewsletterManagement />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
