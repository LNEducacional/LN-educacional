import { useEffect, useState } from 'react';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { mockReadyPapers } from '@/data/mock-ready-papers';
import { toast } from '@/hooks/use-toast';
import type { ReadyPaper } from '@/types/paper';
import { useNavigate, useParams } from 'react-router-dom';

import {
  formatAcademicArea,
  formatKeywords,
  formatLanguage,
  formatPaperType,
  formatPrice,
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
  User,
} from 'lucide-react';

export default function ReadyPaperDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<ReadyPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'courses' | 'users' | 'categories' | 'notifications' | 'settings'
  >('dashboard');

  useEffect(() => {
    if (id) {
      // Simular carregamento
      setTimeout(() => {
        const foundPaper = mockReadyPapers.find((p) => p.id === Number.parseInt(id, 10));
        setPaper(foundPaper || null);
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
    }
  }, [id]);

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

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/ready-papers/edit/${id}`);
    }
  };

  const handleDownload = (type: 'main' | 'preview') => {
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

  if (!paper) {
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
                  O trabalho solicitado não foi encontrado.
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
                  <h1 className="text-3xl font-bold text-foreground">Detalhes do Trabalho</h1>
                  <p className="text-muted-foreground">
                    Informações completas do trabalho selecionado
                  </p>
                </div>
              </div>
              <Button onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
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
                  <h2 className="text-2xl font-bold text-foreground mb-2">{paper.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{paper.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Autor:</span>
                      <span className="text-muted-foreground">{paper.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Idioma:</span>
                      <span className="text-muted-foreground">
                        {formatLanguage(paper.language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Data de criação:</span>
                      <span className="text-muted-foreground">
                        {paper.createdAt.toLocaleDateString('pt-BR')}
                      </span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Arquivo Principal</h4>
                        <p className="text-sm text-muted-foreground">Documento completo</p>
                      </div>
                      <Button onClick={() => handleDownload('main')} size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                    </div>
                  </div>

                  {paper.previewUrl && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">Preview</h4>
                          <p className="text-sm text-muted-foreground">Visualização prévia</p>
                        </div>
                        <Button
                          onClick={() => handleDownload('preview')}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Preview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Classificação */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
                <CardDescription>Categoria e tipo do trabalho</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-foreground">Tipo de Trabalho</div>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {formatPaperType(paper.paperType)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Área Acadêmica</div>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {formatAcademicArea(paper.academicArea)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes Técnicos */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes Técnicos</CardTitle>
                <CardDescription>Informações sobre extensão e valor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold text-primary mb-2">{paper.pageCount}</div>
                    <p className="text-sm text-muted-foreground">Páginas</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {formatPrice(paper.price)}
                    </div>
                    <p className="text-sm text-muted-foreground">Preço de venda</p>
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
