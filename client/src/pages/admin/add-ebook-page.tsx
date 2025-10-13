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
import { BookOpen, FileText, GraduationCap, DollarSign, Upload, User, ArrowLeft } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
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
    file: null as File | null,
    cover: null as File | null,
  });

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

  const handleFileChange = (field: 'file' | 'cover', file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [ADD EBOOK] handleSubmit called');
    console.log('📋 [ADD EBOOK] Form data:', formData);

    // Validações
    if (
      !formData.title ||
      !formData.description ||
      !formData.authorName ||
      !formData.area ||
      !formData.pageCount ||
      !formData.file
    ) {
      console.log('❌ [ADD EBOOK] Validation failed - missing required fields');
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Validar título (mínimo 2 palavras)
    const titleWords = formData.title.trim().split(/\s+/);
    if (titleWords.length < 2) {
      console.log('❌ [ADD EBOOK] Validation failed - title needs at least 2 words');
      toast({
        title: 'Título inválido',
        description: 'O título deve conter pelo menos 2 palavras. Exemplo: "Introdução à Programação"',
        variant: 'destructive',
      });
      return;
    }

    // Validar descrição (mínimo 10 caracteres)
    if (formData.description.trim().length < 10) {
      console.log('❌ [ADD EBOOK] Validation failed - description too short');
      toast({
        title: 'Descrição muito curta',
        description: 'A descrição deve ter pelo menos 10 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validar nome do autor (mínimo 2 caracteres)
    if (formData.authorName.trim().length < 2) {
      console.log('❌ [ADD EBOOK] Validation failed - author name too short');
      toast({
        title: 'Nome do autor inválido',
        description: 'O nome do autor deve ter pelo menos 2 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.isFree && (!formData.price || Number.parseFloat(formData.price) <= 0)) {
      console.log('❌ [ADD EBOOK] Validation failed - invalid price');
      toast({
        title: 'Preço obrigatório',
        description: 'Para e-books pagos, é necessário definir um preço válido.',
        variant: 'destructive',
      });
      return;
    }

    // Validar número de páginas com regra de e-book gratuito/pago
    const pageCount = Number.parseInt(formData.pageCount);
    if (formData.isFree && pageCount > 100) {
      console.log('❌ [ADD EBOOK] Validation failed - free ebook too many pages');
      toast({
        title: 'Número de páginas inválido',
        description: 'E-books gratuitos não devem exceder 100 páginas.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.isFree && pageCount < 10) {
      console.log('❌ [ADD EBOOK] Validation failed - paid ebook too few pages');
      toast({
        title: 'Número de páginas inválido',
        description: 'E-books pagos devem ter pelo menos 10 páginas.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ [ADD EBOOK] Validation passed, starting upload...');
    setLoading(true);

    try {
      // 1. Upload do arquivo principal
      console.log('📤 [ADD EBOOK] Uploading file...');
      const fileFormData = new FormData();
      fileFormData.append('file', formData.file);

      const fileUploadResponse = await api.post('/admin/ebooks/upload-file', fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = fileUploadResponse.data.url;
      console.log('✅ [ADD EBOOK] File uploaded:', fileUrl);

      // 2. Upload da capa (se houver)
      let coverUrl: string | undefined = undefined;
      if (formData.cover) {
        console.log('📤 [ADD EBOOK] Uploading cover...');
        const coverFormData = new FormData();
        coverFormData.append('file', formData.cover);

        const coverUploadResponse = await api.post('/admin/ebooks/upload-cover', coverFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        coverUrl = coverUploadResponse.data.url;
        console.log('✅ [ADD EBOOK] Cover uploaded:', coverUrl);
      }

      // 3. Criar o e-book com as URLs
      const ebookData = {
        title: formData.title,
        description: formData.description,
        authorName: formData.authorName,
        academicArea: formData.area,
        pageCount: Number.parseInt(formData.pageCount),
        price: formData.isFree ? 0 : Math.round(Number.parseFloat(formData.price) * 100),
        fileUrl: fileUrl,
        coverUrl: coverUrl,
      };

      console.log('📝 [ADD EBOOK] Creating ebook with data:', ebookData);
      await api.post('/admin/ebooks', ebookData);

      console.log('✅ [ADD EBOOK] E-book created successfully');
      toast({
        title: 'E-book adicionado com sucesso',
        description: 'O e-book foi adicionado à plataforma.',
      });

      navigate('/admin/ebooks');
    } catch (error: any) {
      console.error('❌ [ADD EBOOK] Error:', error);
      console.error('❌ [ADD EBOOK] Error response:', error.response?.data);
      toast({
        title: 'Erro ao adicionar',
        description: error.response?.data?.error || 'Não foi possível adicionar o e-book. Tente novamente.',
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
                    <Label htmlFor="title">Título * (mínimo 2 palavras)</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Ex: Introdução à Programação Python"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      O título deve conter pelo menos 2 palavras
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o conteúdo do e-book"
                        rows={4}
                        className="pl-10"
                        required
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
                    <Label htmlFor="file">Arquivo do E-book *</Label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('file', e.target.files?.[0] || null)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Formatos aceitos: PDF, DOC, DOCX
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="cover">Capa</Label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cover"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleFileChange('cover', e.target.files?.[0] || null)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Formatos aceitos: JPG, PNG, WEBP (opcional)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="w-full">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Salvando...' : 'Salvar E-book'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
