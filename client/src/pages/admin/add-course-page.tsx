import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AcademicArea } from '@/types/course';
import { BookOpen, Clock, DollarSign, FileText, GraduationCap, Loader2, Upload, User, Users } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { CourseContentManager, type CourseModule } from '@/components/admin/course-content-manager';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface CourseFormData {
  title: string;
  description: string;
  academicArea: AcademicArea;
  instructorName: string;
  instructorBio: string;
  price: number;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  thumbnailUrl?: string;
}

const AddCoursePageNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams(); // Pegar ID da URL para modo de edição
  const isEditMode = !!id; // Detectar se está editando

  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    academicArea: 'other' as AcademicArea,
    instructorName: '',
    instructorBio: '',
    price: 0,
    duration: 0,
    status: 'ACTIVE',
    isFeatured: true,
    level: 'BEGINNER',
  });

  const [modules, setModules] = useState<CourseModule[]>([]);

  // Buscar curso quando está em modo de edição
  const { data: existingCourse, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await api.get(`/admin/courses/${id}`);
      return response.data;
    },
    enabled: !!id, // Só busca se tiver ID
  });

  // Preencher formulário quando carregar curso existente
  useEffect(() => {
    if (existingCourse) {
      setFormData({
        title: existingCourse.title || '',
        description: existingCourse.description || '',
        academicArea: (existingCourse.academicArea?.toLowerCase() || 'other') as AcademicArea,
        instructorName: existingCourse.instructorName || '',
        instructorBio: existingCourse.instructorBio || '',
        price: existingCourse.price || 0,
        duration: existingCourse.duration || 0,
        status: existingCourse.status || 'ACTIVE',
        isFeatured: existingCourse.isFeatured ?? true,
        level: existingCourse.level || 'BEGINNER',
        thumbnailUrl: existingCourse.thumbnailUrl || '',
      });

      setModules(existingCourse.modules || []);
      setThumbnailPreview(existingCourse.thumbnailUrl || '');
    }
  }, [existingCourse]);

  // Memoize the modules change handler to prevent unnecessary re-renders
  const handleModulesChange = useCallback((updatedModules: CourseModule[]) => {
    setModules(updatedModules);
  }, []);

  const validateBasicInfo = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Título do curso é obrigatório');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Descrição do curso é obrigatória');
      return false;
    }
    if (!formData.instructorName.trim()) {
      toast.error('Nome do instrutor é obrigatório');
      return false;
    }
    if (!formData.academicArea || formData.academicArea.trim() === '') {
      toast.error('Área acadêmica é obrigatória');
      return false;
    }
    if (!formData.level || formData.level.trim() === '') {
      toast.error('Nível do curso é obrigatório');
      return false;
    }
    return true;
  };

  const validateContent = (): boolean => {
    if (modules.length === 0) {
      toast.error('Adicione pelo menos um módulo ao curso');
      return false;
    }

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      if (!module.title.trim()) {
        toast.error(`Módulo ${i + 1} precisa de um título`);
        return false;
      }
      if (module.lessons.length === 0) {
        toast.error(`Módulo "${module.title}" precisa ter pelo menos uma aula`);
        return false;
      }
      for (let j = 0; j < module.lessons.length; j++) {
        const lesson = module.lessons[j];
        if (!lesson.title.trim()) {
          toast.error(`Aula ${j + 1} do módulo "${module.title}" precisa de um título`);
          return false;
        }
        if (!lesson.videoUrl.trim()) {
          toast.error(`Aula "${lesson.title}" precisa de um vídeo do YouTube`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all tabs
    if (!validateBasicInfo()) {
      setCurrentTab('basic');
      return;
    }
    if (!validateContent()) {
      setCurrentTab('content');
      return;
    }

    setLoading(true);

    try {
      // Calculate total duration from lessons
      const totalDuration = modules.reduce(
        (acc, mod) => acc + mod.lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
        0
      );

      // Prepare course data
      const courseData = {
        title: formData.title,
        description: formData.description,
        academicArea: (formData.academicArea || 'OTHER').toUpperCase(),
        instructorName: formData.instructorName,
        instructorBio: formData.instructorBio,
        price: formData.price,
        duration: totalDuration || 480, // Use calculated duration or default
        status: formData.status,
        isFeatured: formData.isFeatured,
        level: formData.level || 'BEGINNER',
        thumbnailUrl: formData.thumbnailUrl || '',
      };

      let courseId: string;

      if (isEditMode) {
        // Update existing course
        await api.put(`/admin/courses/${id}`, courseData);
        courseId = id!;

        // Delete existing modules (cascade will delete lessons)
        if (existingCourse?.modules) {
          for (const module of existingCourse.modules) {
            await api.delete(`/admin/modules/${module.id}`);
          }
        }
      } else {
        // Create new course
        const courseResponse = await api.post('/admin/courses', courseData);
        courseId = courseResponse.data.id;
      }

      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('file', thumbnailFile);
        await api.post(`/admin/courses/${courseId}/thumbnail`, thumbnailFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Create modules and lessons
      for (const module of modules) {
        const moduleData = {
          courseId,
          title: module.title,
          description: module.description,
          order: module.order,
        };

        const moduleResponse = await api.post(`/admin/courses/${courseId}/modules`, moduleData);
        const moduleId = moduleResponse.data.id;

        // Create lessons for this module
        for (const lesson of module.lessons) {
          const lessonData = {
            moduleId,
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            content: lesson.content || '',
            duration: lesson.duration || 0,
            order: lesson.order,
          };

          await api.post(`/admin/modules/${moduleId}/lessons`, lessonData);
        }
      }

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['featured-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });

      toast.success(isEditMode ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!');
      navigate('/admin/cursos');
    } catch (error: any) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} curso:`, error);
      toast.error(error.response?.data?.error || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} curso`);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    const cents = Number.parseInt(numbersOnly, 10) || 0;
    setFormData((prev) => ({ ...prev, price: cents }));
  };

  const formatPrice = (cents: number): string => {
    if (cents === 0) return '';
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 10MB');
        return;
      }
      setThumbnailFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`Imagem selecionada: ${file.name}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {isEditMode ? 'Editar Curso' : 'Criar Novo Curso'}
                  </h1>
                  <p className="text-muted-foreground">
                    {isEditMode
                      ? 'Edite as informações, módulos e aulas do curso'
                      : 'Crie um curso completo com módulos e aulas em vídeo'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={currentTab} onValueChange={setCurrentTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                    <TabsTrigger value="content">Conteúdo do Curso</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-6">
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações do Curso</CardTitle>
                        <CardDescription>Dados principais e descrição do curso</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title">Título do Curso *</Label>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                                }
                                placeholder="Ex: Direito para Iniciantes"
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="academicArea">Área Acadêmica *</Label>
                            <div className="relative">
                              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                              <Select
                                value={formData.academicArea}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    academicArea: value as AcademicArea,
                                  }))
                                }
                              >
                                <SelectTrigger className="pl-10">
                                  <SelectValue placeholder="Selecione a área" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="administration">Administração</SelectItem>
                                  <SelectItem value="law">Direito</SelectItem>
                                  <SelectItem value="education">Educação</SelectItem>
                                  <SelectItem value="engineering">Engenharia</SelectItem>
                                  <SelectItem value="psychology">Psicologia</SelectItem>
                                  <SelectItem value="health">Saúde</SelectItem>
                                  <SelectItem value="accounting">Contabilidade</SelectItem>
                                  <SelectItem value="arts">Artes</SelectItem>
                                  <SelectItem value="economics">Economia</SelectItem>
                                  <SelectItem value="social_sciences">Ciências Sociais</SelectItem>
                                  <SelectItem value="other">Outros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="level">Nível do Curso *</Label>
                            <Select
                              key={`level-${existingCourse?.id || 'new'}`}
                              value={formData.level}
                              onValueChange={(value: any) =>
                                setFormData((prev) => ({ ...prev, level: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o nível" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEGINNER">Iniciante</SelectItem>
                                <SelectItem value="INTERMEDIATE">Intermediário</SelectItem>
                                <SelectItem value="ADVANCED">Avançado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Descrição do Curso *</Label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Descreva o conteúdo, objetivos e benefícios do curso"
                                className="min-h-[120px] pl-10"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Instructor */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Instrutor</CardTitle>
                        <CardDescription>Informações sobre o instrutor responsável</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="instructorName">Nome do Instrutor *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="instructorName"
                              value={formData.instructorName}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, instructorName: e.target.value }))
                              }
                              placeholder="Nome completo do instrutor"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instructorBio">Biografia do Instrutor</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea
                              id="instructorBio"
                              value={formData.instructorBio}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, instructorBio: e.target.value }))
                              }
                              placeholder="Experiência, qualificações e especialidades"
                              className="min-h-[100px] pl-10"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing & Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Preço e Configurações</CardTitle>
                        <CardDescription>Defina o valor e status do curso</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="price">Preço (R$) *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="price"
                                type="text"
                                value={formatPrice(formData.price)}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                placeholder="0,00"
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Thumbnail do Curso</Label>
                            <div className="relative">
                              <input
                                type="file"
                                id="thumbnail"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                                {thumbnailPreview ? (
                                  <div className="space-y-2">
                                    <img
                                      src={thumbnailPreview}
                                      alt="Preview"
                                      className="w-full h-32 object-cover rounded"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Clique para alterar
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      Clique para fazer upload
                                    </p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                              <Label htmlFor="status" className="text-base">Curso Ativo</Label>
                              <p className="text-sm text-muted-foreground">
                                Curso ficará visível para os alunos
                              </p>
                            </div>
                            <Switch
                              id="status"
                              checked={formData.status === 'ACTIVE'}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  status: checked ? 'ACTIVE' : 'INACTIVE',
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                              <Label htmlFor="isFeatured" className="text-base">Curso em Destaque</Label>
                              <p className="text-sm text-muted-foreground">
                                Exibir na seção de destaque da home
                              </p>
                            </div>
                            <Switch
                              id="isFeatured"
                              checked={formData.isFeatured}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isFeatured: checked,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/cursos')}
                        disabled={loading}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (validateBasicInfo()) {
                            setCurrentTab('content');
                          }
                        }}
                        disabled={loading}
                        className="flex-1"
                      >
                        Próximo: Adicionar Conteúdo
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-6 mt-6">
                    <CourseContentManager modules={modules} onChange={handleModulesChange} />

                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentTab('basic')}
                        disabled={loading}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button type="submit" disabled={loading || loadingCourse} className="flex-1">
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isEditMode ? 'Atualizando Curso...' : 'Criando Curso...'}
                          </>
                        ) : (
                          isEditMode ? 'Atualizar Curso' : 'Salvar Curso Completo'
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AddCoursePageNew;
