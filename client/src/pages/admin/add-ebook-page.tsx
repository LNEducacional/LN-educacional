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
import { BookOpen, FileText, GraduationCap, DollarSign, Upload } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

    // Validações
    if (
      !formData.title ||
      !formData.description ||
      !formData.area ||
      !formData.pageCount ||
      !formData.file
    ) {
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
      // Simular envio
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'E-book adicionado com sucesso',
        description: 'O e-book foi adicionado à plataforma.',
      });

      navigate('/admin/ebooks');
    } catch (_error) {
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o e-book. Tente novamente.',
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
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Adicionar E-book</h1>
                <p className="text-muted-foreground">
                  Preencha as informações para criar um novo e-book
                </p>
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
                            <SelectItem value="ADMINISTRATION">Administração</SelectItem>
                            <SelectItem value="LAW">Direito</SelectItem>
                            <SelectItem value="EDUCATION">Educação</SelectItem>
                            <SelectItem value="ENGINEERING">Engenharia</SelectItem>
                            <SelectItem value="PSYCHOLOGY">Psicologia</SelectItem>
                            <SelectItem value="HEALTH">Saúde</SelectItem>
                            <SelectItem value="ACCOUNTING">Contabilidade</SelectItem>
                            <SelectItem value="ARTS">Artes</SelectItem>
                            <SelectItem value="ECONOMICS">Economia</SelectItem>
                            <SelectItem value="SOCIAL_SCIENCES">Ciências Sociais</SelectItem>
                            <SelectItem value="EXACT_SCIENCES">Ciências Exatas</SelectItem>
                            <SelectItem value="BIOLOGICAL_SCIENCES">Ciências Biológicas</SelectItem>
                            <SelectItem value="HEALTH_SCIENCES">Ciências da Saúde</SelectItem>
                            <SelectItem value="APPLIED_SOCIAL_SCIENCES">
                              Ciências Sociais Aplicadas
                            </SelectItem>
                            <SelectItem value="HUMANITIES">Ciências Humanas</SelectItem>
                            <SelectItem value="LANGUAGES">Linguística, Letras e Artes</SelectItem>
                            <SelectItem value="AGRICULTURAL_SCIENCES">Ciências Agrárias</SelectItem>
                            <SelectItem value="MULTIDISCIPLINARY">Multidisciplinar</SelectItem>
                            <SelectItem value="OTHER">Outros</SelectItem>
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
