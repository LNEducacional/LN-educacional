import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import api from '@/services/api';
import type { Course } from '@/types/course';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, DollarSign, MonitorPlay, Star } from 'lucide-react';
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

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(priceInCents / 100);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  };

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cursos em Destaque</h2>
            <p className="text-lg text-muted-foreground">
              Desenvolvidos por especialistas para impulsionar sua carreira
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !courses || courses.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Cursos em Destaque</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Desenvolvidos por especialistas para impulsionar sua carreira
            </p>
            <div className="text-center py-12">
              <MonitorPlay className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg text-muted-foreground">Nenhum curso disponível no momento</p>
              <Button asChild className="mt-4">
                <Link to="/courses">Ver todos os cursos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Cursos em Destaque</h2>
          <p className="text-lg text-muted-foreground">
            Desenvolvidos por especialistas para impulsionar sua carreira
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          {courses.length > coursesPerView && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={prevSlide}
                disabled={activeIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={nextSlide}
                disabled={activeIndex >= maxIndex}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out gap-6"
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
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg mb-4 flex items-center justify-center">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <MonitorPlay className="h-12 w-12 text-primary" />
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {course.instructorName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <span>{course.instructorName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(course.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(course.price)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/courses/${course.id}`}>Ver Curso</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {courses.length > coursesPerView && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link to="/courses">Ver todos os cursos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
