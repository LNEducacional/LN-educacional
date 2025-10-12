import { AdminFreePapers } from '@/components/admin/admin-free-papers';
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

export default function FreePapersPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('free-papers');

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else if (section === 'ready-papers') {
      navigate('/admin/ready-papers');
    } else if (section === 'free-papers') {
      navigate('/admin/free-papers');
    } else {
      navigate('/admin');
    }
  };

  const handleAddPaper = () => {
    navigate('/admin/free-papers/add');
  };

  const handleEditPaper = (id: string) => {
    navigate(`/admin/free-papers/edit/${id}`);
  };

  const handleViewPaper = (id: string) => {
    navigate(`/admin/free-papers/${id}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-6 overflow-auto">
          <AdminFreePapers
            onAddPaper={handleAddPaper}
            onEditPaper={handleEditPaper}
            onViewPaper={handleViewPaper}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
