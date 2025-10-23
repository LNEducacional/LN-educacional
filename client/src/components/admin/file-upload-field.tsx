import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileUploadFieldProps {
  label: string;
  accept: string;
  file: File | null;
  existingFileUrl?: string;
  existingFileName?: string;
  isImage?: boolean;
  required?: boolean;
  onChange: (file: File | null) => void;
  onClearExisting?: () => void;
  maxSize?: string;
  fileTypes?: string;
}

export function FileUploadField({
  label,
  accept,
  file,
  existingFileUrl,
  existingFileName,
  isImage = false,
  required = false,
  onChange,
  onClearExisting,
  maxSize = '50MB',
  fileTypes = 'PDF, DOC, DOCX',
}: FileUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clearedExisting, setClearedExisting] = useState(false);

  // Criar preview URL para arquivos de imagem
  useEffect(() => {
    if (file && isImage && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Cleanup
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file, isImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  const handleClearFile = () => {
    onChange(null);
    // Resetar o input de arquivo
    const input = document.getElementById(`file-input-${label}`) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  const handleClearExisting = () => {
    setClearedExisting(true);
    if (onClearExisting) {
      onClearExisting();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const hasFile = file !== null;
  const hasExistingFile = !hasFile && existingFileUrl && !clearedExisting;

  return (
    <div className="space-y-2">
      <Label htmlFor={`file-input-${label}`}>
        {label} {required && '*'}
      </Label>

      {/* Preview de Imagem */}
      {isImage && (previewUrl || hasExistingFile) && (
        <div className="relative w-full aspect-video border-2 border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/20">
          <img
            src={previewUrl || existingFileUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          {hasFile && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleClearFile}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {hasExistingFile && (
            <>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClearExisting}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                Arquivo atual: {existingFileName || 'imagem existente'}
              </div>
            </>
          )}
        </div>
      )}

      {/* Informações do Arquivo Selecionado (não-imagem) */}
      {hasFile && !isImage && (
        <div className="border-2 border-primary/50 bg-primary/5 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearFile}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Arquivo Existente (não-imagem) */}
      {hasExistingFile && !isImage && (
        <div className="border-2 border-muted-foreground/25 bg-muted/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Arquivo atual
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {existingFileName || 'arquivo existente'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(existingFileUrl, '_blank')}
              className="flex-shrink-0"
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClearExisting}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!hasFile && !hasExistingFile && (
        <div className="relative">
          <input
            id={`file-input-${label}`}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            required={required && !existingFileUrl}
          />
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
            {isImage ? (
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              Clique para {hasExistingFile ? 'alterar' : 'fazer upload do'} {label.toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {fileTypes} até {maxSize}
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone quando tem arquivo selecionado (para imagens) */}
      {hasFile && isImage && (
        <div className="relative">
          <input
            id={`file-input-${label}-replace`}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="border-2 border-dashed border-primary/25 rounded-lg p-4 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
            <p className="text-xs text-muted-foreground">
              Clique para escolher outra imagem
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
