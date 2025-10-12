import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Share2,
  Facebook,
  MessageCircle,
  Linkedin,
  Link2,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'popover' | 'inline';
}

interface SharePlatform {
  name: string;
  icon: React.ReactNode;
  shareUrl: (url: string, title: string, description?: string) => string;
  color: string;
  hoverColor: string;
}

const sharePlatforms: SharePlatform[] = [
  {
    name: 'WhatsApp',
    icon: <MessageCircle className="h-4 w-4" />,
    shareUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
    color: 'text-green-600',
    hoverColor: 'hover:bg-green-50 hover:text-green-700',
  },
  {
    name: 'Facebook',
    icon: <Facebook className="h-4 w-4" />,
    shareUrl: (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
    color: 'text-blue-600',
    hoverColor: 'hover:bg-blue-50 hover:text-blue-700',
  },
  {
    name: 'LinkedIn',
    icon: <Linkedin className="h-4 w-4" />,
    shareUrl: (url, title, description) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`,
    color: 'text-blue-700',
    hoverColor: 'hover:bg-blue-50 hover:text-blue-800',
  },
];

function ShareButton({ platform, url, title, description, onClick }: {
  platform: SharePlatform;
  url: string;
  title: string;
  description?: string;
  onClick?: () => void;
}) {
  const handleShare = () => {
    const shareUrl = platform.shareUrl(url, title, description);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onClick?.();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className={cn(
        'w-full justify-start gap-3 transition-colors',
        platform.color,
        platform.hoverColor
      )}
    >
      {platform.icon}
      <span>Compartilhar no {platform.name}</span>
    </Button>
  );
}

function CopyLinkButton({ url, onClick }: { url: string; onClick?: () => void }) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
      onClick?.();
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopyLink}
      className="w-full justify-start gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
    >
      <Link2 className="h-4 w-4" />
      <span>Copiar link</span>
    </Button>
  );
}

export default function ShareButtons({
  url,
  title,
  description,
  className,
  variant = 'popover'
}: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closePopover = () => setIsOpen(false);

  const ShareContent = (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-muted-foreground mb-3">
        Compartilhar este post
      </h4>
      <div className="space-y-1">
        {sharePlatforms.map((platform) => (
          <ShareButton
            key={platform.name}
            platform={platform}
            url={url}
            title={title}
            description={description}
            onClick={closePopover}
          />
        ))}
        <CopyLinkButton url={url} onClick={closePopover} />
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          {ShareContent}
        </CardContent>
      </Card>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        {ShareContent}
      </PopoverContent>
    </Popover>
  );
}

// Simplified share buttons for blog cards or listings
export function SimpleShareButtons({
  url,
  title,
  description,
  className
}: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', className)}
          title="Compartilhar"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-1">
          {sharePlatforms.map((platform) => (
            <ShareButton
              key={platform.name}
              platform={platform}
              url={url}
              title={title}
              description={description}
              onClick={() => setIsOpen(false)}
            />
          ))}
          <CopyLinkButton url={url} onClick={() => setIsOpen(false)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}