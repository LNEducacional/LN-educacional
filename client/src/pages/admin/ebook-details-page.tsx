import { useEffect, useState } from 'react';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { toast } from '@/hooks/use-toast';
import type { Ebook } from '@/types/ebook';
import { formatEbookAcademicArea, formatEbookPrice } from '@/utils/ebook-formatters';
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
  BookOpen,
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Hash,
  ImageIcon,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EbookDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        // TODO: Implementar busca real do e-book da API
        // Simulação temporária
        setEbook({
          id: id,
          title: 'E-book de Exemplo',
          description:
            'Descrição detalhada do e-book de exemplo com conteúdo educacional relevante.',
          academicArea: 'ADMINISTRATION',
          authorName: 'Autor Exemplo',
          pageCount: 120,
          price: 2990, // 29.90 em centavos
          fileUrl: '/exemplo.pdf',
          coverUrl: '/exemplo-capa.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
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

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/ebooks/edit/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!ebook) return;

    try {
      toast({
        title: 'E-book excluído com sucesso',
        description: `"${ebook.title}" foi removido.`,
      });
      navigate('/admin/ebooks');
    } catch (_error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o e-book. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (type: 'file' | 'cover') => {
    toast({
      title: 'Download iniciado',
      description: `O download ${type === 'file' ? 'do arquivo' : 'da capa'} foi iniciado.`,
    });
  };

  const handleViewCover = () => {
    toast({
      title: 'Visualizando capa',
      description: 'Abrindo visualização da capa do e-book.',
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={'ebooks' as const} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Carregando...</h2>
                <p className="text-muted-foreground">Buscando informações do e-book</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!ebook) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar activeSection={'ebooks' as const} onSectionChange={handleSectionChange} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  E-book não encontrado
                </h2>
                <p className="text-muted-foreground mb-4">
                  O e-book solicitado não foi encontrado.
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
        <AdminSidebar activeSection={'ebooks' as const} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{ebook.title}</h1>
                  <p className="text-muted-foreground">Detalhes do e-book</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Tipo e Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tipo e Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Tipo:</span>
                      {ebook.price === 0 ? (
                        <Badge className={cn('font-medium', 'bg-green-500 hover:bg-green-600 text-white')}>
                          Gratuito
                        </Badge>
                      ) : (
                        <Badge className={cn('font-medium', 'bg-blue-500 hover:bg-blue-600 text-white')}>
                          Pago
                        </Badge>
                      )}
                    </div>
                    {ebook.price > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Preço:</span>
                        <span className="text-muted-foreground">{formatEbookPrice(ebook.price)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Criado em:</span>
                      <span className="text-muted-foreground">
                        {new Date(ebook.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">ID:</span>
                      <span className="text-muted-foreground">#{ebook.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Área:</span>
                      <Badge variant="outline">{formatEbookAcademicArea(ebook.academicArea)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Páginas:</span>
                      <span className="text-muted-foreground">{ebook.pageCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Autor:</span>
                      <span className="text-muted-foreground">{ebook.authorName}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {ebook.coverUrl && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">Capa:</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={handleViewCover}
                            size="sm"
                            className="gap-1 h-7 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDownload('cover')}
                            size="sm"
                            className="gap-1 h-7 text-xs"
                          >
                            <Download className="h-3 w-3" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arquivos */}
            <Card>
              <CardHeader>
                <CardTitle>Arquivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Arquivo do E-book</h4>
                      <p className="text-sm text-muted-foreground">PDF completo do e-book</p>
                    </div>
                    <Button onClick={() => handleDownload('file')} size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar Arquivo
                    </Button>
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
