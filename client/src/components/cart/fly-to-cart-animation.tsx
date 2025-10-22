import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

interface FlyToCartAnimationProps {
  startPosition: { x: number; y: number };
  onComplete: () => void;
}

export function FlyToCartAnimation({ startPosition, onComplete }: FlyToCartAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Encontrar a posição do ícone do carrinho no header
    const cartIcon = document.querySelector('[data-cart-icon]');
    const cartRect = cartIcon?.getBoundingClientRect();

    if (!cartRect) {
      onComplete();
      return;
    }

    // Animar elemento
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  // Calcular a posição do carrinho
  const cartIcon = document.querySelector('[data-cart-icon]');
  const cartRect = cartIcon?.getBoundingClientRect();

  const endX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 50;
  const endY = cartRect ? cartRect.top + cartRect.height / 2 : 50;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: startPosition.x,
        top: startPosition.y,
        animation: 'flyToCart 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        '--end-x': `${endX - startPosition.x}px`,
        '--end-y': `${endY - startPosition.y}px`,
      } as React.CSSProperties}
    >
      <div className="relative">
        {/* Ícone do carrinho animado */}
        <div className="bg-green-500 text-white rounded-full p-3 shadow-lg animate-pulse">
          <ShoppingCart className="h-6 w-6" />
        </div>
        {/* Partículas ao redor */}
        <div className="absolute inset-0 animate-ping opacity-75">
          <div className="bg-green-400 rounded-full w-full h-full" />
        </div>
      </div>

      <style>{`
        @keyframes flyToCart {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5 - 100px)) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
