import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { LazyImage } from '@/components/ui/lazy-image';
import { useCart } from '@/context/cart-context';
import { academicAreaLabels, paperTypeLabels } from '@/data/mock-papers';
import { usePrefetch } from '@/hooks/use-prefetch';
import { useToast } from '@/hooks/use-toast';
import type { ReadyPaper } from '@/types/paper';
import { Download, Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  paper: ReadyPaper;
  isFree?: boolean;
  onPurchase?: (paper: ReadyPaper) => void;
}

export function ProductCard({ paper, isFree = false, onPurchase }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { prefetchData, cancelPrefetch } = usePrefetch();

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleAddToCart = () => {
    if (onPurchase) {
      // Se onPurchase foi fornecido, use-o (para redirecionar ao checkout)
      onPurchase(paper);
    } else {
      // Senão, apenas adiciona ao carrinho
      addItem({
        id: paper.id.toString(),
        title: paper.title,
        description: paper.description,
        price: paper.price,
        type: 'paper',
        thumbnailUrl: paper.thumbnailUrl || undefined,
      });

      toast({
        title: 'Item adicionado ao carrinho',
        description: `${paper.title} foi adicionado ao seu carrinho.`,
      });
    }
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(paper);
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
    <Card
      className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card border-border"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="p-4">
        <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted">
          <LazyImage
            src={thumbnailSrc}
            alt={paper.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            placeholder="/placeholder.svg"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">{paper.title}</h3>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{paper.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {isFree && (
            <Badge
              variant="default"
              className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              GRÁTIS
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {paperTypeLabels[paper.paperType]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {paper.pageCount} páginas
          </Badge>
          <Badge variant="outline" className="text-xs">
            {academicAreaLabels[paper.academicArea]}
          </Badge>
          {paper.downloadCount && paper.downloadCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {paper.downloadCount} downloads
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Por: {paper.authorName}</span>
          <span className="font-bold text-lg text-primary">
            {paper.price === 0 ? 'Gratuito' : formatPrice(paper.price)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {isFree ? (
          <Button
            onClick={handlePurchase}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Gratuito
          </Button>
        ) : (
          <Button onClick={handleAddToCart} className="flex-1 btn-hero">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comprar
          </Button>
        )}

        <Button variant="outline" asChild>
          <Link to={detailsLink}>
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
