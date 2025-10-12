import { coursesApi } from '@/api/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import type { CourseLesson, CourseModule } from '@/types/course';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import React, { useState } from 'react';

interface CourseModulesManagerProps {
  courseId: string;
}

export function CourseModulesManager({ courseId }: CourseModulesManagerProps) {
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleDialog, setModuleDialog] = useState<{
    open: boolean;
    module?: CourseModule;
  }>({ open: false });
  const [lessonDialog, setLessonDialog] = useState<{
    open: boolean;
    moduleId?: string;
    lesson?: CourseLesson;
  }>({ open: false });

  const { data: modules, isLoading } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: () => coursesApi.getCourseModules(courseId),
  });

  const createModuleMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      coursesApi.createModule(courseId, {
        ...data,
        order: modules?.length || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setModuleDialog({ open: false });
      toast({ title: 'Módulo criado com sucesso!' });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseModule> }) =>
      coursesApi.updateModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setModuleDialog({ open: false });
      toast({ title: 'Módulo atualizado com sucesso!' });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => coursesApi.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      toast({ title: 'Módulo excluído com sucesso!' });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({
      moduleId,
      data,
    }: {
      moduleId: string;
      data: { title: string; description?: string; content?: string; duration?: number };
    }) => {
      const module = modules?.find((m) => m.id === moduleId);
      return coursesApi.createLesson(moduleId, {
        ...data,
        order: module?.lessons?.length || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setLessonDialog({ open: false });
      toast({ title: 'Aula criada com sucesso!' });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseLesson> }) =>
      coursesApi.updateLesson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setLessonDialog({ open: false });
      toast({ title: 'Aula atualizada com sucesso!' });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => coursesApi.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      toast({ title: 'Aula excluída com sucesso!' });
    },
  });

  const uploadVideoMutation = useMutation({
    mutationFn: ({ lessonId, file }: { lessonId: string; file: File }) =>
      coursesApi.uploadVideo(lessonId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      toast({ title: 'Vídeo enviado com sucesso!' });
    },
  });

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  if (isLoading) {
    return <div>Carregando módulos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos do Curso</h3>
        <Button onClick={() => setModuleDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Módulo
        </Button>
      </div>

      <div className="space-y-2">
        {modules?.map((module, index) => (
          <Card key={module.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      Módulo {index + 1}: {module.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({module.lessons.length} aulas)
                    </span>
                  </button>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModuleDialog({ open: true, module })}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Deseja excluir este módulo e todas suas aulas?')) {
                        deleteModuleMutation.mutate(module.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedModules.has(module.id) && (
              <CardContent>
                <div className="space-y-2">
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                  )}

                  <div className="space-y-1">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.videoUrl ? (
                            <Video className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                          {lesson.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration} min
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setLessonDialog({
                                open: true,
                                moduleId: module.id,
                                lesson,
                              })
                            }
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Deseja excluir esta aula?')) {
                                deleteLessonMutation.mutate(lesson.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setLessonDialog({ open: true, moduleId: module.id })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Aula
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Module Dialog */}
      <Dialog open={moduleDialog.open} onOpenChange={(open) => setModuleDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{moduleDialog.module ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
              };

              if (moduleDialog.module) {
                updateModuleMutation.mutate({
                  id: moduleDialog.module.id,
                  data,
                });
              } else {
                createModuleMutation.mutate(data);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="title" className="text-sm font-medium">
                Título do Módulo
              </label>
              <Input id="title" name="title" defaultValue={moduleDialog.module?.title} required />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <Textarea
                id="description"
                name="description"
                defaultValue={moduleDialog.module?.description}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModuleDialog({ open: false })}
              >
                Cancelar
              </Button>
              <Button type="submit">{moduleDialog.module ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog.open} onOpenChange={(open) => setLessonDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lessonDialog.lesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                content: formData.get('content') as string,
                duration: Number.parseInt(formData.get('duration') as string) || undefined,
              };

              if (lessonDialog.lesson) {
                updateLessonMutation.mutate({
                  id: lessonDialog.lesson.id,
                  data,
                });
              } else if (lessonDialog.moduleId) {
                createLessonMutation.mutate({
                  moduleId: lessonDialog.moduleId,
                  data,
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="lesson-title" className="text-sm font-medium">
                Título da Aula
              </label>
              <Input
                id="lesson-title"
                name="title"
                defaultValue={lessonDialog.lesson?.title}
                required
              />
            </div>
            <div>
              <label htmlFor="lesson-description" className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <Textarea
                id="lesson-description"
                name="description"
                defaultValue={lessonDialog.lesson?.description}
                rows={2}
              />
            </div>
            <div>
              <label htmlFor="lesson-content" className="text-sm font-medium">
                Conteúdo da Aula
              </label>
              <Textarea
                id="lesson-content"
                name="content"
                defaultValue={lessonDialog.lesson?.content}
                rows={5}
                placeholder="Conteúdo em texto da aula..."
              />
            </div>
            <div>
              <label htmlFor="lesson-duration" className="text-sm font-medium">
                Duração (minutos)
              </label>
              <Input
                id="lesson-duration"
                name="duration"
                type="number"
                defaultValue={lessonDialog.lesson?.duration}
                placeholder="Ex: 30"
              />
            </div>
            {lessonDialog.lesson && (
              <div>
                <label className="text-sm font-medium">Vídeo da Aula</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && lessonDialog.lesson) {
                      uploadVideoMutation.mutate({
                        lessonId: lessonDialog.lesson.id,
                        file,
                      });
                    }
                  }}
                  className="w-full mt-1"
                />
                {lessonDialog.lesson.videoUrl && (
                  <p className="text-sm text-green-600 mt-1">✓ Vídeo já enviado</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLessonDialog({ open: false })}
              >
                Cancelar
              </Button>
              <Button type="submit">{lessonDialog.lesson ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
