import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Check,
  ShoppingBag,
  BookOpen,
  GraduationCap,
  FileText,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';
import api from '@/services/api';
import { formatPrice } from '@/utils/course-formatters';
import { MainLayout } from '@/components/main-layout';
import { CourseCard } from '@/components/course-card';
import { EbookCard } from '@/components/ebooks/ebook-card';
import { ProductCard } from '@/components/papers/product-card';

interface SimilarProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  thumbnailUrl?: string;
  academicArea?: string;
  type: 'course' | 'ebook' | 'paper';
  // Course specific
  instructor?: string;
  instructorName?: string;
  duration?: number;
  level?: string;
  // Paper/Ebook specific
  author?: string;
  pages?: number;
  paperType?: string;
}

interface SimilarProductsResponse {
  products: SimilarProduct[];
  purchasedItem: {
    id: string;
    title: string;
    type: string;
    academicArea?: string;
  };
}

export default function PurchaseSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  const orderId = searchParams.get('orderId');
  const itemType = searchParams.get('type') || 'course';
  const itemId = searchParams.get('itemId');
  const itemTitle = searchParams.get('title');
  const academicArea = searchParams.get('area');

  // Buscar produtos similares
  const { data: similarData, isLoading } = useQuery({
    queryKey: ['similar-products', itemType, academicArea, itemId],
    queryFn: async () => {
      const response = await api.get<SimilarProductsResponse>('/products/similar', {
        params: {
          type: itemType,
          academicArea,
          excludeId: itemId,
          limit: 6,
        },
      });
      return response.data;
    },
    enabled: !!itemType,
  });

  useEffect(() => {
    // Esconder confetti após 3 segundos
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const getAccessButton = () => {
    switch (itemType) {
      case 'course':
        return {
          label: 'Acessar Curso Agora',
          icon: <GraduationCap className="h-4 w-4 mr-2" />,
          path: `/courses/${itemId}`,
        };
      case 'ebook':
        return {
          label: 'Baixar E-book',
          icon: <BookOpen className="h-4 w-4 mr-2" />,
          path: `/ebooks/${itemId}`,
        };
      case 'paper':
        return {
          label: 'Baixar Trabalho',
          icon: <FileText className="h-4 w-4 mr-2" />,
          path: `/ready-papers/${itemId}`,
        };
      default:
        return {
          label: 'Ver Meus Pedidos',
          icon: <ShoppingBag className="h-4 w-4 mr-2" />,
          path: '/student/orders',
        };
    }
  };

  const accessButton = getAccessButton();

  const renderSimilarProduct = (product: SimilarProduct) => {
    if (product.type === 'course') {
      return (
        <CourseCard
          key={product.id}
          course={{
            id: product.id,
            title: product.title,
            description: product.description || '',
            price: product.price,
            thumbnailUrl: product.thumbnailUrl,
            academicArea: product.academicArea || '',
            instructorName: product.instructorName || product.instructor || 'Instrutor',
            duration: product.duration || 0,
            level: (product.level as any) || 'BEGINNER',
          }}
          variant="compact"
        />
      );
    }

    if (product.type === 'ebook') {
      return (
        <EbookCard
          key={product.id}
          ebook={{
            id: product.id,
            title: product.title,
            description: product.description || '',
            price: product.price,
            coverUrl: product.thumbnailUrl,
            academicArea: product.academicArea || '',
            author: product.author || 'Autor',
            pages: product.pages || 0,
          }}
        />
      );
    }

    // Paper
    return (
      <ProductCard
        key={product.id}
        paper={{
          id: product.id,
          title: product.title,
          description: product.description || '',
          price: product.price,
          thumbnailUrl: product.thumbnailUrl,
          academicArea: product.academicArea || '',
          author: product.author || 'Autor',
          pages: product.pages || 0,
          paperType: product.paperType || 'ARTICLE',
        }}
      />
    );
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Sucesso Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center relative">
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  <Sparkles className="absolute top-2 left-10 h-6 w-6 animate-pulse" />
                  <Sparkles className="absolute top-4 right-20 h-4 w-4 animate-pulse delay-100" />
                  <Sparkles className="absolute bottom-2 left-1/4 h-5 w-5 animate-pulse delay-200" />
                  <Sparkles className="absolute bottom-4 right-1/3 h-4 w-4 animate-pulse delay-300" />
                </div>
              )}

              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Compra Realizada com Sucesso!</h1>
              <p className="text-white/90">
                {orderId ? `Pedido #${orderId}` : 'Seu pagamento foi confirmado'}
              </p>
            </div>

            <CardContent className="p-6">
              <div className="text-center mb-6">
                {itemTitle && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Você adquiriu:</p>
                    <p className="text-lg font-semibold">{decodeURIComponent(itemTitle)}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate(accessButton.path)} className="btn-hero" size="lg">
                    {accessButton.icon}
                    {accessButton.label}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/student/orders')}
                    size="lg"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Ver Meus Pedidos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produtos Similares */}
          {similarData?.products && similarData.products.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Você Também Pode Gostar
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Produtos relacionados que podem te interessar
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {similarData.products.map((product) => (
                  <div key={product.id} className="animate-slide-up">
                    {renderSimilarProduct(product)}
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Separator className="mb-6" />
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/courses">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Ver Todos os Cursos
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/ebooks">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ver Todos os E-books
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/ready-papers">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Todos os Trabalhos
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando sugestões...</p>
            </div>
          )}

          {/* Empty state - quando não há produtos similares */}
          {!isLoading && (!similarData?.products || similarData.products.length === 0) && (
            <Card className="p-8 text-center">
              <CardContent>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Continue Explorando</h3>
                <p className="text-muted-foreground mb-6">
                  Descubra mais conteúdos incríveis para sua jornada de aprendizado
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild>
                    <Link to="/courses">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Explorar Cursos
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/ready-papers">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Trabalhos
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
