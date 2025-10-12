import { StudentCourses } from '@/components/student/student-courses';
import { useNavigate } from 'react-router-dom';

export default function StudentCoursesPage() {
  const navigate = useNavigate();

  const handleSelectCourse = (courseId: string) => {
    navigate(`/student/courses/${courseId}`);
  };

  return <StudentCourses onSelectCourse={handleSelectCourse} />;
}
