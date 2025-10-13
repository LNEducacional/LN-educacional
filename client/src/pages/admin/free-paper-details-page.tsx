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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useApi, useApiMutation } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import type { ReadyPaper } from '@/types/paper';
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
import {
  formatAcademicArea,
  formatKeywords,
  formatLanguage,
  formatPaperType,
} from '@/utils/paper-formatters';
import {
  ArrowLeft,
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Globe,
  Hash,
  Tag,
  Trash2,
  User,
} from 'lucide-react';

export default function FreePaperDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeSection, setActiveSection] = useState<AdminSection>('free-papers');

  const {
    data: paper,
    loading,
    error,
  } = useApi<ReadyPaper>(`/admin/free-papers/${id}`, { dependencies: [id] });

  const deletePaper = useApiMutation<void, void>('delete');

  const handleSectionChange = (section: AdminSection) => {
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

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/free-papers/edit/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!paper || !id) return;

    try {
      await deletePaper.mutate(`/admin/free-papers/${id}`);

      toast({
        title: 'Trabalho gratuito excluído',
        description: `"${paper.title}" foi removido com sucesso.`,
      });
      navigate('/admin/free-papers');
    } catch (_error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o trabalho. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (type: 'main' | 'preview') => {
    if (!paper) return;

    const url = type === 'main' ? paper.fileUrl : paper.previewUrl;

    if (!url) {
      toast({
        title: 'Arquivo não disponível',
        description: `O ${type === 'main' ? 'arquivo principal' : 'preview'} não está disponível para download.`,
        variant: 'destructive',
      });
      return;
    }

    // Abrir arquivo em nova aba para download
    window.open(url, '_blank');

    toast({
      title: 'Download iniciado',
      description: `O download do ${type === 'main' ? 'arquivo principal' : 'preview'} foi iniciado.`,
    });
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
                <p className="text-muted-foreground">Buscando informações do trabalho</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !paper) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Trabalho não encontrado
                </h2>
                <p className="text-muted-foreground mb-4">
                  {error || 'O trabalho solicitado não foi encontrado.'}
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
                  <h1 className="text-3xl font-bold text-foreground">{paper.title}</h1>
                  <p className="text-muted-foreground">Detalhes do trabalho gratuito</p>
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
                  <p className="text-muted-foreground leading-relaxed">{paper.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Tipo:</span>
                      <Badge variant="outline">{formatPaperType(paper.paperType)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Área:</span>
                      <Badge variant="outline">{formatAcademicArea(paper.academicArea)}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">ID:</span>
                      <span className="text-muted-foreground">#{paper.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Acadêmicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Acadêmicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Autor:</span>
                      <span className="text-muted-foreground">{paper.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Páginas:</span>
                      <span className="text-muted-foreground">{paper.pageCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Idioma:</span>
                      <span className="text-muted-foreground">
                        {formatLanguage(paper.language)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Downloads:</span>
                      <span className="text-muted-foreground">247</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Data de criação:</span>
                      <span className="text-muted-foreground">
                        {new Date(paper.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {paper.keywords && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Palavras-chave:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formatKeywords(paper.keywords).map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Arquivos */}
            <Card>
              <CardHeader>
                <CardTitle>Arquivos</CardTitle>
                <CardDescription>Downloads e visualizações disponíveis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail */}
                {paper.thumbnailUrl && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Thumbnail</h4>
                      <p className="text-sm text-muted-foreground">Imagem de capa do trabalho</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">Arquivo Principal</h4>
                        <p className="text-sm text-muted-foreground">
                          {paper.fileUrl ? 'Documento completo' : 'Arquivo não disponível'}
                        </p>
                      </div>
                      {paper.fileUrl ? (
                        <Button onClick={() => handleDownload('main')} size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Baixar
                        </Button>
                      ) : (
                        <Button size="sm" disabled variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Indisponível
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">Preview</h4>
                        <p className="text-sm text-muted-foreground">
                          {paper.previewUrl ? 'Visualização prévia' : 'Preview não disponível'}
                        </p>
                      </div>
                      {paper.previewUrl ? (
                        <Button
                          onClick={() => handleDownload('preview')}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Preview
                        </Button>
                      ) : (
                        <Button size="sm" disabled variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Indisponível
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {!paper.fileUrl && (
                  <p className="text-sm text-muted-foreground italic">
                    Os arquivos deste trabalho ainda não foram enviados. Use a opção "Editar" para fazer upload dos arquivos.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      R$ 0,00
                    </div>
                    <p className="text-sm text-muted-foreground">Preço (Gratuito)</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-accent mb-2">
                      {new Date(paper.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
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
