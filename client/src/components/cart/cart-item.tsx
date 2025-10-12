import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType } from '@/context/cart-context';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type React from 'react';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'paper':
      return 'Trabalho Pronto';
    case 'ebook':
      return 'E-book';
    case 'course':
      return 'Curso';
    default:
      return 'Produto';
  }
};

export const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(item.id, newQuantity);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className="flex gap-3 p-3 bg-card rounded-lg border border-border">
      {/* Imagem do produto */}
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title || 'Produto'}
            className="w-full h-full object-cover rounded-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`flex flex-col items-center justify-center text-xs text-muted-foreground ${item.thumbnailUrl ? 'hidden' : ''}`}
        >
          <span className="text-lg mb-1">📄</span>
          <span className="text-center leading-tight">{getTypeLabel(item.type)}</span>
        </div>
      </div>

      {/* Informações do produto */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground leading-tight mb-1">
          {item.title || 'Produto sem título'}
        </h4>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between">
          {/* Controles de quantidade */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleQuantityChange(item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>

            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleQuantityChange(item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Preço */}
          <div className="text-right">
            <div className="text-sm font-semibold text-foreground">{formatCurrency(itemTotal)}</div>
            {item.quantity > 1 && (
              <div className="text-xs text-muted-foreground">{formatCurrency(item.price)} cada</div>
            )}
          </div>
        </div>
      </div>

      {/* Botão remover */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
