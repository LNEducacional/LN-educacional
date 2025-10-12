import { CardSkeleton } from '@/components/skeletons/card-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-client';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, Clock, Play, Star, Users } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  academicArea: string;
  duration: number;
  price: number;
  thumbnailUrl?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  enrollmentsCount?: number;
  rating?: number;
  modules?: Array<{ id: string; title: string; duration?: number }>;
}

interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  progress: number;
  status: string;
  enrolledAt: string;
  course?: Course;
}

const areaLabels: Record<string, string> = {
  all: 'Todas as áreas',
  ADMINISTRACAO: 'Administração',
  DIREITO: 'Direito',
  EDUCACAO: 'Educação',
  ENGENHARIA: 'Engenharia',
  LETRAS: 'Letras',
  EXATAS: 'Ciências Exatas',
  SAUDE: 'Saúde',
  TECNOLOGIA: 'Tecnologia',
  CIENCIAS_HUMANAS: 'Ciências Humanas',
  CIENCIAS_SOCIAIS: 'Ciências Sociais',
};

const levelColors = {
  BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  ADVANCED: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
};

const levelLabels = {
  BEGINNER: 'Básico',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

const OnlineCourses: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedLevel, _setSelectedLevel] = useState<string>('all');
  const [sortBy, _setSortBy] = useState<string>('newest');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  // Buscar cursos da API
  const filters = {
    ...(selectedArea !== 'all' && { area: selectedArea }),
    ...(selectedLevel !== 'all' && { level: selectedLevel }),
    sort: sortBy,
  };

  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesError,
  } = useQuery({
    queryKey: queryKeys.products.courses(filters),
    queryFn: async () => {
      const response = await api.get('/courses', { params: filters });
      return response.data as { courses: Course[]; total: number };
    },
  });

  // Buscar matrículas do usuário
  const { data: enrollments } = useQuery({
    queryKey: ['student', 'enrollments'],
    queryFn: async () => {
      if (!user) return [];
      const response = await api.get('/student/enrollments');
      return response.data as Enrollment[];
    },
    enabled: !!user,
  });

  // Filtrar cursos
  const filteredCourses = coursesData?.courses || [];

  // Obter cursos matriculados
  const enrolledCourses = useMemo(() => {
    if (!enrollments) return [];
    return enrollments
      .filter((e) => e.course)
      .map((e) => ({
        ...(e.course as Course),
        progress: e.progress,
      }));
  }, [enrollments]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100); // Converter de centavos
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const _handleEnroll = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para se matricular no curso.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Adicionar ao carrinho
    addItem({
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      type: 'course',
      thumbnailUrl: course.thumbnailUrl,
    });

    toast({
      title: 'Curso adicionado!',
      description: 'O curso foi adicionado ao seu carrinho.',
    });
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>Cursos Online - LN Educacional</title>
      <meta
        name="description"
        content="Cursos online com certificado para sua capacitação acadêmica e profissional."
      />

      <div className="min-h-[calc(100vh-200px)] bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">Cursos Online</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Aprenda no seu ritmo com cursos completos, materiais exclusivos e certificado de
              conclusão.
            </p>
          </div>

          {/* Filtros */}
          <div className="mb-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-auto">
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Filtrar por área acadêmica" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(areaLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredCourses.length}{' '}
                {filteredCourses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
              </div>
            </div>
          </div>

          {/* Meus Cursos (apenas se logado e tiver matrículas) */}
          {user && enrolledCourses.length > 0 && (
            <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Meus Cursos
                  </CardTitle>
                  <CardDescription>Continue seus estudos de onde parou</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {enrolledCourses.map((course) => (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm leading-5 mb-1 line-clamp-2">
                                {course.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-2">
                                {course.instructor}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                <Clock className="h-3 w-3" />
                                {formatDuration(course.duration)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Progresso</span>
                                <span className="text-xs text-muted-foreground">
                                  {course.progress}%
                                </span>
                              </div>
                              <Progress value={course.progress} className="h-2" />
                              {course.progress === 100 && (
                                <Badge className="mt-2 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Concluído
                                </Badge>
                              )}
                            </div>

                            <Button
                              onClick={() => handleCourseClick(course.id)}
                              className="w-full text-xs h-8"
                              variant={course.progress === 100 ? 'outline' : 'default'}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              {course.progress === 100 ? 'Revisar Curso' : 'Continuar Curso'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de Cursos */}
          {coursesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <CardSkeleton key={`course-skeleton-${i + Date.now()}`} />
              ))}
            </div>
          ) : coursesError ? (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-destructive mb-4">
                  Erro ao carregar cursos. Por favor, tente novamente.
                </p>
                <Button onClick={() => window.location.reload()}>Recarregar</Button>
              </CardContent>
            </Card>
          ) : filteredCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Nenhum curso encontrado.</p>
                <Button onClick={() => setSelectedArea('all')}>Ver todos os cursos</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course, index) => (
                <Card
                  key={course.id}
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleCourseClick(course.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg leading-6 line-clamp-2">
                            {course.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {course.description}
                        </p>
                        <p className="text-sm font-medium text-primary mb-3">{course.instructor}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className={levelColors[course.level]}>
                        {levelLabels[course.level]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {areaLabels[course.academicArea] || course.academicArea}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(course.duration)}
                        </div>
                        {course.enrollmentsCount && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.enrollmentsCount}
                          </div>
                        )}
                      </div>
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {course.rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(course.price)}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course.id);
                        }}
                        className="btn-hero"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ver Curso
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Estado vazio */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Não há cursos disponíveis para a área selecionada.
              </p>
              <Button onClick={() => setSelectedArea('all')} variant="outline">
                Ver todos os cursos
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OnlineCourses;
