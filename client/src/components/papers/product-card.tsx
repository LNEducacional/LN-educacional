import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/context/cart-context';
import { academicAreaLabels, paperTypeLabels } from '@/data/mock-papers';
import { usePrefetch } from '@/hooks/use-prefetch';
import { useToast } from '@/hooks/use-toast';
import type { ReadyPaper } from '@/types/paper';
import { Download, FileText, ShoppingCart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { FlyToCartAnimation } from '@/components/cart/fly-to-cart-animation';
import CheckoutModal from '@/components/checkout/checkout-modal';

interface ProductCardProps {
  paper: ReadyPaper;
  isFree?: boolean;
  onPurchase?: (paper: ReadyPaper) => void;
  className?: string;
}

export function ProductCard({ paper, isFree = false, onPurchase, className }: ProductCardProps) {
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();
  const { prefetchData, cancelPrefetch } = usePrefetch();
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (paper.price === 0) {
      toast({
        title: 'Trabalho gratuito',
        description: 'Este trabalho é gratuito. Clique em "Detalhes" para fazer o download.',
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
        id: paper.id.toString(),
        title: paper.title,
        description: `${paperTypeLabels[paper.paperType]} - ${paper.pageCount} páginas`,
        price: paper.price,
        type: 'paper',
        thumbnailUrl: paper.thumbnailUrl || undefined,
      });

      // Abrir drawer do carrinho após animação
      setTimeout(() => {
        setCartOpen(true);
      }, 800);

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${paper.title} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o trabalho ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  const handlePurchase = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFree && onPurchase) {
      // Para papers gratuitos, usar a função onPurchase (download)
      onPurchase(paper);
    } else {
      // Para papers pagos, abrir modal de checkout
      setCheckoutOpen(true);
    }
  };

  const thumbnailSrc = paper.thumbnailUrl || '/placeholder.svg';
  const detailsLink = isFree ? `/free-papers/${paper.id}` : `/ready-papers/${paper.id}`;

  const handleMouseEnter = () => {
    // Prefetch paper details when hovering
    prefetchData(`/papers/${paper.id}`);
  };

  const handleMouseLeave = () => {
    // Cancel prefetch if user quickly moves away
    cancelPrefetch();
  };

  return (
    <>
      <Link to={detailsLink} className="block h-full">
        <Card
          className={cn(
            'group relative overflow-hidden h-full flex flex-col',
            'transition-all duration-300 ease-out',
            'hover:shadow-lg',
            'hover:-translate-y-1',
            'bg-card border',
            isFree && 'ring-1 ring-primary/20',
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Thumbnail Section */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
            {paper.thumbnailUrl ? (
              <img
                src={thumbnailSrc}
                alt={paper.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/20">
                <FileText className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}

            {/* Free Badge */}
            {isFree && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-primary text-primary-foreground border-0 shadow-sm px-2 py-0 text-[10px] font-medium">
                  GRÁTIS
                </Badge>
              </div>
            )}

            {/* Paper Type Badge */}
            <div className="absolute top-2 right-2 z-10">
              <Badge
                variant="outline"
                className="backdrop-blur-sm bg-background/90 border text-[10px]"
              >
                {paperTypeLabels[paper.paperType]}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col p-3 space-y-2">
            {/* Academic Area Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-[10px] font-normal bg-muted/50 px-2 py-0"
              >
                {academicAreaLabels[paper.academicArea]}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-normal px-2 py-0"
              >
                {paper.pageCount} páginas
              </Badge>
            </div>

            {/* Title */}
            <h3 className="font-semibold leading-tight line-clamp-2 min-h-[2.5rem] text-foreground text-base">
              {paper.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-grow">
              {paper.description}
            </p>

            {/* Author */}
            <div className="flex items-center gap-2 pt-1.5 border-t">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <FileText className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground">Autor</p>
                <p className="font-medium text-xs text-foreground truncate">
                  {paper.authorName}
                </p>
              </div>
            </div>

            {/* Download Count */}
            {paper.downloadCount && paper.downloadCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="h-3 w-3" />
                <span>{paper.downloadCount} downloads</span>
              </div>
            )}
          </div>

          {/* Footer with Price and CTA */}
          <div className="p-3 pt-2 mt-auto border-t">
            {/* Price */}
            <div className="flex flex-col mb-2">
              <span className="text-[10px] text-muted-foreground mb-0.5">
                Investimento
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary">
                  {paper.price === 0 ? 'Gratuito' : formatPrice(paper.price)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5">
              {isFree ? (
                /* Trabalho gratuito - apenas botão de download */
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs h-9"
                  onClick={handlePurchase}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Grátis
                </Button>
              ) : (
                /* Trabalho pago - botões de compra e detalhes */
                <>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs h-8"
                      onClick={handlePurchase}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1.5" />
                      Comprar
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

                  {/* Botão discreto de adicionar ao carrinho */}
                  {paper.price && paper.price > 0 && (
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
                </>
              )}
            </div>
          </div>
        </Card>
      </Link>

      {/* Animação de item voando para o carrinho */}
      {flyingItem && (
        <FlyToCartAnimation
          startPosition={flyingItem}
          onComplete={() => setFlyingItem(null)}
        />
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        paperId={paper.id.toString()}
        courseTitle={paper.title}
        coursePrice={paper.price}
      />
    </>
  );
}
