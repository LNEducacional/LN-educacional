import { CartDrawer } from '@/components/cart/cart-drawer';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';

export default function CartButton() {
  const { cartCount, setCartOpen } = useCart();

  return (
    <div className="flex items-center gap-3">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Cart Button */}
      <CartDrawer>
        <Button
          variant="outline"
          size="sm"
          className="cart-button relative"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </CartDrawer>
    </div>
  );
}
