import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/course-card';
import api from '@/services/api';
import type { Course } from '@/types/course';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MonitorPlay } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const fetchFeaturedCourses = async (): Promise<Course[]> => {
  const response = await api.get('/courses?featured=true&limit=6&status=ACTIVE');
  return response.data.courses || response.data;
};

export default function CoursesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: fetchFeaturedCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const coursesPerView = 3;
  const maxIndex = courses ? Math.max(0, courses.length - coursesPerView) : 0;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Cursos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvidos por especialistas para impulsionar sua carreira acadêmica e
              profissional
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-80"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !courses || courses.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Cursos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Desenvolvidos por especialistas para impulsionar sua carreira acadêmica e
              profissional
            </p>
            <div className="text-center py-12">
              <MonitorPlay className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Nenhum curso disponível no momento</p>
              <Button asChild className="mt-4" size="lg">
                <Link to="/courses">Ver todos os cursos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/10" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Cursos em Destaque
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Aprenda com especialistas renomados e impulsione sua carreira acadêmica
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {courses.length > coursesPerView && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background shadow-md border hover:border-primary/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={prevSlide}
                disabled={activeIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background shadow-md border hover:border-primary/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={nextSlide}
                disabled={activeIndex >= maxIndex}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Carousel Container */}
          <div className="overflow-visible">
            <div className="px-1 py-12">
              <div
                className="flex transition-transform duration-700 ease-out gap-6"
                style={{
                  transform: `translateX(-${activeIndex * (100 / coursesPerView)}%)`,
                }}
              >
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex-shrink-0"
                    style={{
                      width: `calc(${100 / coursesPerView}% - ${((coursesPerView - 1) * 1.5) / coursesPerView}rem)`,
                    }}
                  >
                    <CourseCard course={course} variant="featured" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          {courses.length > coursesPerView && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === activeIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            asChild
            className="px-8 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Link to="/courses" className="flex items-center gap-2">
              Ver Todos os Cursos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
