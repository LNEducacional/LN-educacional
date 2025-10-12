import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import blogService from '@/services/blog.service';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  postId: string;
  initialCount?: number;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

export default function LikeButton({
  postId,
  initialCount = 0,
  className,
  variant = 'ghost',
  size = 'default',
  showText = true,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { user } = useAuth();

  // Load initial like status and count
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialLoading(true);

        // Load like count
        const { count } = await blogService.getPostLikeCount(postId);
        setLikeCount(count);

        // Load user like status if logged in
        if (user) {
          const { liked } = await blogService.getUserLikeStatus(postId);
          setIsLiked(liked);
        }
      } catch (error) {
        console.error('Error loading like data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [postId, user]);

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para curtir um post');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const { liked } = await blogService.toggleLike(postId);

      setIsLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);

      toast.success(
        liked ? 'Post curtido!' : 'Curtida removida',
        { duration: 2000 }
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erro ao curtir post. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            isLiked
              ? 'fill-red-500 text-red-500'
              : 'text-muted-foreground hover:text-red-500'
          )}
        />
      )}
      {showText && (
        <span className={cn(
          'transition-colors',
          isLiked ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {likeCount}
        </span>
      )}
    </>
  );

  if (isInitialLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2 cursor-not-allowed', className)}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && <span>--</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleLike}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all',
        isLiked && variant === 'ghost' && 'bg-red-50 hover:bg-red-100',
        className
      )}
      title={user ? (isLiked ? 'Remover curtida' : 'Curtir post') : 'Faça login para curtir'}
    >
      {buttonContent}
    </Button>
  );
}