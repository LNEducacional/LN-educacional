import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, FileText, ShoppingCart } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface EbookCardProps {
  id: number;
  title: string;
  description: string;
  price: number; // em centavos
  isFree: boolean;
  pageCount: number;
  coverUrl: string;
  academicArea: string;
}

export const EbookCard = memo(function EbookCard({
  id,
  title,
  description,
  price,
  isFree,
  pageCount,
  coverUrl,
  academicArea,
}: EbookCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  // Memoize expensive calculations
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  }, [price]);

  const handleAddToCart = useCallback(() => {
    addItem({
      id: id.toString(),
      title,
      description,
      price,
      type: 'ebook',
      thumbnailUrl: coverUrl,
    });

    toast({
      title: 'E-book adicionado ao carrinho',
      description: `${title} foi adicionado ao seu carrinho.`,
    });
  }, [addItem, id, title, description, price, coverUrl, toast]);

  const handleFreeDownload = useCallback(() => {
    toast({
      title: 'Download iniciado',
      description: `${title} será baixado em instantes.`,
    });
    // Aqui seria implementada a lógica de download
  }, [title, toast]);

  const thumbnailSrc = useMemo(() => coverUrl || '/placeholder.svg', [coverUrl]);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card border-border">
      <CardHeader className="p-4">
        <div className="aspect-[3/4] rounded-md overflow-hidden bg-muted relative">
          <img
            src={thumbnailSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-2 right-2">
            <FileText className="h-6 w-6 text-white bg-black/50 rounded p-1" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">{title}</h3>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {isFree && (
            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              Gratuito
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {pageCount} páginas
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {academicArea}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">PDF Digital</span>
          <span className="font-bold text-lg text-primary">
            {isFree ? 'Gratuito' : formattedPrice}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {isFree ? (
          <Button onClick={handleFreeDownload} className="flex-1 btn-accent">
            <Download className="w-4 h-4 mr-2" />
            Download Gratuito
          </Button>
        ) : (
          <Button onClick={handleAddToCart} className="flex-1 btn-hero">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comprar e Baixar
          </Button>
        )}

        <Button variant="outline" asChild>
          <Link to={`/ebooks/${id}`}>
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});
