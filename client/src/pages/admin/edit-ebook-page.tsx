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
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

  useEffect(() => {
    if (id) {
      // TODO: Implementar busca real do e-book da API
      // Simulação temporária
      setEbook({
        id: id,
        title: 'E-book de Exemplo',
        description: 'Descrição do e-book de exemplo',
        academicArea: 'ADMINISTRATION',
        authorName: 'Autor Exemplo',
        pageCount: 120,
        price: 2990, // 29.90 em centavos
        fileUrl: '/exemplo.pdf',
        coverUrl: '/exemplo-capa.jpg',
        createdAt: new Date().toISOString(),
      });
      setFormData({
        title: 'E-book de Exemplo',
        description: 'Descrição do e-book de exemplo',
        authorName: 'Autor Exemplo',
        area: 'ADMINISTRATION',
        pageCount: '120',
        isFree: false,
        price: '29.90',
        file: null,
        cover: null,
      });
    }
  }, [id]);

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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'E-book atualizado com sucesso',
        description: 'As alterações foram salvas.',
      });

      navigate('/admin/ebooks');
    } catch (_error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
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
                            {ebook.fileUrl && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Arquivo atual: {ebook.fileUrl.split('/').pop()}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover">Capa</Label>
                    <div className="relative">
                      <input
                        type="file"
                        id="cover"
                        accept="image/*"
                        onChange={(e) => handleFileChange('cover', e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        {formData.cover ? (
                          <p className="text-sm text-primary font-medium">
                            {formData.cover.name}
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Clique para upload da capa
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG</p>
                          </>
                        )}
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
