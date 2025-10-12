import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import {
  BookOpen,
  Clock,
  Download,
  Eye,
  FileText,
  FileVideo,
  Loader2,
  Package,
  Library,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LibraryItem {
  id: string;
  title: string;
  type: 'EBOOK' | 'PAPER' | 'VIDEO' | 'MATERIAL';
  description: string;
  fileUrl: string;
  thumbnailUrl?: string;
  author?: string;
  pages?: number;
  duration?: string;
  expiresAt?: string;
  downloadable: boolean;
  academicArea: string;
  isFree?: boolean;
  downloadCount?: number;
  paperType?: string;
}

export function StudentLibrary() {
  const navigate = useNavigate();
  const { data: items, loading, error } = useApi<LibraryItem[]>('/student/library');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar biblioteca</p>
      </div>
    );
  }

  // Garantir que items seja um array
  const itemsArray = Array.isArray(items) ? items : [];

  // Agrupar por tipo
  const ebookItems = itemsArray.filter(item => item.type === 'EBOOK');
  const paperItems = itemsArray.filter(item => item.type === 'PAPER');
  const videoItems = itemsArray.filter(item => item.type === 'VIDEO');
  const materialItems = itemsArray.filter(item => item.type === 'MATERIAL');

  // Calcular estatísticas
  const stats = [
    {
      label: 'Total de Itens',
      value: itemsArray.length,
      icon: Library,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'E-books',
      value: ebookItems.length,
      icon: BookOpen,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Papers & Materiais',
      value: paperItems.length + materialItems.length,
      icon: FileText,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'EBOOK':
        return <BookOpen className="h-5 w-5" />;
      case 'VIDEO':
        return <FileVideo className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EBOOK':
        return 'E-book';
      case 'VIDEO':
        return 'Vídeo';
      case 'PAPER':
        return 'Paper';
      case 'MATERIAL':
        return 'Material';
      default:
        return type;
    }
  };

  const handleDownload = async (item: LibraryItem) => {
    if (item.downloadable && item.fileUrl) {
      // Para e-books, usar a rota específica de download
      if (item.type === 'EBOOK') {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/ebooks/${item.id}/download`,
            {
              credentials: 'include',
            }
          );

          if (response.ok) {
            const data = await response.json();
            window.open(data.downloadUrl, '_blank');
          } else {
            // Fallback para URL direta
            window.open(item.fileUrl, '_blank');
          }
        } catch (error) {
          // Fallback para URL direta em caso de erro
          window.open(item.fileUrl, '_blank');
        }
      }
      // Para papers gratuitos, usar a rota de download que adiciona à biblioteca
      else if (item.type === 'PAPER' && item.isFree) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/papers/${item.id}/download`,
            {
              credentials: 'include',
            }
          );

          if (response.ok) {
            const data = await response.json();
            window.open(data.downloadUrl, '_blank');
          } else {
            // Fallback para URL direta
            window.open(item.fileUrl, '_blank');
          }
        } catch (error) {
          // Fallback para URL direta em caso de erro
          window.open(item.fileUrl, '_blank');
        }
      } else {
        window.open(item.fileUrl, '_blank');
      }
    }
  };

  const handleView = async (item: LibraryItem) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    }
  };

  const renderItems = (items: LibraryItem[]) => (
    items.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card
            key={item.id}
            className="hover-scale group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            {/* Thumbnail */}
            {item.thumbnailUrl && (
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge className="bg-background/90 backdrop-blur-sm">
                    {getTypeLabel(item.type)}
                  </Badge>
                  {item.isFree && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                      GRÁTIS
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                  {getItemIcon(item.type)}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-2 leading-tight">{item.title}</CardTitle>
                  {item.author && (
                    <CardDescription className="text-xs">por {item.author}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">{item.academicArea}</Badge>
                {item.paperType && (
                  <Badge variant="outline" className="text-xs">{item.paperType}</Badge>
                )}
                {item.pages && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{item.pages}p</span>
                  </div>
                )}
                {item.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.duration}</span>
                  </div>
                )}
              </div>

              {/* Expiration Warning */}
              {item.expiresAt && (
                <div className="text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  {item.type === 'EBOOK'
                    ? `Download até: ${new Date(item.expiresAt).toLocaleDateString('pt-BR')}`
                    : `Expira: ${new Date(item.expiresAt).toLocaleDateString('pt-BR')}`}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleView(item)}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                {item.downloadable && (
                  <Button size="sm" className="flex-1 gap-2" onClick={() => handleDownload(item)}>
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          ))}
      </div>
    ) : (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhum item nesta categoria</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Explore nossos materiais e adicione itens à sua biblioteca.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Biblioteca Digital</h1>
        <p className="text-muted-foreground">
          Acesse todos os seus materiais digitais e recursos de estudo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos ({itemsArray.length})</TabsTrigger>
          <TabsTrigger value="ebooks">E-books ({ebookItems.length})</TabsTrigger>
          <TabsTrigger value="papers">Papers ({paperItems.length})</TabsTrigger>
          <TabsTrigger value="videos">Vídeos ({videoItems.length})</TabsTrigger>
          <TabsTrigger value="materials">Materiais ({materialItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {renderItems(itemsArray)}
        </TabsContent>

        <TabsContent value="ebooks" className="space-y-4 mt-6">
          {renderItems(ebookItems)}
        </TabsContent>

        <TabsContent value="papers" className="space-y-4 mt-6">
          {renderItems(paperItems)}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4 mt-6">
          {renderItems(videoItems)}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 mt-6">
          {renderItems(materialItems)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
