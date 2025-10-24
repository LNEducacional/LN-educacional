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
import { useToast } from '@/hooks/use-toast';
import blogService, { type Category, type Tag } from '@/services/blog.service';
import { ArrowLeft, Loader2, Upload, X, FileText, AlignLeft, FolderOpen, Tags, Globe, Search, Image, Link } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddBlogPostPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    published: false,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    categoryId: '',
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    canonicalUrl: '',
  });

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingCategories(true);
      setIsLoadingTags(true);

      try {
        const [categoriesData, tagsData] = await Promise.all([
          blogService.getCategories(),
          blogService.getTags(),
        ]);

        setCategories(categoriesData.categories);
        setTags(tagsData.tags);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar categorias e tags',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingTags(false);
      }
    };

    loadData();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
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

      toast({
        title: 'Sucesso',
        description: 'Tag criada e adicionada',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar tag',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await blogService.createCategory({ name: newCategoryName.trim() });
      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
      setNewCategoryName('');

      toast({
        title: 'Sucesso',
        description: 'Categoria criada e selecionada',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }
      // Convert to base64 for simplicity
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
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        ...formData,
        categoryId: formData.categoryId && formData.categoryId !== 'none' ? formData.categoryId : undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        // SEO fields
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        metaKeywords: formData.metaKeywords ? formData.metaKeywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
        ogImage: formData.ogImage || undefined,
        canonicalUrl: formData.canonicalUrl || undefined,
      };

      await blogService.createPost(postData);

      toast({
        title: 'Sucesso',
        description: 'Post do blog adicionado com sucesso',
      });

      navigate('/admin/blog-posts');
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao adicionar post do blog',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Adicionar Post</h1>
                  <p className="text-muted-foreground">
                    Preencha as informações para criar um novo post do blog
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>Preencha as informações principais do post</CardDescription>
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
                      <div className="space-y-4">
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

                        {/* Create New Category */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Nova categoria"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateCategory();
                                }
                              }}
                              className="pl-10"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim()}
                          >
                            Criar
                          </Button>
                        </div>
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
                            <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
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
                            <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                          onValueChange={(value: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
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
                            <SelectItem value="PUBLISHED">Publicado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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

                {/* Ações */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/blog-posts')}
                    disabled={isSubmitting}
                    className='w-full'
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className='w-full'>
                    {isSubmitting ? 'Salvando...' : 'Salvar Post'}
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

export default AddBlogPostPage;
