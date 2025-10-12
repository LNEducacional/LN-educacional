import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from './cart-item';

interface CartDrawerProps {
  children: React.ReactNode;
}

const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const CartDrawer: React.FC<CartDrawerProps> = ({ children }) => {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    setCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    cartCount,
    cartSubtotal,
    cartTotal,
  } = useCart();

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  const handleClearCart = () => {
    clearCart();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 bg-background/95 backdrop-blur-lg">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5" />
            Seu Carrinho
            {cartCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({cartCount} {cartCount === 1 ? 'item' : 'itens'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Seu carrinho está vazio</h3>
              <p className="text-sm text-muted-foreground">
                Adicione itens para começar seu pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator className="my-4" />

            {/* Resumo */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <SheetFooter className="flex-col gap-2">
              <Button onClick={handleCheckout} className="w-full btn-hero" size="lg">
                Finalizar Compra
              </Button>

              <Button variant="outline" onClick={handleClearCart} className="w-full" size="sm">
                Limpar Carrinho
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
