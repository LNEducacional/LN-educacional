import { coursesApi } from '@/api/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import type { CourseWithProgress } from '@/types/course';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Circle,
  Clock,
  Lock,
  Maximize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => coursesApi.getCourseProgress(courseId!),
    enabled: !!courseId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (data: { lessonId: string; completed?: boolean; watchTime?: number }) =>
      coursesApi.updateLessonProgress(data.lessonId, {
        completed: data.completed,
        watchTime: data.watchTime,
      }),
    onSuccess: () => {
      // Refetch course progress
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
    },
  });

  useEffect(() => {
    // Set first incomplete lesson as current
    if (course?.modules && !currentLesson) {
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (!lesson.progress?.[0]?.completed) {
            setCurrentLesson(lesson);
            return;
          }
        }
      }
      // If all completed, set first lesson
      if (course.modules[0]?.lessons[0]) {
        setCurrentLesson(course.modules[0].lessons[0]);
      }
    }
  }, [course]);

  useEffect(() => {
    // Track video progress
    const video = videoRef.current;
    if (!video || !currentLesson) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);

      // Update watch time every 10 seconds
      if (Math.floor(video.currentTime) % 10 === 0) {
        updateProgressMutation.mutate({
          lessonId: currentLesson.id,
          watchTime: Math.floor(video.currentTime),
        });
      }
    };

    const handleEnded = () => {
      // Mark lesson as completed
      updateProgressMutation.mutate({
        lessonId: currentLesson.id,
        completed: true,
        watchTime: Math.floor(video.duration),
      });

      // Auto-play next lesson
      handleNextLesson();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentLesson]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextLesson = () => {
    if (!course?.modules || !currentLesson) return;

    let foundCurrent = false;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (foundCurrent) {
          setCurrentLesson(lesson);
          return;
        }
        if (lesson.id === currentLesson.id) {
          foundCurrent = true;
        }
      }
    }
  };

  const handlePreviousLesson = () => {
    if (!course?.modules || !currentLesson) return;

    let previousLesson = null;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === currentLesson.id && previousLesson) {
          setCurrentLesson(previousLesson);
          return;
        }
        previousLesson = lesson;
      }
    }
  };

  const handleLessonClick = (lesson: any) => {
    // Save current progress before switching
    if (currentLesson && videoRef.current) {
      updateProgressMutation.mutate({
        lessonId: currentLesson.id,
        watchTime: Math.floor(videoRef.current.currentTime),
      });
    }
    setCurrentLesson(lesson);
  };

  const markAsComplete = () => {
    if (!currentLesson) return;

    updateProgressMutation.mutate({
      lessonId: currentLesson.id,
      completed: true,
    });

    toast({ title: 'Aula marcada como concluída!' });
  };

  if (isLoading) {
    return <div>Carregando curso...</div>;
  }

  if (!course) {
    return <div>Curso não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header do Curso */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-muted-foreground">por {course.instructorName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Video Player - Coluna Principal */}
          <div className="space-y-6">
            {/* Player de Vídeo */}
            <Card className="overflow-hidden shadow-xl border-2">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  {currentLesson?.videoUrl ? (
                    <iframe
                      src={currentLesson.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentLesson.title}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white bg-gradient-to-br from-gray-900 to-gray-800">
                      <div className="text-center">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Esta aula não possui vídeo</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info da Aula */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{currentLesson?.title}</h2>
                    {currentLesson?.description && (
                      <p className="text-muted-foreground leading-relaxed">{currentLesson.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {currentLesson?.duration || 0} minutos
                    </span>
                    {currentLesson?.progress?.[0]?.completed && (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Concluída
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button size="default" variant="outline" onClick={handlePreviousLesson}>
                        <SkipBack className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>
                      <Button size="default" variant="outline" onClick={handleNextLesson}>
                        Próxima
                        <SkipForward className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!currentLesson?.progress?.[0]?.completed && (
                        <Button onClick={markAsComplete} className="gap-2" size="default">
                          <CheckCircle className="h-4 w-4" />
                          Marcar como Concluída
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Abas de Conteúdo */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Sobre a Aula</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="resources">Recursos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {currentLesson?.description ? (
                      <p className="text-muted-foreground leading-relaxed">{currentLesson.description}</p>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma descrição disponível para esta aula.</p>
                    )}
                    <div className="flex items-center gap-4 text-sm pt-2">
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                        <Clock className="h-4 w-4" />
                        {currentLesson?.duration || 0} minutos
                      </span>
                      {currentLesson?.progress?.[0]?.completed && (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Concluída
                        </span>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="mt-4">
                    {currentLesson?.content ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {currentLesson.content}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum conteúdo adicional disponível para esta aula.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="resources" className="mt-4">
                    <p className="text-muted-foreground">Nenhum recurso disponível para esta aula.</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Progresso e Módulos */}
          <div className="space-y-6">
            {/* Card de Progresso */}
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seu Progresso</span>
                  <span className="text-2xl font-bold text-primary">{course.progressPercentage}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={course.progressPercentage} className="h-3" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {course.completedLessons} de {course.totalLessons} aulas
                  </span>
                  <span className="font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                    {course.completedLessons}/{course.totalLessons}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Módulos */}
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle>Conteúdo do Curso</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-4">
                    {course?.modules?.map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-2">
                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm pb-2 pt-1">
                          <h4 className="font-semibold text-sm bg-muted px-3 py-2 rounded-md">
                            Módulo {moduleIndex + 1}: {module.title}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const isCompleted = lesson.progress?.[0]?.completed;
                            const isCurrent = currentLesson?.id === lesson.id;
                            const isLocked = false;

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => !isLocked && handleLessonClick(lesson)}
                                disabled={isLocked}
                                className={`
                                  w-full text-left p-3 rounded-lg text-sm
                                  flex items-center gap-3
                                  transition-all duration-200
                                  ${isCurrent
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'hover:bg-muted hover:shadow-sm'
                                  }
                                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                              >
                                {isLocked ? (
                                  <Lock className="h-4 w-4 flex-shrink-0" />
                                ) : isCompleted ? (
                                  <CheckCircle className={`h-4 w-4 flex-shrink-0 ${isCurrent ? 'text-primary-foreground' : 'text-green-600 dark:text-green-400'}`} />
                                ) : (
                                  <Circle className={`h-4 w-4 flex-shrink-0 ${isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                )}
                                <span className="flex-1 font-medium">
                                  {lessonIndex + 1}. {lesson.title}
                                </span>
                                {lesson.duration && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${isCurrent ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                                    {lesson.duration}min
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
