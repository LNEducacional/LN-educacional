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
import { useApiMutation } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import { type FreePaperInput, freePaperSchema } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, X, FileText, User, BookOpen, Upload } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

export default function AddFreePaperPage() {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [files, setFiles] = useState({
    file: null as File | null,
    thumbnail: null as File | null,
    preview: null as File | null,
  });
  const [_activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'courses'
    | 'users'
    | 'categories'
    | 'notifications'
    | 'settings'
    | 'ready-papers'
    | 'free-papers'
  >('free-papers');

  const createPaper = useApiMutation<void, FormData>('post');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FreePaperInput>({
    resolver: zodResolver(freePaperSchema),
    defaultValues: {
      language: 'pt',
      keywords: [],
    },
  });

  const watchedValues = watch();

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

  const handleFileChange = (field: 'file' | 'thumbnail' | 'preview', file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      const newKeywords = [...keywords, keywordInput.trim()];
      setKeywords(newKeywords);
      setValue('keywords', newKeywords);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = keywords.filter((k) => k !== keyword);
    setKeywords(newKeywords);
    setValue('keywords', newKeywords);
  };

  const onSubmit = async (data: FreePaperInput) => {
    if (!files.file) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'É necessário fazer o upload do arquivo principal.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();

      // Adicionar dados do formulário
      formData.append('title', data.title);
      formData.append('authorName', data.authorName);
      formData.append('description', data.description);
      formData.append('paperType', data.paperType);
      formData.append('academicArea', data.academicArea);
      formData.append('pageCount', data.pageCount.toString());
      formData.append('language', data.language);
      formData.append('isFree', 'true');
      formData.append('price', '0');

      if (data.keywords && data.keywords.length > 0) {
        formData.append('keywords', JSON.stringify(data.keywords));
      }

      // Adicionar arquivos
      formData.append('file', files.file);
      if (files.thumbnail) {
        formData.append('thumbnail', files.thumbnail);
      }
      if (files.preview) {
        formData.append('preview', files.preview);
      }

      await createPaper.mutate('/admin/papers', formData);

      toast({
        title: 'Trabalho gratuito adicionado',
        description: 'O trabalho foi adicionado com sucesso.',
      });

      reset();
      setKeywords([]);
      setFiles({ file: null, thumbnail: null, preview: null });
      navigate('/admin/free-papers');
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o trabalho. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar
          activeSection={'free-papers' as const}
          onSectionChange={handleSectionChange}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Adicionar Trabalho Gratuito</h1>
                <p className="text-muted-foreground">
                  Preencha os detalhes para adicionar um novo trabalho gratuito
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados fundamentais do trabalho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          {...register('title')}
                          placeholder="Digite o título do trabalho"
                          className={errors.title ? 'border-red-500 pl-10' : 'pl-10'}
                        />
                      </div>
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="authorName">Autor *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="authorName"
                          {...register('authorName')}
                          placeholder="Digite o nome do autor"
                          className={errors.authorName ? 'border-red-500 pl-10' : 'pl-10'}
                        />
                      </div>
                      {errors.authorName && (
                        <p className="text-sm text-red-500 mt-1">{errors.authorName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paperType">Tipo *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={watchedValues.paperType}
                          onValueChange={(value) => setValue('paperType', value as any)}
                        >
                          <SelectTrigger className={errors.paperType ? 'border-red-500 pl-10' : 'pl-10'}>
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
                      {errors.paperType && (
                        <p className="text-sm text-red-500 mt-1">{errors.paperType.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="academicArea">Área Acadêmica *</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={watchedValues.academicArea}
                          onValueChange={(value) => setValue('academicArea', value as any)}
                        >
                          <SelectTrigger className={errors.academicArea ? 'border-red-500 pl-10' : 'pl-10'}>
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
                      {errors.academicArea && (
                        <p className="text-sm text-red-500 mt-1">{errors.academicArea.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pageCount">Nº de páginas *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          {...register('pageCount', { valueAsNumber: true })}
                          placeholder="Ex: 50"
                          className={errors.pageCount ? 'border-red-500 pl-10' : 'pl-10'}
                        />
                      </div>
                      {errors.pageCount && (
                        <p className="text-sm text-red-500 mt-1">{errors.pageCount.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="language">Idioma *</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={watchedValues.language}
                          onValueChange={(value) => setValue('language', value as any)}
                        >
                          <SelectTrigger className={errors.language ? 'border-red-500 pl-10' : 'pl-10'}>
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
                      {errors.language && (
                        <p className="text-sm text-red-500 mt-1">{errors.language.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Descreva o conteúdo do trabalho"
                        rows={4}
                        className={errors.description ? 'border-red-500 pl-10' : 'pl-10'}
                      />
                    </div>
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Palavras-chave</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <CardTitle>Arquivos</CardTitle>
                  <CardDescription>Upload dos arquivos do trabalho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file">Arquivo Principal *</Label>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="thumbnail">Thumbnail</Label>
                      <div className="relative">
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="thumbnail"
                          type="file"
                          accept="image/*"
                          className="pl-10"
                          onChange={(e) => handleFileChange('thumbnail', e.target.files?.[0] || null)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Imagem de capa (opcional)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="preview">Preview</Label>
                      <div className="relative">
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="preview"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="pl-10"
                          onChange={(e) => handleFileChange('preview', e.target.files?.[0] || null)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Arquivo de preview (opcional)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={handleBack} className='w-full'>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || createPaper.loading} className='w-full'>
                  {isSubmitting || createPaper.loading ? 'Adicionando...' : 'Adicionar Trabalho'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
