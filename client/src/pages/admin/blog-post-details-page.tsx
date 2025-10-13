import { useState } from 'react';

import { AdminSidebar } from '@/components/admin/admin-sidebar';

type AdminSection =
  | 'dashboard'
  | 'courses'
  | 'users'
  | 'categories'
  | 'notifications'
  | 'settings'
  | 'ready-papers'
  | 'free-papers'
  | 'ebooks'
  | 'blog-posts'
  | 'orders'
  | 'messages'
  | 'collaborators';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import blogService, { type BlogPost } from '@/services/blog.service';
import { useNavigate, useParams } from 'react-router-dom';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Hash,
  Trash2,
  User,
  XCircle,
  FolderOpen,
  Tags as TagsIcon,
  Image as ImageIcon,
  Search,
  Link as LinkIcon,
  Globe,
  AlignLeft,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function BlogPostDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeSection, setActiveSection] = useState<AdminSection>('blog-posts');
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await blogService.getPostById(id);
        setPost(data);
      } catch (error: any) {
        toast.error('Erro ao carregar post', {
          description: error.response?.data?.message || 'Não foi possível carregar o post',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    if (section === 'notifications') {
      navigate('/admin/notifications');
    } else if (section === 'ready-papers') {
      navigate('/admin/ready-papers');
    } else if (section === 'free-papers') {
      navigate('/admin/free-papers');
    } else if (section === 'ebooks') {
      navigate('/admin/ebooks');
    } else if (section === 'blog-posts') {
      navigate('/admin/blog-posts');
    } else {
      navigate('/admin');
    }
  };

  const handleBack = () => {
    navigate('/admin/blog-posts');
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/blog-posts/editar/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!post || !id) return;

    try {
      await blogService.deletePost(id);

      toast.success('Post excluído com sucesso', {
        description: `"${post.title}" foi removido.`,
      });
      navigate('/admin/blog-posts');
    } catch (error: any) {
      toast.error('Erro ao excluir', {
        description: error.response?.data?.message || 'Não foi possível excluir o post. Tente novamente.',
      });
    }
  };

  const handleTogglePublish = async () => {
    if (!post || !id) return;

    try {
      await blogService.togglePublish(id);
      toast.success('Status atualizado', {
        description: 'O status do post foi atualizado com sucesso.',
      });

      // Reload post
      const data = await blogService.getPostById(id);
      setPost(data);
    } catch (error: any) {
      toast.error('Erro ao atualizar status', {
        description: error.response?.data?.message || 'Não foi possível atualizar o status.',
      });
    }
  };

  const handleViewPost = () => {
    if (post) {
      window.open(`/blog/${post.slug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Carregando...</h2>
                <p className="text-muted-foreground">Buscando informações do post</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!post) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Post não encontrado
                </h2>
                <p className="text-muted-foreground mb-4">
                  O post solicitado não foi encontrado.
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
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>
                  <p className="text-muted-foreground">Detalhes do post do blog</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Título:
                  </h3>
                  <p className="text-muted-foreground">{post.title}</p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlignLeft className="h-4 w-4 text-muted-foreground" />
                    Resumo:
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.excerpt || 'Não definido'}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    Categoria:
                  </h3>
                  {post.category ? (
                    <Badge variant="outline" className="text-sm">
                      {post.category.name}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">Não definido</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <TagsIcon className="h-4 w-4 text-muted-foreground" />
                    Tags:
                  </h3>
                  {post.tags && post.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tagItem) => (
                        <Badge key={tagItem.tag.id} variant="secondary">
                          {tagItem.tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhuma tag</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      Status do Post:
                    </h3>
                    <Badge variant={post.status === 'PUBLISHED' ? 'default' : post.status === 'DRAFT' ? 'secondary' : 'outline'}>
                      {post.status === 'PUBLISHED' ? 'Publicado' : post.status === 'DRAFT' ? 'Rascunho' : 'Arquivado'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Publicação:
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Publicado' : 'Rascunho'}
                      </Badge>
                      <Button
                        variant={post.published ? 'outline' : 'default'}
                        size="sm"
                        onClick={handleTogglePublish}
                        className="gap-2"
                      >
                        {post.published ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Publicar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {post.publishedAt && (
                  <div>
                    <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Data de Publicação:
                    </h3>
                    <p className="text-muted-foreground">
                      {format(new Date(post.publishedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Slug:</h3>
                  <p className="text-muted-foreground font-mono text-sm bg-muted px-3 py-2 rounded">
                    {post.slug}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Conteúdo do Post:</h3>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground border rounded-lg p-4 bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Imagem de Capa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Imagem de Capa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {post.coverImageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full max-w-2xl rounded-lg border shadow-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      Imagem cadastrada
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Sem imagem de capa</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configurações de SEO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Configurações de SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Meta Título:
                  </h3>
                  <p className="text-muted-foreground">
                    {post.metaTitle || 'Não definido'}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlignLeft className="h-4 w-4 text-muted-foreground" />
                    Meta Descrição:
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.metaDescription || 'Não definido'}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <TagsIcon className="h-4 w-4 text-muted-foreground" />
                    Palavras-chave:
                  </h3>
                  {post.metaKeywords && post.metaKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {post.metaKeywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Não definido</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Imagem Open Graph:
                  </h3>
                  {post.ogImage ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded break-all">
                        {post.ogImage}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Não definido</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    URL Canônica:
                  </h3>
                  {post.canonicalUrl ? (
                    <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded break-all">
                      {post.canonicalUrl}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">Não definido</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações do Autor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Autor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Nome:</span>
                  <span className="text-muted-foreground">{post.author?.name || 'Desconhecido'}</span>
                </div>
                {post.author?.email && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">E-mail:</span>
                    <span className="text-muted-foreground">{post.author.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Visualizações:</span>
                    <span className="text-muted-foreground">{post.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Criado em:</span>
                    <span className="text-muted-foreground">
                      {format(new Date(post.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Atualizado em:</span>
                    <span className="text-muted-foreground">
                      {format(new Date(post.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">ID:</span>
                    <span className="text-muted-foreground font-mono text-xs">#{post.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
