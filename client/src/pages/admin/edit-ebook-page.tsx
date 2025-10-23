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
import type { AcademicArea, Ebook } from '@/types/ebook';
import {
  BookOpen,
  User,
  GraduationCap,
  Hash,
  Upload,
  FileText,
  X,
  FileCheck,
  ImagePlus,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';

export default function EditEbookPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [activeSection, setActiveSection] = useState<
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
    file: null as File | null,
    cover: null as File | null,
  });

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Gerenciar preview da capa
  useEffect(() => {
    if (formData.cover) {
      const url = URL.createObjectURL(formData.cover);
      setCoverPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setCoverPreviewUrl(null);
    }
  }, [formData.cover]);

  useEffect(() => {
    const fetchEbook = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.get(`/admin/ebooks/${id}`);
        const ebookData = response.data;

        setEbook(ebookData);
        setFormData({
          title: ebookData.title,
          description: ebookData.description || '',
          authorName: ebookData.authorName,
          area: ebookData.academicArea,
          pageCount: ebookData.pageCount.toString(),
          isFree: ebookData.price === 0,
          price: ebookData.price > 0 ? (ebookData.price / 100).toFixed(2) : '',
          file: null,
          cover: null,
        });
      } catch (error: any) {
        console.error('Erro ao buscar e-book:', error);
        toast({
          title: 'Erro ao carregar e-book',
          description: error.response?.data?.error || 'Não foi possível carregar os dados do e-book.',
          variant: 'destructive',
        });
        navigate('/admin/ebooks');
      } finally {
        setLoading(false);
      }
    };

    fetchEbook();
  }, [id, navigate]);

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

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

    if (!formData.title || !formData.description || !formData.area || !formData.pageCount) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
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

    setLoading(true);

    try {
      // Preparar dados para atualização
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        authorName: formData.authorName.trim(),
        academicArea: formData.area,
        pageCount: Number.parseInt(formData.pageCount),
        price: formData.isFree ? 0 : Math.round(parseFloat(formData.price.replace(',', '.')) * 100),
      };

      // Upload de novo arquivo se fornecido
      if (formData.file) {
        const fileFormData = new FormData();
        fileFormData.append('file', formData.file);
        const fileUploadResponse = await api.post('/admin/ebooks/upload-file', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateData.fileUrl = fileUploadResponse.data.url;
      }

      // Upload de nova capa se fornecida
      if (formData.cover) {
        const coverFormData = new FormData();
        coverFormData.append('file', formData.cover);
        const coverUploadResponse = await api.post('/admin/ebooks/upload-cover', coverFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateData.coverUrl = coverUploadResponse.data.url;
      }

      // Atualizar e-book
      await api.put(`/admin/ebooks/${id}`, updateData);

      toast({
        title: 'E-book atualizado com sucesso',
        description: 'As alterações foram salvas.',
      });

      navigate('/admin/ebooks');
    } catch (error: any) {
      console.error('Erro ao atualizar e-book:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.response?.data?.error || 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ebook) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Carregando...</h2>
                <p className="text-muted-foreground">Buscando informações do e-book</p>
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
                  <h1 className="text-3xl font-bold tracking-tight">Editar E-book</h1>
                  <p className="text-muted-foreground">Atualize as informações do e-book</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Digite o título do e-book"
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
                          placeholder="Ex: 120"
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
                        placeholder="Descreva o conteúdo do e-book"
                        className="min-h-[100px] pl-10"
                        required
                      />
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
                <CardContent className="space-y-4">
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
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required={!formData.isFree}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Arquivos do E-book */}
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos do E-book</CardTitle>
                  <CardDescription>Upload do arquivo principal e capa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="file">Arquivo do E-book</Label>

                    {/* Preview do arquivo novo */}
                    {formData.file ? (
                      <div className="mt-2">
                        <div className="p-3 border-2 border-primary/20 rounded-lg bg-primary/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileCheck className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{formData.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(formData.file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveFile}
                              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {/* Arquivo atual salvo no banco */}
                        {ebook.fileUrl && (
                          <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-blue-600 font-medium mb-1">Arquivo atual salvo:</p>
                                <p className="text-sm font-medium truncate text-blue-900">
                                  {ebook.fileUrl.split('/').pop()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Zona de upload para novo arquivo */}
                        <label
                          htmlFor="file"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para fazer upload</span> de novo arquivo
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, EPUB, MOBI (deixe vazio para manter o atual)</p>
                          </div>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,.epub,.mobi"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
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
                      <div className="mt-2 space-y-3">
                        {/* Capa atual salva no banco */}
                        {ebook.coverUrl && (
                          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <img
                                  src={ebook.coverUrl}
                                  alt="Capa atual"
                                  className="h-32 w-24 object-cover rounded-lg border-2 border-blue-300 shadow-md"
                                  onError={(e) => {
                                    // Fallback se a imagem não carregar
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-blue-600 font-medium mb-1">Capa atual salva:</p>
                                <p className="text-sm font-medium truncate text-blue-900">
                                  {ebook.coverUrl.split('/').pop()}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                                  <ImagePlus className="h-3 w-3" />
                                  <span>Imagem carregada do servidor</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Zona de upload para nova capa */}
                        <label
                          htmlFor="cover"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para fazer upload</span> de nova capa
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, WEBP (deixe vazio para manter a atual)
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
                  className="w-full"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
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
