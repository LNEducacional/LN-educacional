import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/context/cart-context';
import { useSearch } from '@/hooks/use-search';
import { BookOpen, FileText, Loader2, Search, ShoppingCart, Video, X } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'paper' | 'course' | 'ebook';
  thumbnailUrl?: string;
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { query, setQuery, results, loading, error } = useSearch();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <FileText className="h-4 w-4" />;
      case 'course':
        return <Video className="h-4 w-4" />;
      case 'ebook':
        return <BookOpen className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'paper':
        return 'Paper';
      case 'course':
        return 'Curso';
      case 'ebook':
        return 'E-book';
      default:
        return type;
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleResultClick = (url: string) => {
    navigate(url);
    onClose();
  };

  const handleAddToCart = (result: SearchResult) => {
    addItem({
      id: result.id,
      title: result.title,
      description: result.description,
      price: result.price,
      type: result.type,
      thumbnailUrl: result.thumbnailUrl,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Buscar produtos</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar papers, cursos, e-books..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 pt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && query.length >= 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <ScrollArea className="h-[400px] -mx-6 px-6">
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    type="button"
                    key={`${result.type}-${result.id}`}
                    className="group flex items-start gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors w-full text-left"
                    onClick={() => handleResultClick(result.url)}
                    aria-label={`Abrir resultado: ${result.title}`}
                  >
                    {result.thumbnailUrl && (
                      <img
                        src={result.thumbnailUrl}
                        alt={result.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                            {result.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {getTypeIcon(result.type)}
                              <span className="ml-1">{getTypeLabel(result.type)}</span>
                            </Badge>
                            <span className="text-sm font-medium text-primary">
                              {formatPrice(result.price)}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(result);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {!query && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Digite pelo menos 2 caracteres para buscar</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
