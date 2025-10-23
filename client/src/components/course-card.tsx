import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Course } from '@/types/course';
import { formatAcademicArea, formatDuration, formatPrice } from '@/utils/course-formatters';
import {
  Clock,
  GraduationCap,
  Users,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import CheckoutModal from './checkout/checkout-modal';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { FlyToCartAnimation } from './cart/fly-to-cart-animation';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
  onEnroll?: (course: Course) => void;
  showProgress?: boolean;
  progress?: number;
}

const levelColors = {
  BEGINNER: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30',
  INTERMEDIATE: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/30',
  ADVANCED: 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/30',
};

const levelLabels = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

export function CourseCard({
  course,
  variant = 'default',
  className,
  showProgress = false,
  progress = 0,
}: CourseCardProps) {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured' || course.isFeatured;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number } | null>(null);
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!course.price || course.price === 0) {
      toast({
        title: 'Curso gratuito',
        description: 'Este curso é gratuito. Clique em "Detalhes" para se inscrever.',
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
        id: course.id,
        title: course.title,
        description: course.description || '',
        price: course.price,
        type: 'course',
        thumbnailUrl: course.thumbnailUrl || '',
      });

      // Abrir drawer do carrinho após animação
      setTimeout(() => {
        setCartOpen(true);
      }, 800);

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${course.title} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o curso ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Link to={`/courses/${course.id}`} className="block h-full">
        <Card
        className={cn(
          'group relative overflow-hidden h-full flex flex-col',
          'transition-all duration-300 ease-out',
          'hover:shadow-lg',
          'hover:-translate-y-1',
          'bg-card border',
          isFeatured && 'ring-1 ring-primary/20',
          className
        )}
      >

        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden bg-muted/20">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/20">
              <GraduationCap className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}

          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-primary text-primary-foreground border-0 shadow-sm px-2.5 py-0.5 text-xs font-medium">
                DESTAQUE
              </Badge>
            </div>
          )}

          {/* Level Badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant="outline"
              className={cn(
                'backdrop-blur-sm bg-background/90 border text-xs',
                levelColors[course.level || 'BEGINNER']
              )}
            >
              {levelLabels[course.level || 'BEGINNER']}
            </Badge>
          </div>

          {/* Progress bar if enrolled */}
          {showProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30 backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-5 space-y-3">
          {/* Academic Area Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-normal bg-muted/50"
            >
              {formatAcademicArea(course.academicArea)}
            </Badge>
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold leading-tight line-clamp-2 min-h-[3rem]',
            'text-foreground',
            isCompact ? 'text-base' : 'text-lg'
          )}>
            {course.title}
          </h3>

          {/* Description */}
          {!isCompact && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-grow">
              {course.description}
            </p>
          )}

          {/* Instructor */}
          <div className="flex items-center gap-2.5 pt-2 border-t">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Instrutor</p>
              <p className="font-medium text-sm text-foreground truncate">
                {course.instructorName}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(course.duration)}</span>
            </div>
            {course.enrollments && course.enrollments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{course.enrollments.length} alunos</span>
              </div>
            )}
          </div>

          {/* Progress Info (if showing) */}
          {showProgress && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground font-medium">Seu Progresso</span>
                <span className="font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-700 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Price and CTA */}
        <div className="p-5 pt-3 mt-auto border-t">
          {/* Price */}
          <div className="flex flex-col mb-3">
            <span className="text-xs text-muted-foreground mb-0.5">
              Investimento
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(course.price)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!showProgress && (
              <div className="flex gap-2">
                <Button
                  size={isCompact ? 'sm' : 'default'}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCheckoutOpen(true);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar
                </Button>
                <Button
                  size={isCompact ? 'sm' : 'default'}
                  variant="outline"
                  className="font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Detalhes
                </Button>
              </div>
            )}

            {/* Botão discreto de adicionar ao carrinho */}
            {!showProgress && course.price && course.price > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-3 w-3 mr-1.5" />
                Adicionar ao Carrinho
              </Button>
            )}

            {/* Botão para cursos em progresso */}
            {showProgress && (
              <Button
                size={isCompact ? 'sm' : 'default'}
                variant="default"
                className="w-full font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Continuar
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>

    {/* Checkout Modal */}
    <CheckoutModal
      open={checkoutOpen}
      onOpenChange={setCheckoutOpen}
      courseId={course.id}
      courseTitle={course.title}
      coursePrice={course.price}
    />

    {/* Animação de item voando para o carrinho */}
    {flyingItem && (
      <FlyToCartAnimation
        startPosition={flyingItem}
        onComplete={() => setFlyingItem(null)}
      />
    )}
    </>
  );
}
