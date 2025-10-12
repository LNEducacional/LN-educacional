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

            {/* Status e Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Status e Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Status:</span>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Visualizações:</span>
                      <span className="text-muted-foreground">{post.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Criado em:</span>
                      <span className="text-muted-foreground">
                        {format(new Date(post.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">ID:</span>
                      <span className="text-muted-foreground">#{post.id}</span>
                    </div>
                  </div>
                </div>
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
                  <p className="text-muted-foreground">{post.slug}</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Descrição:</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.description || 'Sem descrição'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Conteúdo:</h3>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Autor */}
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
