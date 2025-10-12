import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Badge } from '@/components/ui/badge';
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
import { useApi, useApiMutation } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import type { AcademicArea, PaperType, ReadyPaper } from '@/types/paper';
import { formatKeywords } from '@/utils/paper-formatters';
import {
  FileText,
  User,
  BookOpen,
  GraduationCap,
  Hash,
  Globe,
  Eye,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditFreePaperPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'courses'
    | 'users'
    | 'categories'
    | 'notifications'
    | 'settings'
    | 'ready-papers'
    | 'free-papers'
  >('free-papers');

  const {
    data: paper,
    loading,
    error,
  } = useApi<ReadyPaper>(`/admin/free-papers/${id}`, { dependencies: [id] });

  const updatePaper = useApiMutation<ReadyPaper, Partial<ReadyPaper>>('put');

  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    paperType: '' as PaperType | '',
    academicArea: '' as AcademicArea | '',
    pageCount: '',
    description: '',
    language: 'pt',
    file: null as File | null,
    thumbnail: null as File | null,
    preview: null as File | null,
  });

  useEffect(() => {
    if (paper && !error) {
      setFormData({
        title: paper.title,
        authorName: paper.authorName,
        paperType: paper.paperType,
        academicArea: paper.academicArea,
        pageCount: paper.pageCount.toString(),
        description: paper.description,
        language: paper.language,
        file: null,
        thumbnail: null,
        preview: null,
      });
      if (paper.keywords) {
        setKeywords(formatKeywords(paper.keywords));
      }
    }
  }, [paper, error]);

  const handleSectionChange = (
    section:
      | 'dashboard'
      | 'courses'
      | 'users'
      | 'categories'
      | 'notifications'
      | 'settings'
      | 'ready-papers'
      | 'free-papers'
  ) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else if (section === 'ready-papers') {
      navigate('/admin/ready-papers');
    } else if (section === 'free-papers') {
      navigate('/admin/free-papers');
    } else {
      navigate('/admin');
    }
  };

  const handleBack = () => {
    navigate('/admin/free-papers');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'file' | 'thumbnail' | 'preview', file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords((prev) => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.authorName ||
      !formData.paperType ||
      !formData.academicArea ||
      !formData.pageCount ||
      !formData.description
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (!id) return;

    setSubmitting(true);

    try {
      await updatePaper.mutate(`/admin/free-papers/${id}`, {
        title: formData.title,
        authorName: formData.authorName,
        paperType: formData.paperType,
        academicArea: formData.academicArea,
        pageCount: Number.parseInt(formData.pageCount, 10),
        description: formData.description,
        language: formData.language,
        keywords: keywords.join(', '),
      });

      toast({
        title: 'Trabalho gratuito atualizado com sucesso!',
        description: 'As alterações foram salvas.',
      });

      navigate('/admin/free-papers');
    } catch (_error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
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

  if (error || !paper) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Trabalho não encontrado
                </h2>
                <p className="text-muted-foreground mb-4">
                  {error || 'O trabalho solicitado não foi encontrado.'}
                </p>
                <Button onClick={handleBack}>Voltar para Lista</Button>
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
        <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Editar Trabalho Gratuito</h1>
                  <p className="text-muted-foreground">
                    Atualize as informações do trabalho gratuito
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados fundamentais do trabalho</CardDescription>
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
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Digite o título do trabalho"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorName">Autor *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="authorName"
                          value={formData.authorName}
                          onChange={(e) => handleInputChange('authorName', e.target.value)}
                          placeholder="Nome do autor"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="paperType">Tipo *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.paperType}
                          onValueChange={(value) => handleInputChange('paperType', value)}
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
                          onValueChange={(value) => handleInputChange('academicArea', value)}
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
                      <Label htmlFor="pageCount">Nº de páginas *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          value={formData.pageCount}
                          onChange={(e) => handleInputChange('pageCount', e.target.value)}
                          placeholder="Ex: 50"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma *</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.language}
                          onValueChange={(value) => handleInputChange('language', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecione o idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="en">Inglês</SelectItem>
                            <SelectItem value="es">Espanhol</SelectItem>
                            <SelectItem value="fr">Francês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o conteúdo do trabalho"
                        className="min-h-[100px] pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Palavras-chave</Label>
                    <div className="flex gap-2">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Digite uma palavra-chave"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                      />
                      <Button type="button" onClick={addKeyword} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="gap-1">
                            {keyword}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeKeyword(keyword)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Arquivos */}
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos do Trabalho</CardTitle>
                  <CardDescription>Upload do arquivo principal, thumbnail e preview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="file">Arquivo Principal</Label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('file', e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        {formData.file ? (
                          <p className="text-sm text-primary font-medium">
                            {formData.file.name}
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Clique para fazer upload do arquivo principal
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX</p>
                            {paper.fileUrl && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Arquivo atual: {paper.fileUrl.split('/').pop()}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">Thumbnail</Label>
                      <div className="relative">
                        <input
                          type="file"
                          id="thumbnail"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange('thumbnail', e.target.files?.[0] || null)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          {formData.thumbnail ? (
                            <p className="text-sm text-primary font-medium">
                              {formData.thumbnail.name}
                            </p>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Clique para upload
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preview">Preview</Label>
                      <div className="relative">
                        <input
                          type="file"
                          id="preview"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange('preview', e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                          <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          {formData.preview ? (
                            <p className="text-sm text-primary font-medium">
                              {formData.preview.name}
                            </p>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Clique para upload
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">PDF, DOC</p>
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
                  onClick={handleBack}
                  disabled={submitting}
                  className="w-full"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
      </div>
    </SidebarProvider>
  );
}
