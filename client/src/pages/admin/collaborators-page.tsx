import { AdminCollaborators } from '@/components/admin/admin-collaborators';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const CollaboratorsPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="animate-fade-in">
              <AdminCollaborators />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CollaboratorsPage;
