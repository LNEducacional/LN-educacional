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
import { useApiMutation } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import type { AcademicArea, PaperType } from '@/types/paper';
import {
  BookOpen,
  DollarSign,
  FileText,
  GraduationCap,
  Globe,
  Hash,
  Plus,
  Upload,
  User,
  X,
  FileType
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddReadyPaperPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'courses' | 'users' | 'categories' | 'notifications' | 'settings'
  >('dashboard');

  const createPaper = useApiMutation<void, FormData>('post');

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (value: string) => {
    // Remove tudo exceto números e vírgula
    const numbersOnly = value.replace(/[^\d,]/g, '');
    // Garante apenas uma vírgula
    const parts = numbersOnly.split(',');
    const cleanValue = parts.length > 1 ? `${parts[0]},${parts[1]}` : parts[0];
    setFormData((prev) => ({ ...prev, price: cleanValue }));
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

    // Validações
    if (
      !formData.title ||
      !formData.authorName ||
      !formData.paperType ||
      !formData.academicArea ||
      !formData.pageCount ||
      !formData.price ||
      !formData.file
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Adicionar dados do formulário
      formDataToSend.append('title', formData.title);
      formDataToSend.append('authorName', formData.authorName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('paperType', formData.paperType);
      formDataToSend.append('academicArea', formData.academicArea);
      formDataToSend.append('pageCount', formData.pageCount.toString());
      formDataToSend.append('language', formData.language);
      formDataToSend.append('isFree', 'false'); // Trabalho pronto é PAGO

      // Converter preço para centavos (R$ 10,50 -> 1050)
      const priceInCents = Math.round(parseFloat(formData.price.replace(',', '.')) * 100);
      formDataToSend.append('price', priceInCents.toString());

      if (keywords.length > 0) {
        formDataToSend.append('keywords', keywords.join(', '));
      }

      // Adicionar arquivos
      formDataToSend.append('file', formData.file);
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }
      if (formData.preview) {
        formDataToSend.append('preview', formData.preview);
      }

      console.log('📤 Enviando trabalho pronto...', {
        title: formData.title,
        price: priceInCents,
        hasFile: !!formData.file,
      });

      await createPaper.mutate('/admin/papers', formDataToSend);

      console.log('✅ Trabalho criado com sucesso!');

      toast({
        title: 'Trabalho adicionado',
        description: 'O trabalho foi adicionado com sucesso.',
      });

      navigate('/admin/ready-papers');
    } catch (error) {
      console.error('❌ Erro ao adicionar trabalho:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao adicionar',
        description: errorMessage || 'Não foi possível adicionar o trabalho. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Adicionar Trabalho Pronto</h1>
                <p className="text-muted-foreground">
                  Preencha as informações para adicionar um novo trabalho
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
                          placeholder="Digite o título do trabalho"
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
                          placeholder="Digite o nome do autor"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o conteúdo do trabalho (opcional)"
                        className="min-h-[100px] pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
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
                            <SelectItem value="other">Outros</SelectItem>
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
                          placeholder="Ex: 50"
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
                          placeholder="Ex: 99,90"
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Use vírgula para centavos (ex: 99,90)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arquivos */}
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos do Trabalho</CardTitle>
                  <CardDescription>Upload dos arquivos necessários</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FileUploadField
                    label="Arquivo do Trabalho"
                    accept=".pdf,.doc,.docx"
                    file={formData.file}
                    onChange={(file) => handleFileChange('file', file)}
                    required
                    maxSize="50MB"
                    fileTypes="PDF, DOC, DOCX"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploadField
                      label="Thumbnail"
                      accept="image/*"
                      file={formData.thumbnail}
                      onChange={(file) => handleFileChange('thumbnail', file)}
                      isImage
                      maxSize="10MB"
                      fileTypes="PNG, JPG"
                    />

                    <FileUploadField
                      label="Preview"
                      accept=".pdf,.doc,.docx"
                      file={formData.preview}
                      onChange={(file) => handleFileChange('preview', file)}
                      maxSize="10MB"
                      fileTypes="PDF, DOC, DOCX"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={handleBack} className='w-full'>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || createPaper.loading} className='w-full'>
                  {loading || createPaper.loading ? 'Adicionando...' : 'Adicionar Trabalho'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
