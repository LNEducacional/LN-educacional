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
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                {currentLesson?.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={currentLesson.videoUrl}
                    className="w-full h-full"
                    controls
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <p>Esta aula não possui vídeo</p>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="p-4 space-y-3">
                <Progress value={progress} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={handlePreviousLesson}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handlePlayPause}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleNextLesson}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!currentLesson?.progress?.[0]?.completed && (
                      <Button size="sm" variant="outline" onClick={markAsComplete}>
                        Marcar como concluída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Info */}
          <Card>
            <CardHeader>
              <CardTitle>{currentLesson?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="resources">Recursos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {currentLesson?.description && (
                    <p className="text-muted-foreground">{currentLesson.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentLesson?.duration || 0} minutos
                    </span>
                    {currentLesson?.progress?.[0]?.completed && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Concluída
                      </span>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="content">
                  {currentLesson?.content ? (
                    <div className="prose prose-sm max-w-none">{currentLesson.content}</div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum conteúdo adicional disponível</p>
                  )}
                </TabsContent>

                <TabsContent value="resources">
                  <p className="text-muted-foreground">Nenhum recurso disponível para esta aula</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Course Navigation */}
        <div className="space-y-4">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Seu Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={course.progressPercentage} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span>
                    {course.completedLessons} de {course.totalLessons} aulas
                  </span>
                  <span className="font-medium">{course.progressPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules List */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Curso</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-2">
                  {course?.modules?.map((module, moduleIndex) => (
                    <div key={module.id} className="space-y-1">
                      <h4 className="font-medium text-sm mb-2">
                        Módulo {moduleIndex + 1}: {module.title}
                      </h4>
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isCompleted = lesson.progress?.[0]?.completed;
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isLocked = false; // Implement unlock logic if needed

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => !isLocked && handleLessonClick(lesson)}
                            disabled={isLocked}
                            className={`
                              w-full text-left p-2 rounded-md text-sm
                              flex items-center gap-2
                              ${isCurrent ? 'bg-primary/10' : 'hover:bg-muted'}
                              ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {isLocked ? (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="flex-1">
                              {lessonIndex + 1}. {lesson.title}
                            </span>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">
                                {lesson.duration}min
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
