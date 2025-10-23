import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Ebook } from '@/types/ebook';
import { formatEbookAcademicArea, formatEbookPrice } from '@/utils/ebook-formatters';
import {
  BookOpen,
  User,
  ShoppingCart,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import CheckoutModal from '../checkout/checkout-modal';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { FlyToCartAnimation } from '../cart/fly-to-cart-animation';

interface EbookCardProps {
  ebook: Ebook;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
  isPurchased?: boolean;
}

export function EbookCard({
  ebook,
  variant = 'default',
  className,
  isPurchased = false,
}: EbookCardProps) {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number } | null>(null);
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ebook.price || ebook.price === 0) {
      toast({
        title: 'E-book gratuito',
        description: 'Este e-book é gratuito. Clique em "Detalhes" para baixar.',
      });
      return;
    }

    try {
      // Capturar posição do botão para animação
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      setFlyingItem({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      // Adicionar ao carrinho
      addItem({
        id: ebook.id,
        title: ebook.title,
        description: ebook.description || '',
        price: ebook.price,
        type: 'ebook',
        thumbnailUrl: ebook.coverUrl || '',
      });

      // Abrir drawer do carrinho após animação
      setTimeout(() => {
        setCartOpen(true);
      }, 800);

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${ebook.title} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o e-book ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Link to={`/ebooks/${ebook.id}`} className="block h-full">
        <Card
        className={cn(
          'group relative overflow-hidden h-full flex flex-col',
          'transition-all duration-300 ease-out',
          'hover:shadow-lg',
          'hover:-translate-y-1',
          'bg-card border',
          isFeatured && 'ring-1 ring-primary/20',
          className
        )}
      >

        {/* Thumbnail Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
          {ebook.coverUrl ? (
            <img
              src={ebook.coverUrl}
              alt={ebook.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/20">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Purchased Badge */}
          {isPurchased && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-primary text-primary-foreground border-0 shadow-sm px-2 py-0 text-[10px] font-medium">
                ADQUIRIDO
              </Badge>
            </div>
          )}

          {/* Free Badge */}
          {ebook.price === 0 && (
            <div className="absolute top-2 right-2 z-10">
              <Badge
                variant="outline"
                className="backdrop-blur-sm bg-background/90 border text-[10px] bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30"
              >
                GRATUITO
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-3 space-y-2">
          {/* Academic Area Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-normal bg-muted/50 px-2 py-0"
            >
              {formatEbookAcademicArea(ebook.academicArea)}
            </Badge>
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold leading-tight line-clamp-2 min-h-[2.5rem]',
            'text-foreground',
            isCompact ? 'text-sm' : 'text-base'
          )}>
            {ebook.title}
          </h3>

          {/* Description */}
          {!isCompact && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-grow">
              {ebook.description}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 pt-1.5 border-t">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">Autor</p>
              <p className="font-medium text-xs text-foreground truncate">
                {ebook.authorName}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{ebook.pageCount} páginas</span>
            </div>
          </div>
        </div>

        {/* Footer with Price and CTA */}
        <div className="p-3 pt-2 mt-auto border-t">
          {/* Price */}
          <div className="flex flex-col mb-2">
            <span className="text-[10px] text-muted-foreground mb-0.5">
              {ebook.price === 0 ? 'Disponível' : 'Investimento'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">
                {formatEbookPrice(ebook.price)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5">
            {!isPurchased && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs h-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCheckoutOpen(true);
                  }}
                >
                  <ShoppingCart className="h-3 w-3 mr-1.5" />
                  {ebook.price === 0 ? 'Baixar' : 'Comprar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-medium text-xs h-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  Detalhes
                </Button>
              </div>
            )}

            {/* Botão discreto de adicionar ao carrinho */}
            {!isPurchased && ebook.price && ebook.price > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-[10px] text-muted-foreground hover:text-foreground h-7"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                Adicionar ao Carrinho
              </Button>
            )}

            {/* Botão para ebooks adquiridos */}
            {isPurchased && (
              <Button
                size="sm"
                variant="default"
                className="w-full font-medium text-xs h-8"
                onClick={(e) => e.stopPropagation()}
              >
                Baixar PDF
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>

    {/* Checkout Modal */}
    <CheckoutModal
      open={checkoutOpen}
      onOpenChange={setCheckoutOpen}
      ebookId={ebook.id}
      courseTitle={ebook.title}
      coursePrice={ebook.price}
    />

    {/* Animação de item voando para o carrinho */}
    {flyingItem && (
      <FlyToCartAnimation
        startPosition={flyingItem}
        onComplete={() => setFlyingItem(null)}
      />
    )}
    </>
  );
}
