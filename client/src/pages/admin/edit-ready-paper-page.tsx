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
import { FileUploadField } from '@/components/admin/file-upload-field';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { AcademicArea, PaperType, ReadyPaper } from '@/types/paper';
import { formatKeywords } from '@/utils/paper-formatters';
import {
  ArrowLeft,
  BookOpen,
  DollarSign,
  FileText,
  FileType,
  Globe,
  GraduationCap,
  Hash,
  Loader2,
  Plus,
  Upload,
  User,
  X
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function EditReadyPaperPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'courses' | 'users' | 'categories' | 'notifications' | 'settings'
  >('dashboard');

  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    paperType: '' as PaperType | '',
    academicArea: '' as AcademicArea | '',
    pageCount: '',
    price: '',
    description: '',
    language: 'pt',
    file: null as File | null,
    thumbnail: null as File | null,
    preview: null as File | null,
  });

  // Estado para controlar arquivos existentes que foram removidos
  const [clearedFiles, setClearedFiles] = useState({
    file: false,
    thumbnail: false,
    preview: false,
  });

  // Buscar paper da API
  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['paper', id],
    queryFn: async () => {
      const response = await api.get<ReadyPaper>(`/admin/papers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Mutation para atualizar paper
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.put(`/admin/papers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper', id] });
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({
        title: 'Trabalho atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
      navigate('/admin/ready-papers');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.response?.data?.error || 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Preencher formulário quando paper carregar
  useEffect(() => {
    if (paper) {
      setFormData({
        title: paper.title,
        authorName: paper.authorName,
        paperType: paper.paperType.toLowerCase(),
        academicArea: paper.academicArea.toLowerCase(),
        pageCount: paper.pageCount.toString(),
        price: (paper.price / 100).toString(),
        description: paper.description,
        language: paper.language,
        file: null,
        thumbnail: null,
        preview: null,
      });
      setKeywords(formatKeywords(paper.keywords));
    }
  }, [paper]);

  const handleSectionChange = (
    section: 'dashboard' | 'courses' | 'users' | 'categories' | 'notifications' | 'settings'
  ) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else {
      navigate('/admin');
    }
  };

  const handleBack = () => {
    navigate('/admin/ready-papers');
  };

  const handleViewPaper = () => {
    if (id) {
      navigate(`/admin/ready-papers/details/${id}`);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (value: string) => {
    // Remove tudo exceto números e vírgula
    const numbersOnly = value.replace(/[^\d,]/g, '');
    // Permitir apenas uma vírgula
    const parts = numbersOnly.split(',');
    const formattedValue = parts.length > 2 ? `${parts[0]},${parts.slice(1).join('')}` : numbersOnly;
    setFormData((prev) => ({ ...prev, price: formattedValue }));
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
      !formData.price ||
      !formData.description
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Criar FormData
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('authorName', formData.authorName);
    formDataToSend.append('paperType', formData.paperType);
    formDataToSend.append('academicArea', formData.academicArea);
    formDataToSend.append('pageCount', formData.pageCount);

    // Converter preço de reais para centavos
    const priceInReais = parseFloat(formData.price.replace(',', '.'));
    const priceInCents = Math.round(priceInReais * 100);
    formDataToSend.append('price', priceInCents.toString());

    formDataToSend.append('description', formData.description);
    formDataToSend.append('language', formData.language);
    formDataToSend.append('keywords', keywords.join(','));
    formDataToSend.append('isFree', 'false');

    // Adicionar arquivos se houver
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }
    if (formData.thumbnail) {
      formDataToSend.append('thumbnail', formData.thumbnail);
    }
    if (formData.preview) {
      formDataToSend.append('preview', formData.preview);
    }

    updateMutation.mutate(formDataToSend);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
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
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">
                  Trabalho não encontrado
                </h2>
                <p className="text-muted-foreground">
                  O trabalho solicitado não foi encontrado.
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
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Trabalho Pronto</h1>
                <p className="text-muted-foreground">Atualize as informações do trabalho</p>
              </div>
              <Button
                onClick={handleBack}
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
                  <CardDescription>Dados fundamentais do trabalho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorName">Nome do Autor *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="authorName"
                          value={formData.authorName}
                          onChange={(e) => handleInputChange('authorName', e.target.value)}
                          className="pl-10"
                          required
                        />
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
                        className="min-h-[100px] pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          key={formData.language || 'language-select'}
                          value={formData.language}
                          onValueChange={(value) => handleInputChange('language', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue />
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
                    <div className="space-y-2">
                      <Label>Palavras-chave</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Digite uma palavra-chave"
                            className="pl-10"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addKeyword();
                              }
                            }}
                          />
                        </div>
                        <Button type="button" onClick={addKeyword} size="icon">
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
                  </div>
                </CardContent>
              </Card>

              {/* Classificação */}
              <Card>
                <CardHeader>
                  <CardTitle>Classificação</CardTitle>
                  <CardDescription>Tipo e área acadêmica do trabalho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paperType">Tipo de Trabalho *</Label>
                      <div className="relative">
                        <FileType className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          key={formData.paperType || 'paperType-select'}
                          value={formData.paperType}
                          onValueChange={(value) => handleInputChange('paperType', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue />
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="academicArea">Área Acadêmica *</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          key={formData.academicArea || 'academicArea-select'}
                          value={formData.academicArea}
                          onValueChange={(value) => handleInputChange('academicArea', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue />
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
                            <SelectItem value="administration">Administração</SelectItem>
                            <SelectItem value="economics">Economia</SelectItem>
                            <SelectItem value="psychology">Psicologia</SelectItem>
                            <SelectItem value="law">Direito</SelectItem>
                            <SelectItem value="education">Educação</SelectItem>
                            <SelectItem value="other">Outras</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes Técnicos */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes Técnicos</CardTitle>
                  <CardDescription>Informações sobre páginas e preço</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageCount">Número de Páginas *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          value={formData.pageCount}
                          onChange={(e) => handleInputChange('pageCount', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="text"
                          value={formData.price}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          placeholder="0,00"
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Digite o valor em reais (ex: 99,90)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arquivos */}
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos do Trabalho</CardTitle>
                  <CardDescription>Arquivos atuais e opção de atualizar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FileUploadField
                    label="Arquivo do Trabalho"
                    accept=".pdf,.doc,.docx"
                    file={formData.file}
                    existingFileUrl={!clearedFiles.file ? (paper.fileUrl || undefined) : undefined}
                    existingFileName={paper.title ? `${paper.title}.pdf` : undefined}
                    onChange={(file) => handleFileChange('file', file)}
                    onClearExisting={() => setClearedFiles({ ...clearedFiles, file: true })}
                    maxSize="50MB"
                    fileTypes="PDF, DOC, DOCX"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploadField
                      label="Thumbnail"
                      accept="image/*"
                      file={formData.thumbnail}
                      existingFileUrl={!clearedFiles.thumbnail ? (paper.thumbnailUrl || undefined) : undefined}
                      existingFileName={paper.title ? `${paper.title}-thumbnail` : undefined}
                      onChange={(file) => handleFileChange('thumbnail', file)}
                      onClearExisting={() => setClearedFiles({ ...clearedFiles, thumbnail: true })}
                      isImage
                      maxSize="10MB"
                      fileTypes="PNG, JPG"
                    />

                    <FileUploadField
                      label="Preview"
                      accept=".pdf,.doc,.docx"
                      file={formData.preview}
                      existingFileUrl={!clearedFiles.preview ? (paper.previewUrl || undefined) : undefined}
                      existingFileName={paper.title ? `${paper.title}-preview.pdf` : undefined}
                      onChange={(file) => handleFileChange('preview', file)}
                      onClearExisting={() => setClearedFiles({ ...clearedFiles, preview: true })}
                      maxSize="10MB"
                      fileTypes="PDF, DOC, DOCX"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
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
                <Button type="button" variant="outline" onClick={handleBack} className='w-full'>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
