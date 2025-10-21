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
import api from '@/services/api';
import type { AcademicArea, Course, CourseFormData } from '@/types/course';
import { BRLToCents, centsToBRL } from '@/utils/course-formatters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Clock, DollarSign, FileText, GraduationCap, Loader2, Upload, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const EditCoursePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
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
  });

  // Buscar curso da API
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data as Course;
    },
    enabled: !!id,
  });

  // Mutation para atualizar curso
  const updateMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      await api.put(`/admin/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success('Curso atualizado com sucesso!');
      navigate('/admin/cursos');
    },
    onError: () => {
      toast.error('Erro ao atualizar curso');
    },
  });

  // Preencher formulário quando curso carregar
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        academicArea: course.academicArea,
        instructorName: course.instructorName || '',
        instructorBio: course.instructorBio || '',
        price: course.price,
        duration: course.duration,
        status: course.status,
        isFeatured: course.isFeatured !== undefined ? course.isFeatured : true,
      });
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.academicArea) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    updateMutation.mutate(formData);
  };

  const handlePriceChange = (value: string) => {
    // Remove tudo exceto números
    const numbersOnly = value.replace(/\D/g, '');
    // Converte para número em centavos
    const cents = Number.parseInt(numbersOnly, 10) || 0;
    setFormData((prev) => ({ ...prev, price: cents }));
  };

  const formatPrice = (cents: number): string => {
    if (cents === 0) return '';
    // Converte centavos para reais e formata
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }
      // Validar tamanho (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 50MB');
        return;
      }
      setThumbnailFile(file);
      toast.success(`Imagem selecionada: ${file.name}`);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('video/')) {
        toast.error('Por favor, selecione um vídeo válido');
        return;
      }
      // Validar tamanho (100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('O vídeo deve ter no máximo 100MB');
        return;
      }
      setVideoFile(file);
      toast.success(`Vídeo selecionado: ${file.name}`);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Carregando curso...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !course) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-destructive mb-2">
                {error ? 'Erro ao carregar curso' : 'Curso não encontrado'}
              </p>
              <Button onClick={() => navigate('/admin/cursos')}>Voltar para lista</Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Editar Curso</h1>
                  <p className="text-muted-foreground">Atualize as informações do curso</p>
                </div>
                <Button
                  onClick={() => navigate('/admin/cursos')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>Informações principais do curso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título do Curso *</Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="Digite o título do curso"
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição do Curso *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Descreva o conteúdo e objetivos do curso"
                          className="min-h-[100px] pl-10"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instrutor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Instrutor</CardTitle>
                    <CardDescription>Dados do instrutor responsável pelo curso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="instructorName">Nome do Instrutor</Label>
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
                          placeholder="Experiência e qualificações do instrutor"
                          className="min-h-[80px] pl-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detalhes do Curso */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Curso</CardTitle>
                    <CardDescription>Configurações de preço, duração e status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço (R$)</Label>
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
                        <Label htmlFor="duration">Duração Total (minutos)</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="duration"
                            type="number"
                            value={formData.duration || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                duration: Number.parseInt(e.target.value, 10) || 0,
                              }))
                            }
                            placeholder="Ex: 1200 (20 horas)"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
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
                      <Label htmlFor="status">Curso ativo</Label>
                    </div>

                    <div className="flex items-center space-x-2">
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
                      <Label htmlFor="isFeatured">Destacar curso na home</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Arquivos Atuais */}
                <Card>
                  <CardHeader>
                    <CardTitle>Arquivos do Curso</CardTitle>
                    <CardDescription>Arquivos atuais e opção de atualizar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="thumbnail">Thumbnail do Curso</Label>
                        {course.thumbnailUrl && !thumbnailFile && (
                          <div className="space-y-2">
                            <img
                              src={course.thumbnailUrl}
                              alt="Thumbnail atual"
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <p className="text-xs text-muted-foreground">
                              Thumbnail atual - Clique abaixo para alterar
                            </p>
                          </div>
                        )}
                        <div className="relative">
                          <input
                            type="file"
                            id="thumbnail"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            {thumbnailFile ? (
                              <p className="text-sm text-primary font-medium">
                                {thumbnailFile.name}
                              </p>
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Clique para {course.thumbnailUrl ? 'alterar' : 'fazer upload da'} thumbnail
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 50MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="video">Vídeo do Curso</Label>
                        {course.videoUrl && !videoFile && (
                          <div className="space-y-2">
                            <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Vídeo disponível</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Vídeo atual - Clique abaixo para alterar
                            </p>
                          </div>
                        )}
                        <div className="relative">
                          <input
                            type="file"
                            id="video"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            {videoFile ? (
                              <p className="text-sm text-primary font-medium">
                                {videoFile.name}
                              </p>
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Clique para {course.videoUrl ? 'alterar' : 'fazer upload do'} vídeo
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">MP4, MOV até 100MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/cursos')}
                    disabled={updateMutation.isPending}
                    className='w-full'
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} className='w-full'>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EditCoursePage;
