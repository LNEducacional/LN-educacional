import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-client';
import api from '@/services/api';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Play,
  PlayCircle,
  ShoppingCart,
  Star,
  User,
  Users,
  Video,
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  videoUrl?: string;
  order: number;
  resources?: Resource[];
}

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorBio?: string;
  academicArea: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  price: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  rating?: number;
  enrollmentsCount?: number;
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

interface Enrollment {
  id: string;
  courseId: string;
  progress: number;
  status: string;
  completedLessons: string[];
}

const levelLabels = {
  BEGINNER: 'Básico',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

const levelColors = {
  BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  ADVANCED: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
};

const areaLabels: Record<string, string> = {
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

// Componente para renderizar o vídeo demo
function CourseVideoDemo({
  course,
  playingDemo,
  setPlayingDemo,
}: {
  course: Course;
  playingDemo: boolean;
  setPlayingDemo: (playing: boolean) => void;
}) {
  if (!course.videoUrl) return null;

  return (
    <Card>
      <CardContent className="p-0">
        {playingDemo ? (
          <div className="aspect-video bg-black rounded-t-lg">
            <video controls autoPlay className="w-full h-full rounded-t-lg" src={course.videoUrl}>
              <track kind="captions" srcLang="pt" label="Português" />
            </video>
          </div>
        ) : (
          <button
            type="button"
            className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 rounded-t-lg flex items-center justify-center cursor-pointer hover:from-primary/30 hover:to-primary/20 transition-colors w-full border-none"
            onClick={() => setPlayingDemo(true)}
            aria-label="Reproduzir vídeo de demonstração"
          >
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
              />
            ) : null}
            <div className="relative z-10 text-center">
              <div className="bg-white/90 dark:bg-black/90 rounded-full p-4 mb-4 inline-block">
                <PlayCircle className="h-12 w-12 text-primary" />
              </div>
              <p className="text-white font-semibold">Assistir Demonstração</p>
            </div>
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para renderizar a sidebar de matrícula
function EnrollmentSidebar({
  course,
  enrollment,
  isEnrolled,
  totalDuration,
  totalLessons,
  handleEnroll,
  handleContinueCourse,
  formatPrice,
  formatDuration,
}: {
  course: Course;
  enrollment?: Enrollment;
  isEnrolled: boolean;
  totalDuration: number;
  totalLessons: number;
  handleEnroll: () => void;
  handleContinueCourse: () => void;
  formatPrice: (price: number) => string;
  formatDuration: (minutes: number) => string;
}) {
  return (
    <div className="lg:sticky lg:top-8 h-fit space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-primary">
              {formatPrice(course.price)}
            </CardTitle>
            {course.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{course.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnrolled ? (
            <>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✓ Você está matriculado neste curso
                </p>
              </div>
              {enrollment && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-muted-foreground">{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </div>
              )}
              <Button onClick={handleContinueCourse} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Continuar Curso
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEnroll} className="w-full" size="lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Acesso vitalício • Certificado incluso
              </p>
            </>
          )}

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDuration(totalDuration)} de conteúdo</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{totalLessons} aulas em vídeo</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Certificado de conclusão</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Material complementar</span>
            </div>
            {course.enrollmentsCount && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{course.enrollmentsCount} alunos matriculados</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Garantia de 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Se não ficar satisfeito com o curso, você pode solicitar reembolso total em até 7 dias
            após a compra.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [playingDemo, setPlayingDemo] = useState(false);

  // Buscar detalhes do curso
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: queryKeys.products.course(id || ''),
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data as Course;
    },
    enabled: !!id,
  });

  // Buscar matrícula do usuário (se logado)
  const { data: enrollment } = useQuery({
    queryKey: ['student', 'enrollment', id],
    queryFn: async () => {
      if (!user) return null;
      const response = await api.get(`/student/enrollments/course/${id}`);
      return response.data as Enrollment;
    },
    enabled: !!user && !!id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const calculateTotalDuration = () => {
    if (!course?.modules) return 0;
    return course.modules.reduce((total, module) => {
      const moduleDuration =
        module.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
      return total + moduleDuration;
    }, 0);
  };

  const calculateTotalLessons = () => {
    if (!course?.modules) return 0;
    return course.modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
  };

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para se matricular no curso.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!course) return;

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

    navigate('/checkout');
  };

  const handleContinueCourse = () => {
    navigate(`/student/courses/${id}`);
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-destructive mb-4">
              {courseError ? 'Erro ao carregar curso' : 'Curso não encontrado'}
            </p>
            <Button onClick={() => navigate('/courses')}>Voltar aos Cursos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const totalDuration = calculateTotalDuration();
  const totalLessons = calculateTotalLessons();

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header com botão voltar */}
        <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Cursos
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CourseVideoDemo
              course={course}
              playingDemo={playingDemo}
              setPlayingDemo={setPlayingDemo}
            />

            {/* Título e Descrição */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={levelColors[course.level]}>{levelLabels[course.level]}</Badge>
                <Badge variant="outline">
                  {areaLabels[course.academicArea] || course.academicArea}
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(totalDuration)}
                </Badge>
                <Badge variant="secondary">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {totalLessons} aulas
                </Badge>
              </div>
            </div>

            {/* Tabs de Conteúdo */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="instructor">Instrutor</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>O que você aprenderá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>Fundamentos teóricos e práticos da área</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>Técnicas avançadas e metodologias modernas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>Aplicação prática com casos reais</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>Material complementar e exercícios práticos</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Requisitos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Conhecimento básico na área</li>
                      <li>• Computador com acesso à internet</li>
                      <li>• Dedicação de pelo menos 2 horas por semana</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conteúdo do Curso</CardTitle>
                    <CardDescription>
                      {course.modules.length} módulos • {totalLessons} aulas •{' '}
                      {formatDuration(totalDuration)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {course.modules
                        .sort((a, b) => a.order - b.order)
                        .map((module, index) => (
                          <AccordionItem key={module.id} value={`module-${module.id}`}>
                            <AccordionTrigger>
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-medium">
                                  Módulo {index + 1}: {module.title}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {module.lessons?.length || 0} aulas
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                {module.lessons
                                  ?.sort((a, b) => a.order - b.order)
                                  .map((lesson, lessonIndex) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                          {lessonIndex + 1}
                                        </div>
                                        <div>
                                          <p className="font-medium">{lesson.title}</p>
                                          {lesson.description && (
                                            <p className="text-sm text-muted-foreground">
                                              {lesson.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Video className="h-4 w-4" />
                                        {formatDuration(lesson.duration)}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre o Instrutor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{course.instructor}</h3>
                        <p className="text-muted-foreground">
                          {course.instructorBio ||
                            'Profissional experiente com vasta experiência na área. Dedicado ao ensino e compartilhamento de conhecimento com metodologia prática e eficiente.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <EnrollmentSidebar
            course={course}
            enrollment={enrollment}
            isEnrolled={isEnrolled}
            totalDuration={totalDuration}
            totalLessons={totalLessons}
            handleEnroll={handleEnroll}
            handleContinueCourse={handleContinueCourse}
            formatPrice={formatPrice}
            formatDuration={formatDuration}
          />
        </div>
      </div>
    </div>
  );
}
