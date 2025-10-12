import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { Edit, Eye, Loader2, Plus, Search, Trash2, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  price: number;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  thumbnailUrl?: string;
  isActive: boolean;
  enrollmentCount: number;
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function AdminCoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    price: 0,
    duration: 0,
    level: 'BEGINNER' as const,
    isActive: true,
  });

  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: '',
    order: 1,
  });

  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0,
    order: 1,
    moduleId: '',
  });

  const { data: categories } = useApi<Category[]>('/categories');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/courses', {
        params: { search: searchQuery },
      });
      setCourses(response.data);
    } catch (_error) {
      toast({
        title: 'Erro ao carregar cursos',
        description: 'Não foi possível carregar a lista de cursos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreate = async () => {
    try {
      const formDataToSend = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        formDataToSend.append(key, value.toString());
      }

      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      const _response = await api.post('/admin/courses', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Curso criado com sucesso',
        description: 'O curso foi adicionado à plataforma',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (_error) {
      toast({
        title: 'Erro ao criar curso',
        description: 'Não foi possível criar o curso',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedCourse) return;

    try {
      const formDataToSend = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        formDataToSend.append(key, value.toString());
      }

      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      await api.put(`/admin/courses/${selectedCourse.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Curso atualizado com sucesso',
        description: 'As alterações foram salvas',
      });

      setIsEditDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (_error) {
      toast({
        title: 'Erro ao atualizar curso',
        description: 'Não foi possível atualizar o curso',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      await api.delete(`/admin/courses/${selectedCourse.id}`);

      toast({
        title: 'Curso removido',
        description: 'O curso foi removido com sucesso',
      });

      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (_error) {
      toast({
        title: 'Erro ao remover curso',
        description: 'Não foi possível remover o curso',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      await api.patch(`/admin/courses/${course.id}/toggle-active`);
      fetchCourses();
      toast({
        title: course.isActive ? 'Curso desativado' : 'Curso ativado',
        description: `O curso foi ${course.isActive ? 'desativado' : 'ativado'} com sucesso`,
      });
    } catch (_error) {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do curso',
        variant: 'destructive',
      });
    }
  };

  const handleAddModule = async () => {
    if (!selectedCourse) return;

    try {
      await api.post(`/admin/courses/${selectedCourse.id}/modules`, moduleFormData);

      toast({
        title: 'Módulo adicionado',
        description: 'O módulo foi adicionado ao curso',
      });

      setModuleFormData({ title: '', description: '', order: 1 });
      fetchCourseDetails(selectedCourse.id);
    } catch (_error) {
      toast({
        title: 'Erro ao adicionar módulo',
        description: 'Não foi possível adicionar o módulo',
        variant: 'destructive',
      });
    }
  };

  const handleAddLesson = async () => {
    if (!selectedCourse || !lessonFormData.moduleId) return;

    try {
      await api.post(
        `/admin/courses/${selectedCourse.id}/modules/${lessonFormData.moduleId}/lessons`,
        {
          title: lessonFormData.title,
          description: lessonFormData.description,
          videoUrl: lessonFormData.videoUrl,
          duration: lessonFormData.duration,
          order: lessonFormData.order,
        }
      );

      toast({
        title: 'Aula adicionada',
        description: 'A aula foi adicionada ao módulo',
      });

      setLessonFormData({
        title: '',
        description: '',
        videoUrl: '',
        duration: 0,
        order: 1,
        moduleId: '',
      });
      fetchCourseDetails(selectedCourse.id);
    } catch (_error) {
      toast({
        title: 'Erro ao adicionar aula',
        description: 'Não foi possível adicionar a aula',
        variant: 'destructive',
      });
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      const response = await api.get(`/admin/courses/${courseId}`);
      setSelectedCourse(response.data);
    } catch (_error) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar os detalhes do curso',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructor: '',
      category: '',
      price: 0,
      duration: 0,
      level: 'BEGINNER',
      isActive: true,
    });
    setThumbnailFile(null);
    setSelectedCourse(null);
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      category: course.category,
      price: course.price / 100,
      duration: course.duration,
      level: course.level,
      isActive: course.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openModulesDialog = async (course: Course) => {
    await fetchCourseDetails(course.id);
    setIsModulesDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      BEGINNER: 'secondary',
      INTERMEDIATE: 'default',
      ADVANCED: 'destructive',
    } as const;

    const labels = {
      BEGINNER: 'Iniciante',
      INTERMEDIATE: 'Intermediário',
      ADVANCED: 'Avançado',
    };

    return (
      <Badge variant={variants[level as keyof typeof variants]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
          <p className="text-muted-foreground">Gerencie os cursos disponíveis na plataforma</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <Video className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum curso encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Comece criando um novo curso.</p>
            </div>
          ) : (
            <div className="divide-y">
              {courses.map((course) => (
                <div key={course.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {course.thumbnailUrl && (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          <Badge variant={course.isActive ? 'default' : 'secondary'}>
                            {course.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {getLevelBadge(course.level)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Instrutor: <span className="text-foreground">{course.instructor}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Duração:{' '}
                            <span className="text-foreground">
                              {formatDuration(course.duration)}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Alunos:{' '}
                            <span className="text-foreground">{course.enrollmentCount}</span>
                          </span>
                          <span className="font-medium text-primary">
                            {formatPrice(course.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={course.isActive}
                        onCheckedChange={() => handleToggleActive(course)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openModulesDialog(course)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
            <DialogDescription>Adicione um novo curso à plataforma</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título do curso"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o conteúdo do curso"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="instructor">Instrutor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Nome do instrutor"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number.parseFloat(e.target.value) })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Number.parseInt(e.target.value, 10) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Nível</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      level: value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Iniciante</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediário</SelectItem>
                    <SelectItem value="ADVANCED">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Imagem de Capa</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Curso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Módulos e Aulas</DialogTitle>
            <DialogDescription>{selectedCourse?.title}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="modules" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="lessons">Aulas</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <div className="grid gap-4 p-4 border rounded">
                <h3 className="font-semibold">Adicionar Novo Módulo</h3>
                <div className="grid gap-2">
                  <Label>Título do Módulo</Label>
                  <Input
                    value={moduleFormData.title}
                    onChange={(e) =>
                      setModuleFormData({ ...moduleFormData, title: e.target.value })
                    }
                    placeholder="Ex: Introdução ao Curso"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={moduleFormData.description}
                    onChange={(e) =>
                      setModuleFormData({ ...moduleFormData, description: e.target.value })
                    }
                    placeholder="Descreva o conteúdo do módulo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={moduleFormData.order}
                    onChange={(e) =>
                      setModuleFormData({
                        ...moduleFormData,
                        order: Number.parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>
                <Button onClick={handleAddModule}>Adicionar Módulo</Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Módulos Existentes</h3>
                {selectedCourse?.modules?.map((module) => (
                  <div key={module.id} className="p-4 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {module.order}. {module.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.lessons?.length || 0} aulas
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <div className="grid gap-4 p-4 border rounded">
                <h3 className="font-semibold">Adicionar Nova Aula</h3>
                <div className="grid gap-2">
                  <Label>Módulo</Label>
                  <Select
                    value={lessonFormData.moduleId}
                    onValueChange={(value) =>
                      setLessonFormData({ ...lessonFormData, moduleId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCourse?.modules?.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Título da Aula</Label>
                  <Input
                    value={lessonFormData.title}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, title: e.target.value })
                    }
                    placeholder="Ex: Configurando o ambiente"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={lessonFormData.description}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, description: e.target.value })
                    }
                    placeholder="Descreva o conteúdo da aula"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>URL do Vídeo</Label>
                    <Input
                      value={lessonFormData.videoUrl}
                      onChange={(e) =>
                        setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Duração (min)</Label>
                    <Input
                      type="number"
                      value={lessonFormData.duration}
                      onChange={(e) =>
                        setLessonFormData({
                          ...lessonFormData,
                          duration: Number.parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={lessonFormData.order}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        order: Number.parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>
                <Button onClick={handleAddLesson}>Adicionar Aula</Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Aulas por Módulo</h3>
                {selectedCourse?.modules?.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">{module.title}</h4>
                    {module.lessons?.map((lesson) => (
                      <div key={lesson.id} className="p-3 border rounded ml-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {lesson.order}. {lesson.title}
                            </p>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Duração: {formatDuration(lesson.duration)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>Atualize as informações do curso</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título do curso"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o conteúdo do curso"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-instructor">Instrutor</Label>
                <Input
                  id="edit-instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Nome do instrutor"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Preço (R$)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number.parseFloat(e.target.value) })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Duração (min)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Number.parseInt(e.target.value, 10) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-level">Nível</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      level: value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Iniciante</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediário</SelectItem>
                    <SelectItem value="ADVANCED">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-thumbnail">
                Imagem de Capa (deixe vazio para manter a atual)
              </Label>
              <Input
                id="edit-thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o curso "{selectedCourse?.title}"? Esta ação não pode
              ser desfeita e removerá todos os módulos e aulas associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
