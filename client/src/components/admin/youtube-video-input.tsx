import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processYouTubeUrl, isValidYouTubeUrl } from '@/utils/youtube';
import { AlertCircle, Check, ExternalLink, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface YouTubeVideoInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function YouTubeVideoInput({
  value,
  onChange,
  label = 'Link do YouTube',
  placeholder = 'Cole o link do YouTube aqui (ex: https://youtu.be/...)',
  required = false,
  error,
}: YouTubeVideoInputProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isValid, setIsValid] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [videoData, setVideoData] = useState<ReturnType<typeof processYouTubeUrl>>(null);

  useEffect(() => {
    if (value) {
      setInputValue(value);
      validateUrl(value);
    }
  }, [value]);

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      setIsValid(false);
      setShowPreview(false);
      setVideoData(null);
      return;
    }

    const valid = isValidYouTubeUrl(url);
    setIsValid(valid);

    if (valid) {
      const data = processYouTubeUrl(url);
      setVideoData(data);
      setShowPreview(true);
      onChange(url); // Notify parent of valid URL
    } else {
      setVideoData(null);
      setShowPreview(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    validateUrl(newValue);
  };

  const handleClear = () => {
    setInputValue('');
    setIsValid(false);
    setShowPreview(false);
    setVideoData(null);
    onChange('');
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="relative">
          <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`pl-10 pr-10 ${
              inputValue && !isValid ? 'border-destructive focus-visible:ring-destructive' : ''
            } ${inputValue && isValid ? 'border-accent focus-visible:ring-accent' : ''}`}
          />
          {inputValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>

        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute -right-2 -top-2 h-6 text-xs"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Validation Messages */}
      {inputValue && !isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            URL inválida do YouTube. Formatos aceitos: youtube.com/watch?v=... ou youtu.be/...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Video Preview */}
      {showPreview && videoData && (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="aspect-video bg-black relative">
            <iframe
              src={videoData.embedUrl}
              title="YouTube video preview"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-3 bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-accent" />
              <span>Vídeo válido e pronto para usar</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="h-7 text-xs"
            >
              <a
                href={videoData.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Ver no YouTube
              </a>
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Cole o link de qualquer vídeo público do YouTube. Formatos aceitos: youtube.com/watch?v=ID,
        youtu.be/ID, ou apenas o ID do vídeo.
      </p>
    </div>
  );
}
