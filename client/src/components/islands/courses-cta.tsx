import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CoursesCTAProps {
  courseId?: number;
  showViewAll?: boolean;
}

export default function CoursesCTA({ courseId, showViewAll = false }: CoursesCTAProps) {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  };

  const handleViewAllClick = () => {
    navigate('/courses');
  };

  if (showViewAll) {
    return (
      <div className="text-center mt-12 animate-fade-in">
        <Button variant="outline" size="lg" className="btn-ghost" onClick={handleViewAllClick}>
          Ver todos os cursos
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Button className="btn-accent group" onClick={handleCourseClick}>
      Ver curso
      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
    </Button>
  );
}
