import { CustomPapersTab } from '@/components/student/custom-papers-tab';
import { StudentCertificates } from '@/components/student/student-certificates';
import { StudentCourseDetail } from '@/components/student/student-course-detail';
import { StudentCourses } from '@/components/student/student-courses';
import { StudentDashboard } from '@/components/student/student-dashboard';
import { StudentDownloads } from '@/components/student/student-downloads';
import { StudentLibrary } from '@/components/student/student-library';
import { StudentOrders } from '@/components/student/student-orders';
import { StudentProfile } from '@/components/student/student-profile';
import { StudentSidebar } from '@/components/student/student-sidebar';
import { useState } from 'react';

export default function Student() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'courses':
        return selectedCourseId ? (
          <StudentCourseDetail
            courseId={selectedCourseId}
            onBack={() => setSelectedCourseId(null)}
          />
        ) : (
          <StudentCourses onSelectCourse={setSelectedCourseId} />
        );
      case 'orders':
        return <StudentOrders />;
      case 'library':
        return <StudentLibrary />;
      case 'custom-papers':
        return <CustomPapersTab />;
      case 'certificates':
        return <StudentCertificates />;
      case 'profile':
        return <StudentProfile />;
      case 'downloads':
        return <StudentDownloads />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="md:pl-64">
        <main className="min-h-screen p-4 md:p-6">
          <div className="animate-fade-in">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
