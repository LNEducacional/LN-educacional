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
import { Textarea } from '@/components/ui/textarea';
import { customPapersApi } from '@/api/custom-papers';
import { ArrowLeft, BookOpen, Calendar, FileText, GraduationCap, Hash, Tag, User, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Mapeamento de valores do banco para o formulário
const academicAreaToForm: Record<string, string> = {
  EXACT_SCIENCES: 'exact_sciences',
  BIOLOGICAL_SCIENCES: 'biological_sciences',
  HEALTH_SCIENCES: 'health_sciences',
  HEALTH: 'health_sciences', // Compatibilidade com valor antigo
  APPLIED_SOCIAL_SCIENCES: 'applied_social_sciences',
  SOCIAL_SCIENCES: 'social_sciences',
  ENGINEERING: 'engineering',
  ARTS: 'languages',
  ADMINISTRATION: 'applied_social_sciences',
  LAW: 'applied_social_sciences',
  EDUCATION: 'humanities',
  PSYCHOLOGY: 'humanities',
  ACCOUNTING: 'applied_social_sciences',
  ECONOMICS: 'applied_social_sciences',
  OTHER: 'other',
};

const paperTypeToForm: Record<string, string> = {
  ARTICLE: 'article',
  SUMMARY: 'summary',
  REVIEW: 'review',
  THESIS: 'thesis',
  DISSERTATION: 'dissertation',
  MONOGRAPHY: 'monography',
  CASE_STUDY: 'case_study',
  PROJECT: 'project',
  ESSAY: 'essay',
};

const EditCustomPaperPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    paperType: '',
    academicArea: '',
    pageCount: 10,
    deadline: '',
    urgency: 'NORMAL',
    requirements: '',
    keywords: '',
    references: '',
  });

  useEffect(() => {
    const fetchCustomPaper = async () => {
      if (!id) return;

      try {
        setFetching(true);
        const response = await customPapersApi.getAdminRequestDetails(id);
        const paper = response.data;

        // Converter a data para o formato YYYY-MM-DD
        const deadlineDate = new Date(paper.deadline);
        const formattedDeadline = deadlineDate.toISOString().split('T')[0];

        setFormData({
          title: paper.title || '',
          description: paper.description || '',
          paperType: paperTypeToForm[paper.paperType] || paper.paperType?.toLowerCase() || '',
          academicArea: academicAreaToForm[paper.academicArea] || paper.academicArea?.toLowerCase() || '',
          pageCount: paper.pageCount || 10,
          deadline: formattedDeadline,
          urgency: paper.urgency || 'NORMAL',
          requirements: paper.requirements || '',
          keywords: paper.keywords || '',
          references: paper.references || '',
        });
      } catch (error: any) {
        console.error('Erro ao buscar trabalho:', error);
        toast.error('Erro ao carregar o trabalho personalizado');
        navigate('/admin/custom-papers');
      } finally {
        setFetching(false);
      }
    };

    fetchCustomPaper();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.deadline || !formData.requirements) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Atualizar o trabalho personalizado
      await customPapersApi.updateRequest(id!, {
        ...formData,
        academicArea: formData.academicArea.toUpperCase(),
        paperType: formData.paperType.toUpperCase(),
        deadline: new Date(formData.deadline).toISOString(),
      });

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['admin-custom-papers'] });

      toast.success('Trabalho personalizado atualizado com sucesso!');
      navigate('/admin/custom-papers');
    } catch (error: any) {
      console.error('Erro ao atualizar trabalho:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar trabalho personalizado');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Carregando...</h2>
                <p className="text-muted-foreground">Buscando informações do trabalho</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Trabalho Personalizado</h1>
                <p className="text-muted-foreground">Atualize as informações do trabalho personalizado</p>
              </div>
              <Button
                onClick={() => navigate('/admin/custom-papers')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Trabalho</CardTitle>
                  <CardDescription>Preencha os dados do trabalho personalizado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Digite o título do trabalho"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pageCount">Número de Páginas *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          value={formData.pageCount}
                          onChange={(e) =>
                            setFormData({ ...formData, pageCount: parseInt(e.target.value, 10) })
                          }
                          placeholder="Ex: 50"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="paperType">Tipo de Trabalho *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.paperType}
                          onValueChange={(value) => setFormData({ ...formData, paperType: value })}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Artigo</SelectItem>
                            <SelectItem value="summary">Resumo</SelectItem>
                            <SelectItem value="review">Resenha</SelectItem>
                            <SelectItem value="thesis">TCC</SelectItem>
                            <SelectItem value="dissertation">Dissertação</SelectItem>
                            <SelectItem value="monography">Monografia</SelectItem>
                            <SelectItem value="case_study">Estudo de Caso</SelectItem>
                            <SelectItem value="project">Projeto</SelectItem>
                            <SelectItem value="essay">Ensaio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academicArea">Área Acadêmica *</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.academicArea}
                          onValueChange={(value) => setFormData({ ...formData, academicArea: value })}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exact_sciences">Ciências Exatas</SelectItem>
                            <SelectItem value="biological_sciences">Ciências Biológicas</SelectItem>
                            <SelectItem value="health_sciences">Ciências da Saúde</SelectItem>
                            <SelectItem value="applied_social_sciences">
                              Ciências Sociais Aplicadas
                            </SelectItem>
                            <SelectItem value="humanities">Ciências Humanas</SelectItem>
                            <SelectItem value="engineering">Engenharias</SelectItem>
                            <SelectItem value="languages">Linguística/Letras/Artes</SelectItem>
                            <SelectItem value="agricultural_sciences">Ciências Agrárias</SelectItem>
                            <SelectItem value="multidisciplinary">Multidisciplinar</SelectItem>
                            <SelectItem value="social_sciences">Ciências Sociais</SelectItem>
                            <SelectItem value="other">Outras</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Prazo de Entrega *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgência *</Label>
                      <div className="relative">
                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.urgency}
                          onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORMAL">Normal</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                            <SelectItem value="VERY_URGENT">Muito Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o trabalho"
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requisitos *</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Liste os requisitos específicos do trabalho"
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Palavras-chave</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="keywords"
                          value={formData.keywords}
                          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                          placeholder="Ex: metodologia, análise, pesquisa"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="references">Referências</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="references"
                          value={formData.references}
                          onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                          placeholder="Referências bibliográficas"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/admin/custom-papers')}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EditCustomPaperPage;
