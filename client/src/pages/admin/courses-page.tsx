import { AdminCourses } from '@/components/admin/admin-courses';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const CoursesPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in">
            <AdminCourses />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CoursesPage;
