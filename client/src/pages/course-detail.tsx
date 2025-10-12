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
import { Award, BookOpen, CheckCircle, Clock, PlayCircle, Star, Users } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para se inscrever no curso',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (course?.price && course.price > 0) {
      // Redirect to checkout for paid courses
      navigate(`/checkout?type=course&id=${id}`);
    } else {
      // Direct enrollment for free courses
      enrollMutation.mutate();
    }
  };

  const handleStartCourse = () => {
    navigate(`/student/courses/${id}`);
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'R$ 0,00';
    }
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

  if (isLoading) {
    return <div>Carregando curso...</div>;
  }

  if (!course) {
    return <div>Curso não encontrado</div>;
  }

  const modulesArray = Array.isArray(modules) ? modules : [];
  const totalLessons = modulesArray.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
  const totalDuration = modulesArray.reduce(
    (acc, mod) =>
      acc +
      (mod.lessons?.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0) || 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Badge className="mb-2">{course.academicArea}</Badge>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDuration(totalDuration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{totalLessons} aulas</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>1.234 alunos</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>4.8 (432 avaliações)</span>
            </div>
          </div>

          {/* Instructor Info */}
          <Card>
            <CardHeader>
              <CardTitle>Instrutor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{course.instructorName}</h3>
                  {course.instructorBio && (
                    <p className="text-sm text-muted-foreground mt-1">{course.instructorBio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrollment Card */}
        <div>
          <Card className="sticky top-4">
            <CardContent className="p-6">
              {course.thumbnailUrl && (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full aspect-video object-cover rounded-md mb-4"
                />
              )}

              <div className="space-y-4">
                <div className="text-3xl font-bold">{formatPrice(course.price)}</div>

                {course.isEnrolled ? (
                  <Button onClick={handleStartCourse} className="w-full" size="lg">
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Continuar Curso
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleEnroll}
                      className="w-full"
                      size="lg"
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending
                        ? 'Processando...'
                        : course.price > 0
                          ? 'Comprar Curso'
                          : 'Inscrever-se Gratuitamente'}
                    </Button>

                    {course.videoUrl && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(course.videoUrl, '_blank')}
                      >
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Assistir Prévia
                      </Button>
                    )}
                  </>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Acesso vitalício</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Certificado de conclusão</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Suporte direto com instrutor</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Materiais complementares</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Content */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Conteúdo do Curso</TabsTrigger>
          <TabsTrigger value="about">Sobre o Curso</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Módulos e Aulas</CardTitle>
              <p className="text-sm text-muted-foreground">
                {modulesArray.length} módulos • {totalLessons} aulas •{' '}
                {formatDuration(totalDuration)}
              </p>
            </CardHeader>
            <CardContent>
              {modulesArray.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {modulesArray.map((module, index) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                          <span>
                            Módulo {index + 1}: {module.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {module.lessons.length} aulas
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                        )}
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                            >
                              <div className="flex items-center gap-3">
                                <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {lessonIndex + 1}. {lesson.title}
                                </span>
                              </div>
                              {lesson.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration} min
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  O conteúdo do curso será disponibilizado em breve
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Sobre este Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">O que você aprenderá</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Fundamentos essenciais da área</li>
                  <li>Aplicações práticas e exercícios</li>
                  <li>Projetos do mundo real</li>
                  <li>Melhores práticas e metodologias</li>
                  <li>Preparação para o mercado de trabalho</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Pré-requisitos</h3>
                <p className="text-sm text-muted-foreground">
                  Não há pré-requisitos específicos para este curso. Apenas dedicação e vontade de
                  aprender!
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Para quem é este curso</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Estudantes iniciantes na área</li>
                  <li>Profissionais em transição de carreira</li>
                  <li>Pessoas interessadas em aprofundar conhecimentos</li>
                  <li>Empreendedores buscando novas habilidades</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações dos Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">4.8</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= 4.8 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">432 avaliações</p>
                  </div>

                  <div className="flex-1 space-y-1">
                    {[
                      { stars: 5, percentage: 75 },
                      { stars: 4, percentage: 18 },
                      { stars: 3, percentage: 5 },
                      { stars: 2, percentage: 1 },
                      { stars: 1, percentage: 1 },
                    ].map((rating) => (
                      <div key={rating.stars} className="flex items-center gap-2">
                        <span className="text-sm w-4">{rating.stars}</span>
                        <Star className="h-3 w-3" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${rating.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-10">
                          {rating.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  {/* Sample Reviews */}
                  {[
                    {
                      name: 'Maria Silva',
                      rating: 5,
                      date: '2 semanas atrás',
                      comment:
                        'Excelente curso! O conteúdo é muito bem estruturado e o instrutor explica de forma clara.',
                    },
                    {
                      name: 'João Santos',
                      rating: 4,
                      date: '1 mês atrás',
                      comment:
                        'Muito bom, aprendi bastante. Apenas senti falta de mais exercícios práticos.',
                    },
                  ].map((review, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{review.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
