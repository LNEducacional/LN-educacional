import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroCTA() {
  const navigate = useNavigate();

  const handleCoursesClick = () => {
    navigate('/courses');
  };

  const handleDemoClick = () => {
    // Pode abrir um modal de demonstração ou navegar para uma página
    console.log('Abrindo demonstração...');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button size="lg" className="btn-hero group" onClick={handleCoursesClick}>
        Conheça os Cursos
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      <Button variant="outline" size="lg" className="btn-ghost group" onClick={handleDemoClick}>
        <Play className="mr-2 h-5 w-5" />
        Assistir Demonstração
      </Button>
    </div>
  );
}
