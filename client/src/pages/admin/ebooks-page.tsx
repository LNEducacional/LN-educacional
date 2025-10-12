import { AdminEbooks } from '@/components/admin/admin-ebooks';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EbooksPage() {
  const navigate = useNavigate();
  const [_activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'courses'
    | 'users'
    | 'categories'
    | 'notifications'
    | 'settings'
    | 'ready-papers'
    | 'free-papers'
    | 'ebooks'
  >('ebooks');

  const handleSectionChange = (
    section:
      | 'dashboard'
      | 'courses'
      | 'users'
      | 'categories'
      | 'notifications'
      | 'settings'
      | 'ready-papers'
      | 'free-papers'
      | 'ebooks'
  ) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else if (section === 'ready-papers') {
      navigate('/admin/ready-papers');
    } else if (section === 'free-papers') {
      navigate('/admin/free-papers');
    } else if (section === 'ebooks') {
      navigate('/admin/ebooks');
    } else {
      navigate('/admin');
    }
  };

  const handleAddEbook = () => {
    navigate('/admin/ebooks/add');
  };

  const handleEditEbook = (id: number) => {
    navigate(`/admin/ebooks/edit/${id}`);
  };

  const handleViewEbook = (id: number) => {
    navigate(`/admin/ebooks/${id}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={'ebooks' as const} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-6 overflow-auto">
          <AdminEbooks
            onAddEbook={handleAddEbook}
            onEditEbook={handleEditEbook}
            onViewEbook={handleViewEbook}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
