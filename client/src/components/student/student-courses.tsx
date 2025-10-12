import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import {
  BookOpen,
  Clock,
  Loader2,
  Play,
  Star,
  GraduationCap,
  TrendingUp,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  rating: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
  thumbnailUrl?: string;
  description: string;
}

interface StudentCoursesProps {
  onSelectCourse: (courseId: string) => void;
}

export function StudentCourses({ onSelectCourse }: StudentCoursesProps) {
  const { data: courses, loading, error } = useApi<Course[]>('/student/courses');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar cursos</p>
      </div>
    );
  }

  // Garantir que courses seja um array
  const coursesArray = Array.isArray(courses) ? courses : [];

  // Agrupar por status
  const inProgressCourses = coursesArray.filter(c => c.status === 'IN_PROGRESS');
  const completedCourses = coursesArray.filter(c => c.status === 'COMPLETED');
  const notStartedCourses = coursesArray.filter(c => c.status === 'NOT_STARTED');

  // Calcular estatísticas
  const totalProgress = coursesArray.length > 0
    ? Math.round(coursesArray.reduce((sum, c) => sum + c.progress, 0) / coursesArray.length)
    : 0;

  const stats = [
    {
      label: 'Total de Cursos',
      value: coursesArray.length,
      icon: GraduationCap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Progresso Médio',
      value: `${totalProgress}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Concluídos',
      value: completedCourses.length,
      icon: Award,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
            Concluído
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
            Em Progresso
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
            Não Iniciado
          </Badge>
        );
    }
  };

  const renderCourses = (coursesToRender: Course[]) => (
    coursesToRender.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesToRender.map((course) => (
          <Card
            key={course.id}
            className="hover-scale group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            {/* Course Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.thumbnailUrl || '/placeholder-course.jpg'}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 right-4">{getStatusBadge(course.status)}</div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-amber-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="space-y-2">
                <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="text-xs">por {course.instructor}</CardDescription>
                <Badge variant="outline" className="w-fit text-xs">
                  {course.category}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

              {/* Progress */}
              {course.status !== 'NOT_STARTED' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">
                      {course.completedLessons}/{course.totalLessons} aulas
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <div className="text-right">
                    <span className="text-sm font-semibold text-primary">{course.progress}%</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button className="w-full gap-2" onClick={() => onSelectCourse(course.id)}>
                {course.status === 'COMPLETED' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Revisar Curso
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {course.status === 'NOT_STARTED' ? 'Iniciar Curso' : 'Continuar'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhum curso nesta categoria</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Explore nosso catálogo e matricule-se em novos cursos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
        <p className="text-muted-foreground">
          Gerencie seu progresso e continue aprendendo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos ({coursesArray.length})</TabsTrigger>
          <TabsTrigger value="in_progress">Em Progresso ({inProgressCourses.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídos ({completedCourses.length})</TabsTrigger>
          <TabsTrigger value="not_started">Não Iniciados ({notStartedCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {renderCourses(coursesArray)}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          {renderCourses(inProgressCourses)}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {renderCourses(completedCourses)}
        </TabsContent>

        <TabsContent value="not_started" className="space-y-4 mt-6">
          {renderCourses(notStartedCourses)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
