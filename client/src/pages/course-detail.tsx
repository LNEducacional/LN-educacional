import { coursesApi } from '@/api/courses';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Award, BookOpen, CheckCircle, Clock, PlayCircle, ShoppingCart, Users, Video, FileText, ShoppingBag } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckoutModal from '@/components/checkout/checkout-modal';
import { useCart } from '@/context/cart-context';
import { formatAcademicArea } from '@/utils/course-formatters';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id!),
    enabled: !!id,
  });

  const { data: modules } = useQuery({
    queryKey: ['course-modules', id],
    queryFn: () => coursesApi.getCourseModules(id!),
    enabled: !!id,
  });

  // Estado para controlar o modal de checkout
  const [checkoutModalOpen, setCheckoutModalOpen] = React.useState(false);

  // Debug: Log course data
  React.useEffect(() => {
    if (course) {
      console.log('📚 Course Data:', {
        id: course.id,
        title: course.title,
        price: course.price,
        priceType: typeof course.price,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        instructorName: course.instructorName,
        instructorBio: course.instructorBio,
        isEnrolled: course.isEnrolled,
      });
    }
  }, [course]);

  React.useEffect(() => {
    console.log('📖 Raw Modules Data:', { modules, type: typeof modules, isArray: Array.isArray(modules) });
    if (modules && Array.isArray(modules)) {
      console.log('📖 Modules Data:', {
        count: modules.length,
        modules: modules.map(m => ({
          id: m.id,
          title: m.title,
          lessonsCount: m.lessons?.length || 0,
          lessons: m.lessons?.map(l => ({
            title: l.title,
            duration: l.duration,
            attachments: l.attachments?.length || 0,
          })),
        })),
      });
    }
  }, [modules]);

  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.enrollInCourse(id!),
    onSuccess: () => {
      toast({ title: 'Inscrição realizada com sucesso!' });
      navigate(`/student/courses/${id}`);
    },
    onError: () => {
      toast({
        title: 'Erro ao realizar inscrição',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    },
  });

  const handleEnroll = () => {
    console.log('🛒 Enroll clicked:', { user, coursePrice: course?.price });

    if (course?.price && course.price > 0) {
      console.log('💳 Opening checkout modal');
      // Abrir modal de checkout para cursos pagos
      setCheckoutModalOpen(true);
    } else {
      // Para cursos gratuitos, verificar se está logado
      if (!user) {
        toast({
          title: 'Login necessário',
          description: 'Faça login para se inscrever no curso gratuito',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      console.log('🎁 Free enrollment');
      // Direct enrollment for free courses
      enrollMutation.mutate();
    }
  };

  const handleStartCourse = () => {
    navigate(`/student/courses/${id}`);
  };

  const handleAddToCart = () => {
    if (!course) {
      toast({
        title: 'Erro',
        description: 'Curso não encontrado',
        variant: 'destructive',
      });
      return;
    }

    if (!course.price || course.price === 0) {
      toast({
        title: 'Curso gratuito',
        description: 'Este curso é gratuito. Clique em "Inscrever-se Gratuitamente".',
        variant: 'destructive',
      });
      return;
    }

    try {
      addItem({
        id: course.id,
        title: course.title,
        description: course.description || '',
        price: course.price,
        type: 'course',
        thumbnailUrl: course.thumbnailUrl || '',
      });

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${course.title} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o curso ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    // Se o preço é undefined, null ou NaN, mostrar como "Gratuito"
    if (price === undefined || price === null || isNaN(price) || price === 0) {
      return 'Gratuito';
    }
    // Preço em centavos - dividir por 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  // Ensure modules is always an array - MUST be before any conditional returns
  const modulesArray = React.useMemo(() => {
    if (!modules) return [];
    if (Array.isArray(modules)) return modules;
    // If modules is an object with a data property (some APIs return this)
    if (typeof modules === 'object' && 'data' in modules && Array.isArray(modules.data)) {
      return modules.data;
    }
    return [];
  }, [modules]);

  const totalLessons = React.useMemo(() => {
    return modulesArray.reduce((acc, mod) => {
      const lessons = mod?.lessons;
      return acc + (Array.isArray(lessons) ? lessons.length : 0);
    }, 0);
  }, [modulesArray]);

  const totalDuration = React.useMemo(() => {
    return modulesArray.reduce((acc, mod) => {
      const lessons = mod?.lessons;
      if (!Array.isArray(lessons)) return acc;
      return acc + lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson?.duration || 0), 0);
    }, 0);
  }, [modulesArray]);

  if (isLoading) {
    return <div>Carregando curso...</div>;
  }

  if (!course) {
    return <div>Curso não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div className="space-y-6">
              <Badge className="bg-accent text-accent-foreground">{formatAcademicArea(course.academicArea)}</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gradient-primary leading-tight break-words">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{course.description}</p>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                    <p className="text-xs text-muted-foreground">Duração Total</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-accent/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Video className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLessons}</p>
                    <p className="text-xs text-muted-foreground">Aulas</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{modulesArray.length}</p>
                    <p className="text-xs text-muted-foreground">Módulos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructor Info */}
            {course.instructorName && (
              <Card className="border-l-4 border-l-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent-foreground" />
                    Instrutor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{course.instructorName}</h3>
                    {course.instructorBio && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {course.instructorBio}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Purchase Card */}
          <div>
            <Card className="sticky top-4 border-2 border-primary/20 shadow-lg">
              <CardContent className="p-0">
                {course.thumbnailUrl && (
                  <div className="relative">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full aspect-video object-cover rounded-t-lg"
                    />
                    {course.videoUrl && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() => window.open(course.videoUrl, '_blank')}
                          className="gap-2"
                        >
                          <PlayCircle className="h-5 w-5" />
                          Assistir Prévia
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gradient-primary">
                      {formatPrice(course.price)}
                    </span>
                  </div>

                  {/* CTA Button */}
                  {course.isEnrolled ? (
                    <Button
                      onClick={handleStartCourse}
                      className="w-full btn-hero"
                      size="lg"
                    >
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Continuar Aprendendo
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={handleEnroll}
                        className="w-full btn-accent text-lg py-6"
                        size="lg"
                        disabled={enrollMutation.isPending}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {enrollMutation.isPending
                          ? 'Processando...'
                          : course.price && course.price > 0
                            ? 'Comprar Agora'
                            : 'Inscrever-se Gratuitamente'}
                      </Button>

                      {/* Botão Adicionar ao Carrinho - só para cursos pagos */}
                      {course.price && course.price > 0 && (
                        <Button
                          onClick={handleAddToCart}
                          variant="outline"
                          className="w-full text-lg py-6 border-2"
                          size="lg"
                        >
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Benefits */}
                  <div className="space-y-3 pt-4 border-t">
                    <p className="font-semibold text-sm">Este curso inclui:</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Acesso vitalício ao conteúdo</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Certificado de conclusão</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{totalLessons} aulas em vídeo</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Materiais complementares para download</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Suporte com instrutor especializado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="content" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Conteúdo do Curso
            </TabsTrigger>
            {(course.description || course.instructorBio) && (
              <TabsTrigger value="about" className="gap-2">
                <FileText className="h-4 w-4" />
                Sobre o Curso
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="content">
            <Card className="border-primary/20">
              <CardHeader className="border-b bg-gradient-subtle">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Conteúdo Programático</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {modulesArray.length} módulos • {totalLessons} aulas •{' '}
                      {formatDuration(totalDuration)} de conteúdo
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {modulesArray.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {modulesArray.map((module, index) => {
                      const lessons = module?.lessons || [];
                      const moduleDuration = Array.isArray(lessons)
                        ? lessons.reduce((acc, lesson) => acc + (lesson?.duration || 0), 0)
                        : 0;

                      return (
                        <AccordionItem
                          key={module.id}
                          value={module.id}
                          className="border rounded-lg px-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4 text-left">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-base">{module.title}</p>
                                  {module.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {module.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(moduleDuration)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-2 mt-2 pl-2">
                              {lessons.length > 0 ? (
                                lessons.map((lesson, lessonIndex) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-start justify-between p-3 rounded-md bg-background/50 hover:bg-background border border-transparent hover:border-primary/20 transition-all group"
                                  >
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors flex-shrink-0 mt-0.5">
                                        <PlayCircle className="h-4 w-4 text-accent-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">
                                          Aula {lessonIndex + 1}: {lesson.title}
                                        </p>
                                        {lesson.description && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {lesson.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                          {lesson?.duration && (
                                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {lesson.duration} min
                                            </span>
                                          )}
                                          {lesson?.attachments && Array.isArray(lesson.attachments) && lesson.attachments.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                              <FileText className="h-3 w-3 mr-1" />
                                              {lesson.attachments.length} arquivo{lesson.attachments.length > 1 ? 's' : ''}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhuma aula cadastrada neste módulo
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      O conteúdo do curso será disponibilizado em breve
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Estamos preparando um material completo para você!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {(course.description || course.instructorBio) && (
            <TabsContent value="about">
              <Card className="border-primary/20">
                <CardHeader className="border-b bg-gradient-subtle">
                  <CardTitle className="text-2xl">Sobre este Curso</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {course.description && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Descrição
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  )}

                  {course.instructorName && course.instructorBio && (
                    <div className="pt-6 border-t">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-accent-foreground" />
                        Sobre o Instrutor
                      </h3>
                      <div className="space-y-2">
                        <p className="font-medium text-lg">{course.instructorName}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {course.instructorBio}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Checkout Modal */}
      {course && (
        <CheckoutModal
          open={checkoutModalOpen}
          onOpenChange={setCheckoutModalOpen}
          courseId={course.id}
          courseTitle={course.title}
          coursePrice={course.price}
        />
      )}
    </div>
  );
}
