import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/use-api';
import {
  Download,
  File,
  FileText,
  Loader2,
  Search,
} from 'lucide-react';
import { useState } from 'react';

interface DownloadItem {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'EBOOK' | 'MATERIAL';
  size: string;
  downloadUrl: string;
  downloadedAt?: string;
  expiresAt?: string;
}

export function StudentDownloads() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: downloads, loading, error } = useApi<DownloadItem[]>('/student/downloads');

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
        <p className="text-muted-foreground">Erro ao carregar downloads</p>
      </div>
    );
  }

  // Garantir que downloads seja um array
  const downloadsArray = Array.isArray(downloads) ? downloads : [];

  const filteredDownloads = downloadsArray.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'DOC':
        return <File className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      PDF: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      DOC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      EBOOK: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      MATERIAL: 'bg-accent-subtle text-accent-foreground dark:bg-accent/20 dark:text-accent',
    };

    return (
      <Badge className={variants[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const handleDownload = (item: DownloadItem) => {
    window.open(item.downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground">
          Acesse todos os arquivos que você baixou
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar downloads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{downloadsArray.length}</div>
            <p className="text-xs text-muted-foreground">Total de Downloads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {downloadsArray.filter((d) => d.type === 'PDF').length}
            </div>
            <p className="text-xs text-muted-foreground">PDFs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {downloadsArray.filter((d) => d.type === 'EBOOK').length}
            </div>
            <p className="text-xs text-muted-foreground">E-books</p>
          </CardContent>
        </Card>
      </div>

      {/* Downloads List */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Downloads ({filteredDownloads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-12">
              <Download className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum download encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Tente ajustar os termos de busca.'
                  : 'Você ainda não baixou nenhum arquivo.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDownloads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-accent/30">
                    {getFileIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">{item.size}</p>
                      {item.downloadedAt && (
                        <p className="text-xs text-muted-foreground">
                          • Baixado em {new Date(item.downloadedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(item.type)}
                    <Button
                      size="sm"
                      onClick={() => handleDownload(item)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
