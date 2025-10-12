import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, Eye, FileText, Briefcase } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  url: string;
  icon?: ReactNode;
  type?: 'resume' | 'portfolio' | 'document';
  uploadedAt?: string;
  size?: string;
  onView?: () => void;
  onDownload?: () => void;
}

export function DocumentCard({
  title,
  url,
  icon,
  type = 'document',
  uploadedAt,
  size,
  onView,
  onDownload
}: DocumentCardProps) {
  const getDefaultIcon = () => {
    switch (type) {
      case 'resume':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'portfolio':
        return <Briefcase className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'resume':
        return 'Currículo';
      case 'portfolio':
        return 'Portfolio';
      default:
        return 'Documento';
    }
  };

  const getTypeVariant = () => {
    switch (type) {
      case 'resume':
        return 'default';
      case 'portfolio':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleView = () => {
    if (onView) {
      onView();
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-gray-50 rounded-lg">
              {icon || getDefaultIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{title}</h4>
                <Badge variant={getTypeVariant()} className="text-xs">
                  {getTypeLabel()}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {uploadedAt && (
                  <span>
                    Enviado em {new Date(uploadedAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {size && <span>{size}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleView}
              title="Visualizar documento"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              title="Baixar documento"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(url, '_blank')}
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para lista de documentos
interface DocumentListProps {
  documents: Array<{
    id: string;
    title: string;
    url: string;
    type: 'resume' | 'portfolio' | 'document';
    uploadedAt?: string;
    size?: string;
  }>;
  emptyMessage?: string;
}

export function DocumentList({ documents, emptyMessage = "Nenhum documento encontrado" }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          title={doc.title}
          url={doc.url}
          type={doc.type}
          uploadedAt={doc.uploadedAt}
          size={doc.size}
        />
      ))}
    </div>
  );
}