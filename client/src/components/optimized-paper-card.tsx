import { Card } from '@/components/ui/card';
import { useOptimistic } from '@/hooks/use-optimistic-react';
import { startTransition, useCallback, useMemo } from 'react';

interface Paper {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  isPurchased?: boolean;
}

interface OptimizedPaperCardProps {
  paper: Paper;
  onPurchase?: (paperId: string) => Promise<void>;
}

// Componente sem memo para evitar problemas com React 19
export function OptimizedPaperCard({ paper, onPurchase }: OptimizedPaperCardProps) {
  // React 19 otimiza automaticamente este useMemo
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(paper.price);
  }, [paper.price]);

  // useOptimistic para updates otimistas
  const [optimisticPurchased, updateOptimisticPurchased] = useOptimistic(
    paper.isPurchased || false,
    (_currentState, optimisticValue) => optimisticValue
  );

  // React 19 otimiza automaticamente este callback
  const handlePurchase = useCallback(async () => {
    if (!onPurchase) return;

    // Update otimista
    updateOptimisticPurchased(true);

    try {
      await onPurchase(paper.id);
    } catch (error) {
      // Em caso de erro, o estado será revertido automaticamente
      console.error('Erro na compra:', error);
    }
  }, [paper.id, onPurchase, updateOptimisticPurchased]);

  // Preload da imagem quando o componente monta
  const handleImagePreload = useCallback(() => {
    if (paper.thumbnail) {
      startTransition(() => {
        preloader.preloadImage(paper.thumbnail);
      });
    }
  }, [paper.thumbnail]);

  // Preload de recursos relacionados quando hover
  const handleMouseEnter = useCallback(() => {
    startTransition(() => {
      // Preload da página de detalhes se necessário
      preloader.preloadResource(`/api/papers/${paper.id}`, {
        as: 'fetch',
        crossOrigin: 'anonymous',
      });
    });
  }, [paper.id]);

  return (
    <Card
      className="paper-card hover:shadow-lg transition-shadow duration-200"
      onMouseEnter={handleMouseEnter}
    >
      {paper.thumbnail && (
        <img
          src={paper.thumbnail}
          alt={paper.title}
          className="w-full h-48 object-cover rounded-t-lg"
          loading="lazy"
          onLoad={handleImagePreload}
        />
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{paper.title}</h3>

        <p className="text-gray-600 mb-4 line-clamp-3">{paper.description}</p>

        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-green-600">{formattedPrice}</span>

          {!optimisticPurchased ? (
            <button
              type="button"
              onClick={handlePurchase}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              disabled={optimisticPurchased}
            >
              Comprar
            </button>
          ) : (
            <span className="text-green-600 font-medium">✓ Adquirido</span>
          )}
        </div>
      </div>
    </Card>
  );
}
