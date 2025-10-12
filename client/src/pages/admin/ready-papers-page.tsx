import { AdminReadyPapers } from '@/components/admin/admin-ready-papers';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type AdminSection =
  | 'dashboard'
  | 'courses'
  | 'users'
  | 'categories'
  | 'notifications'
  | 'settings'
  | 'ready-papers'
  | 'free-papers'
  | 'ebooks'
  | 'blog-posts'
  | 'orders'
  | 'messages'
  | 'collaborators';

export default function ReadyPapersPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('ready-papers');

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else {
      navigate('/admin');
    }
  };

  const handleAddPaper = () => {
    navigate('/admin/ready-papers/add');
  };

  const handleEditPaper = (id: number) => {
    navigate(`/admin/ready-papers/edit/${id}`);
  };

  const handleViewPaper = (id: number) => {
    navigate(`/admin/ready-papers/details/${id}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-6 overflow-auto">
          <AdminReadyPapers
            onAddPaper={handleAddPaper}
            onEditPaper={handleEditPaper}
            onViewPaper={handleViewPaper}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
