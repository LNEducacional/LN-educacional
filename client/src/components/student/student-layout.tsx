import { StudentSidebar } from './student-sidebar';
import { Outlet, useLocation } from 'react-router-dom';

export function StudentLayout() {
  const location = useLocation();

  // Map routes to sidebar sections
  const getSectionFromPath = (path: string): string => {
    if (path === '/dashboard' || path === '/student') return 'dashboard';
    if (path.startsWith('/student/courses')) return 'courses';
    if (path.startsWith('/student/orders')) return 'orders';
    if (path.startsWith('/student/library')) return 'library';
    if (path.startsWith('/student/custom-papers')) return 'custom-papers';
    if (path.startsWith('/student/certificates')) return 'certificates';
    if (path.startsWith('/student/profile')) return 'profile';
    if (path.startsWith('/student/downloads')) return 'downloads';
    return 'dashboard';
  };

  const activeSection = getSectionFromPath(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar activeSection={activeSection} onSectionChange={() => {}} />

      <div className="md:pl-64">
        <main className="min-h-screen p-4 md:p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
