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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RichEditor } from '@/components/ui/rich-editor';
import blogService, { type BlogPost, type Category, type Tag } from '@/services/blog.service';
import { Loader2, Upload, X, Calendar, FileText, AlignLeft, FolderOpen, Tags as TagsIcon, Image, Search, Link } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const EditBlogPostPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [_post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    published: false,
    status: 'DRAFT' as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED',
    scheduledAt: '',
    categoryId: '',
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    canonicalUrl: '',
  });

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingCategories(true);
    setIsLoadingTags(true);

    try {
      if (!id) {
        throw new Error('ID do post não encontrado');
      }

      const [data, categoriesData, tagsData] = await Promise.all([
        blogService.getPostById(id),
        blogService.getCategories(),
        blogService.getTags(),
      ]);

      setPost(data);
      setCategories(categoriesData.categories);
      setTags(tagsData.tags);

      // Extract tag IDs from post
      const postTagIds = data.tags?.map((t: any) => t.tag?.id || t.tagId).filter(Boolean) || [];
      setSelectedTags(postTagIds);

      setFormData({
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        coverImageUrl: data.coverImageUrl || '',
        published: data.published,
        status: data.status || 'DRAFT',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : '',
        categoryId: data.categoryId || '',
        // SEO fields
        metaTitle: (data as any).metaTitle || '',
        metaDescription: (data as any).metaDescription || '',
        metaKeywords: (data as any).metaKeywords ? (data as any).metaKeywords.join(', ') : '',
        ogImage: (data as any).ogImage || '',
        canonicalUrl: (data as any).canonicalUrl || '',
      });
    } catch (error: any) {
      toast.error('Erro ao carregar post', {
        description: error.response?.data?.message || 'Não foi possível carregar o post',
      });
      navigate('/admin/blog-posts');
    } finally {
      setIsLoading(false);
      setIsLoadingCategories(false);
      setIsLoadingTags(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id, loadPost]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagSelect = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags((prev) => [...prev, tagId]);
    }
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await blogService.createTag({ name: newTagName.trim() });
      setTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag.id]);
      setNewTagName('');

      toast.success('Tag criada', {
        description: 'Tag criada e adicionada ao post',
      });
    } catch (error: any) {
      toast.error('Erro ao criar tag', {
        description: error.response?.data?.message || 'Não foi possível criar a tag',
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande', {
          description: 'A imagem deve ter no máximo 5MB',
        });
        return;
      }
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, coverImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.excerpt || !formData.content) {
      toast.error('Campos obrigatórios', {
        description: 'Preencha todos os campos obrigatórios',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!id) {
        throw new Error('ID do post não encontrado');
      }

      const postData = {
        ...formData,
        categoryId: formData.categoryId && formData.categoryId !== 'none' ? formData.categoryId : undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        scheduledAt: formData.scheduledAt || undefined,
        // SEO fields
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        metaKeywords: formData.metaKeywords ? formData.metaKeywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
        ogImage: formData.ogImage || undefined,
        canonicalUrl: formData.canonicalUrl || undefined,
      };

      await blogService.updatePost(id, postData);

      toast.success('Post atualizado', {
        description: 'Post do blog atualizado com sucesso',
      });

      navigate('/admin/blog-posts');
    } catch (error: any) {
      toast.error('Erro ao atualizar post', {
        description: error.response?.data?.message || 'Não foi possível atualizar o post',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Editar Post</h1>
                  <p className="text-muted-foreground">
                    Atualize as informações do post do blog
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>Atualize as informações principais do post</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          placeholder="Título do post"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Resumo *</Label>
                      <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="excerpt"
                          placeholder="Breve resumo do post"
                          value={formData.excerpt}
                          onChange={(e) => handleInputChange('excerpt', e.target.value)}
                          className="min-h-[80px] pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <div className="relative">
                        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.categoryId}
                          onValueChange={(value) => handleInputChange('categoryId', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma categoria</SelectItem>
                            {!isLoadingCategories && categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                            {isLoadingCategories && (
                              <SelectItem value="loading" disabled>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Carregando...
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags Selection */}
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="space-y-4">
                        {/* Selected Tags */}
                        {selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tagId) => {
                              const tag = tags.find((t) => t.id === tagId);
                              return tag ? (
                                <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                                  {tag.name}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => handleTagRemove(tagId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* Tag Selection */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <TagsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Select onValueChange={handleTagSelect}>
                              <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Adicionar tag existente" />
                              </SelectTrigger>
                              <SelectContent>
                                {!isLoadingTags && tags
                                  .filter((tag) => !selectedTags.includes(tag.id))
                                  .map((tag) => (
                                    <SelectItem key={tag.id} value={tag.id}>
                                      {tag.name}
                                    </SelectItem>
                                  ))}
                                {isLoadingTags && (
                                  <SelectItem value="loading" disabled>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Carregando...
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Create New Tag */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <TagsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Nova tag"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateTag();
                                }
                              }}
                              className="pl-10"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim()}
                          >
                            Criar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Status do Post</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED') => {
                          setFormData((prev) => ({
                            ...prev,
                            status: value,
                            published: value === 'PUBLISHED'
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Rascunho</SelectItem>
                          <SelectItem value="SCHEDULED">Agendado</SelectItem>
                          <SelectItem value="PUBLISHED">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Scheduled Date */}
                    {formData.status === 'SCHEDULED' && (
                      <div className="space-y-2">
                        <Label htmlFor="scheduledAt" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data e Hora do Agendamento
                        </Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <p className="text-sm text-muted-foreground">
                          O post será publicado automaticamente na data e hora especificadas
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="published"
                        checked={formData.published}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            published: checked,
                            status: checked ? 'PUBLISHED' : 'DRAFT'
                          }))
                        }
                      />
                      <Label htmlFor="published">Publicar imediatamente</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo *</Label>
                      <RichEditor
                        content={formData.content}
                        onChange={(content) => handleInputChange('content', content)}
                        placeholder="Escreva o conteúdo do post... Use a barra de ferramentas para formatar o texto."
                        className="min-h-[400px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Use a barra de ferramentas acima para formatar seu texto com negrito, itálico,
                        cabeçalhos, listas, links, imagens e muito mais.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Imagem de Capa</CardTitle>
                    <CardDescription>
                      Adicione uma imagem de capa para o post (opcional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label
                          htmlFor="thumbnail"
                          className="flex items-center gap-2 cursor-pointer bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Escolher Imagem
                        </Label>
                        <Input
                          id="thumbnail"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {formData.coverImageUrl && (
                          <span className="text-sm text-muted-foreground">Imagem carregada</span>
                        )}
                      </div>
                      {formData.coverImageUrl && (
                        <div className="mt-4">
                          <img
                            src={formData.coverImageUrl}
                            alt="Preview"
                            className="w-full max-w-md rounded-lg border"
                          />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Formatos aceitos: JPG, PNG, WebP. Máximo: 5MB
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de SEO</CardTitle>
                    <CardDescription>
                      Configure as meta tags e otimizações de SEO para este post (opcional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Título</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="metaTitle"
                          placeholder="Título para SEO (se vazio, usará o título do post)"
                          value={formData.metaTitle}
                          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                          maxLength={60}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Recomendado: até 60 caracteres. Atual: {formData.metaTitle.length}/60
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Descrição</Label>
                      <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="metaDescription"
                          placeholder="Descrição para SEO (se vazia, usará o resumo do post)"
                          value={formData.metaDescription}
                          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                          maxLength={160}
                          className="min-h-[80px] pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Recomendado: até 160 caracteres. Atual: {formData.metaDescription.length}/160
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">Palavras-chave</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="metaKeywords"
                          placeholder="palavras, chave, separadas, por, vírgula"
                          value={formData.metaKeywords}
                          onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Separe as palavras-chave por vírgula. Recomendado: 5-10 palavras-chave relevantes.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ogImage">Imagem Open Graph (URL)</Label>
                      <div className="relative">
                        <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ogImage"
                          placeholder="https://exemplo.com/imagem-og.jpg"
                          value={formData.ogImage}
                          onChange={(e) => handleInputChange('ogImage', e.target.value)}
                          type="url"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        URL da imagem para compartilhamento em redes sociais. Se vazia, usará a imagem de capa.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="canonicalUrl">URL Canônica</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="canonicalUrl"
                          placeholder="https://lneducacional.com.br/blog/titulo-do-post"
                          value={formData.canonicalUrl}
                          onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                          type="url"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        URL canônica para evitar conteúdo duplicado. Se vazia, será gerada automaticamente.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/blog-posts')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      'Atualizar Post'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EditBlogPostPage;
