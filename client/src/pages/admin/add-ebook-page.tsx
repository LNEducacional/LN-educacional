import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from '@/hooks/use-toast';
import type { AcademicArea } from '@/types/ebook';
import { BookOpen, FileText, GraduationCap, DollarSign, Upload, User, ArrowLeft, X, FileCheck, ImagePlus } from 'lucide-react';
import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

export default function AddEbookPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [_activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'courses'
    | 'users'
    | 'categories'
    | 'notifications'
    | 'settings'
    | 'ready-papers'
    | 'free-papers'
    | 'ebooks'
  >('ebooks');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authorName: '',
    area: '' as AcademicArea | '',
    pageCount: '',
    isFree: false,
    price: '',
    files: [] as File[],
    cover: null as File | null,
  });

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Gerenciar preview da capa
  useEffect(() => {
    if (formData.cover) {
      const url = URL.createObjectURL(formData.cover);
      setCoverPreviewUrl(url);

      // Cleanup: revogar URL ao desmontar ou trocar arquivo
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setCoverPreviewUrl(null);
    }
  }, [formData.cover]);

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
      | 'ebooks'
  ) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else if (section === 'ready-papers') {
      navigate('/admin/ready-papers');
    } else if (section === 'free-papers') {
      navigate('/admin/free-papers');
    } else if (section === 'ebooks') {
      navigate('/admin/ebooks');
    } else {
      navigate('/admin');
    }
  };

  const handleBack = () => {
    navigate('/admin/ebooks');
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilesChange = (files: FileList | null) => {
    if (files) {
      setFormData((prev) => ({ ...prev, files: Array.from(files) }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, cover: null }));
    const coverInput = document.getElementById('cover') as HTMLInputElement;
    if (coverInput) coverInput.value = '';
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (
      !formData.authorName ||
      !formData.area ||
      !formData.pageCount ||
      formData.files.length === 0
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha autor, área, páginas e selecione pelo menos um arquivo.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.authorName.trim().length < 2) {
      toast({
        title: 'Nome do autor inválido',
        description: 'O nome do autor deve ter pelo menos 2 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.isFree && (!formData.price || Number.parseFloat(formData.price) <= 0)) {
      toast({
        title: 'Preço obrigatório',
        description: 'Para e-books pagos, é necessário definir um preço válido.',
        variant: 'destructive',
      });
      return;
    }

    const pageCount = Number.parseInt(formData.pageCount);
    if (formData.isFree && pageCount > 100) {
      toast({
        title: 'Número de páginas inválido',
        description: 'E-books gratuitos não devem exceder 100 páginas.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.isFree && pageCount < 10) {
      toast({
        title: 'Número de páginas inválido',
        description: 'E-books pagos devem ter pelo menos 10 páginas.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload da capa (se houver) - uma vez para todos
      let coverUrl: string | undefined = undefined;
      if (formData.cover) {
        const coverFormData = new FormData();
        coverFormData.append('file', formData.cover);
        const coverUploadResponse = await api.post('/admin/ebooks/upload-cover', coverFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        coverUrl = coverUploadResponse.data.url;
      }

      // Processar cada arquivo
      for (const file of formData.files) {
        try {
          // Upload do arquivo
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          const fileUploadResponse = await api.post('/admin/ebooks/upload-file', fileFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const fileUrl = fileUploadResponse.data.url;

          // Usar nome do arquivo como título (sem extensão)
          const fileName = file.name.replace(/\.[^/.]+$/, '');

          // Lógica de título:
          // - Se múltiplos arquivos: sempre usar nome do arquivo
          // - Se arquivo único E título foi preenchido: usar título do formulário
          // - Se arquivo único E título vazio: usar nome do arquivo
          const useFormTitle = formData.files.length === 1 && formData.title.trim();
          const ebookTitle = useFormTitle ? formData.title.trim() : fileName;
          const ebookDescription = useFormTitle && formData.description.trim()
            ? formData.description.trim()
            : `E-book: ${fileName}`;

          // Criar o e-book
          const ebookData = {
            title: ebookTitle,
            description: ebookDescription,
            authorName: formData.authorName,
            academicArea: formData.area,
            pageCount: pageCount,
            price: formData.isFree ? 0 : Math.round(Number.parseFloat(formData.price) * 100),
            fileUrl: fileUrl,
            coverUrl: coverUrl,
          };

          await api.post('/admin/ebooks', ebookData);
          successCount++;
        } catch (error) {
          console.error(`Erro ao salvar "${file.name}":`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast({
          title: 'Todos os e-books foram salvos!',
          description: `${successCount} e-book(s) adicionado(s) com sucesso.`,
        });
        navigate('/admin/ebooks');
      } else {
        toast({
          title: 'Salvamento parcial',
          description: `${successCount} salvos com sucesso, ${errorCount} com erro.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro geral:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os e-books. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={'ebooks' as const} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Adicionar E-book</h1>
                  <p className="text-muted-foreground">
                    Preencha as informações para criar um novo e-book
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados fundamentais do e-book</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title">Título (opcional para múltiplos arquivos)</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Ex: Introdução à Programação Python"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Para múltiplos arquivos, o nome de cada arquivo será usado como título
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (opcional para múltiplos arquivos)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o conteúdo do e-book"
                        rows={4}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="authorName">Autor *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="authorName"
                        value={formData.authorName}
                        onChange={(e) => handleInputChange('authorName', e.target.value)}
                        placeholder="Nome do autor do e-book"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area">Área Acadêmica *</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.area}
                          onValueChange={(value) => handleInputChange('area', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EXACT_SCIENCES">Ciências Exatas</SelectItem>
                            <SelectItem value="HUMANITIES">Ciências Humanas</SelectItem>
                            <SelectItem value="BIOLOGICAL_SCIENCES">Ciências Biológicas</SelectItem>
                            <SelectItem value="ENGINEERING">Engenharia</SelectItem>
                            <SelectItem value="APPLIED_SOCIAL_SCIENCES">
                              Ciências Sociais Aplicadas
                            </SelectItem>
                            <SelectItem value="LANGUAGES">Linguística, Letras e Artes</SelectItem>
                            <SelectItem value="AGRICULTURAL_SCIENCES">Ciências Agrárias</SelectItem>
                            <SelectItem value="HEALTH_SCIENCES">Ciências da Saúde</SelectItem>
                            <SelectItem value="MULTIDISCIPLINARY">Multidisciplinar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pageCount">Páginas *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          value={formData.pageCount}
                          onChange={(e) => handleInputChange('pageCount', e.target.value)}
                          placeholder="Ex: 120"
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gratuito: máx 100 páginas | Pago: mín 10 páginas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preço */}
              <Card>
                <CardHeader>
                  <CardTitle>Preço</CardTitle>
                  <CardDescription>Defina se o e-book é gratuito ou pago</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFree"
                      checked={formData.isFree}
                      onCheckedChange={(checked) => handleInputChange('isFree', checked as boolean)}
                    />
                    <Label htmlFor="isFree">E-book gratuito</Label>
                  </div>

                  {!formData.isFree && (
                    <div>
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          placeholder="Ex: 29.90"
                          className="pl-10"
                          required={!formData.isFree}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Arquivos */}
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos</CardTitle>
                  <CardDescription>Upload dos arquivos do e-book</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="file">Arquivos dos E-books * (pode selecionar múltiplos)</Label>

                    {/* Preview dos arquivos */}
                    {formData.files.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          {formData.files.length} arquivo(s) selecionado(s)
                        </div>
                        {formData.files.map((file, index) => (
                          <div key={index} className="p-3 border-2 border-primary/20 rounded-lg bg-primary/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <FileCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label
                          htmlFor="file"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para fazer upload</span> de múltiplos arquivos
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, EPUB, MOBI (pode selecionar vários)
                            </p>
                          </div>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,.epub,.mobi"
                            multiple
                            onChange={(e) => handleFilesChange(e.target.files)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cover">Capa (opcional)</Label>

                    {/* Preview da capa */}
                    {formData.cover && coverPreviewUrl ? (
                      <div className="mt-2 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={coverPreviewUrl}
                              alt="Preview da capa"
                              className="h-32 w-24 object-cover rounded-lg border-2 border-background shadow-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{formData.cover.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatFileSize(formData.cover.size)}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                  <ImagePlus className="h-3 w-3" />
                                  <span>Imagem carregada</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveCover}
                                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label
                          htmlFor="cover"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para fazer upload</span> da capa
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, WEBP (opcional)
                            </p>
                          </div>
                          <Input
                            id="cover"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setFormData((prev) => ({ ...prev, cover: file }));
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || formData.files.length === 0}
                  className="flex-1"
                >
                  {loading ? 'Salvando...' : `Salvar E-book(s) (${formData.files.length})`}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
