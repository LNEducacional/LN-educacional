import { PaperFiltersComponent } from '@/components/papers/paper-filters';
import { ProductCard } from '@/components/papers/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/context/cart-context';
import { academicAreaLabels, paperTypeLabels } from '@/data/mock-papers';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { PaperFilters, ReadyPaper } from '@/types/paper';
import { ArrowLeft, Filter, Loader2, ShoppingCart, ShoppingBag, CheckCircle, FileText, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CheckoutModal from '@/components/checkout/checkout-modal';
import { FlyToCartAnimation } from '@/components/cart/fly-to-cart-animation';

// Helper functions
const createFiltersFromSearchParams = (searchParams: URLSearchParams): PaperFilters => ({
  academicArea: (searchParams.get('area') as PaperFilters['academicArea']) || 'all',
  paperType: (searchParams.get('type') as PaperFilters['paperType']) || 'all',
  maxPages: Number.parseInt(searchParams.get('maxPages') || '200', 10),
  maxPrice: Number.parseInt(searchParams.get('maxPrice') || '10000', 10),
});

const buildApiQueryParams = (filters: PaperFilters): string => {
  const queryParams = new URLSearchParams();
  if (filters.academicArea !== 'all') queryParams.append('area', filters.academicArea);
  if (filters.paperType !== 'all') queryParams.append('type', filters.paperType);
  queryParams.append('maxPages', filters.maxPages.toString());
  queryParams.append('maxPrice', filters.maxPrice.toString());
  queryParams.append('free', 'false');
  return queryParams.toString();
};

const createURLParamsFromFilters = (filters: PaperFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.academicArea !== 'all') params.set('area', filters.academicArea);
  if (filters.paperType !== 'all') params.set('type', filters.paperType);
  if (filters.maxPages !== 200) params.set('maxPages', filters.maxPages.toString());
  if (filters.maxPrice !== 10000) params.set('maxPrice', filters.maxPrice.toString());
  return params;
};

const formatPrice = (price: number): string => {
  return (price / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const getDefaultFilters = (): PaperFilters => ({
  academicArea: 'all',
  paperType: 'all',
  maxPages: 200,
  maxPrice: 10000,
});

// Hook for SEO management
const useSEOUpdate = (isDetailPage: boolean, paperDetail: ReadyPaper | null) => {
  useEffect(() => {
    if (isDetailPage && paperDetail) {
      document.title = `${paperDetail.title} - LN Educacional`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', paperDetail.description.substring(0, 160));
      }
    } else {
      document.title = 'Trabalhos Prontos - LN Educacional';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          'Compre trabalhos acadêmicos prontos: TCC, artigos, resenhas e mais. Download imediato após pagamento.'
        );
      }
    }
  }, [isDetailPage, paperDetail]);
};

// Hook for paper detail loading
const usePaperDetail = (isDetailPage: boolean, id: string | undefined) => {
  const { toast } = useToast();
  const [paperDetail, setPaperDetail] = useState<ReadyPaper | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (isDetailPage && id) {
      setLoadingDetail(true);
      api
        .get<ReadyPaper>(`/papers/${id}`)
        .then((response) => setPaperDetail(response.data))
        .catch((_error) => {
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os detalhes do paper.',
            variant: 'destructive',
          });
        })
        .finally(() => setLoadingDetail(false));
    }
  }, [id, isDetailPage, toast]);

  return { paperDetail, loadingDetail };
};

// Hook for purchase handling
const usePurchaseHandler = () => {
  const { toast } = useToast();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const downloadFreePaper = async (paper: ReadyPaper) => {
    try {
      const response = await api.get(`/papers/${paper.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${paper.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Download iniciado!',
        description: 'Seu arquivo está sendo baixado.',
      });
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const addPaidPaperToCart = (paper: ReadyPaper) => {
    addItem({
      id: paper.id.toString(),
      title: paper.title,
      description: `${paperTypeLabels[paper.paperType]} - ${paper.pageCount} páginas`,
      price: paper.price,
      type: 'paper',
      thumbnailUrl: paper.thumbnailUrl,
    });

    toast({
      title: 'Adicionado ao carrinho!',
      description: 'Redirecionando para o checkout...',
    });

    // Redireciona para o checkout
    setTimeout(() => {
      navigate('/checkout');
    }, 500);
  };

  const handlePurchase = async (paper: ReadyPaper) => {
    if (paper.price === 0) {
      await downloadFreePaper(paper);
    } else {
      addPaidPaperToCart(paper);
    }
  };

  return { handlePurchase };
};

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Error screen component
const ErrorScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Erro ao carregar trabalhos</h1>
      <p className="text-muted-foreground mb-4">
        Não foi possível carregar os trabalhos disponíveis.
      </p>
      <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
    </div>
  </div>
);

// Paper not found component
const PaperNotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Trabalho não encontrado</h1>
      <Button asChild>
        <Link to="/ready-papers">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Trabalhos Prontos
        </Link>
      </Button>
    </div>
  </div>
);

// Paper detail page component
const PaperDetailPage = ({
  paperDetail,
  onBuyClick,
  onAddToCart,
  flyingItem,
}: {
  paperDetail: ReadyPaper;
  onBuyClick: () => void;
  onAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  flyingItem: { x: number; y: number } | null;
}) => (
  <div className="min-h-screen bg-gradient-subtle">
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/ready-papers">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Trabalhos Prontos
        </Link>
      </Button>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Paper Header */}
          <div className="space-y-6">
            <Badge className="bg-accent text-accent-foreground">
              {academicAreaLabels[paperDetail.academicArea]}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gradient-primary leading-tight break-words">
              {paperDetail.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{paperDetail.description}</p>
          </div>

          {/* Paper Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{paperDetail.pageCount}</p>
                  <p className="text-xs text-muted-foreground">Páginas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{paperTypeLabels[paperDetail.paperType]}</p>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{paperDetail.downloadCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Author Info */}
          {paperDetail.authorName && (
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent-foreground" />
                  Autor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{paperDetail.authorName}</h3>
                  {paperDetail.keywords && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Palavras-chave:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {paperDetail.keywords}
                      </p>
                    </div>
                  )}
                  {paperDetail.language && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Idioma:</span> {paperDetail.language}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Purchase Card */}
        <div>
          <Card className="sticky top-4 border-2 border-primary/20 shadow-lg">
            <CardContent className="p-0">
              {paperDetail.thumbnailUrl && (
                <div className="relative">
                  <img
                    src={paperDetail.thumbnailUrl}
                    alt={paperDetail.title}
                    className="w-full aspect-video object-cover rounded-t-lg"
                  />
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gradient-primary">
                    {formatPrice(paperDetail.price)}
                  </span>
                </div>

                {/* CTA Button */}
                <div className="space-y-2">
                  <Button
                    onClick={onBuyClick}
                    className="w-full btn-accent text-lg py-6"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Comprar Agora
                  </Button>

                  {/* Botão Adicionar ao Carrinho - só para papers pagos */}
                  {paperDetail.price && paperDetail.price > 0 && (
                    <Button
                      onClick={onAddToCart}
                      variant="outline"
                      className="w-full text-lg py-6 border-2"
                      size="lg"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-3 pt-4 border-t">
                  <p className="font-semibold text-sm">Este trabalho inclui:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Download imediato após o pagamento</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Trabalho completo em formato PDF</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>{paperDetail.pageCount} páginas de conteúdo</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Elaborado por especialista na área</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Acesso vitalício ao arquivo</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// Papers listing page component
const PapersListingPage = ({
  filters,
  filteredPapers,
  handleFiltersChange,
  handleResetFilters,
  handlePurchase,
}: {
  filters: PaperFilters;
  filteredPapers: ReadyPaper[];
  handleFiltersChange: (filters: PaperFilters) => void;
  handleResetFilters: () => void;
  handlePurchase: (paper: ReadyPaper) => void;
}) => (
  <div className="container mx-auto px-4 py-8">
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">Trabalhos Prontos</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Encontre trabalhos acadêmicos prontos para download imediato. TCC, artigos, resenhas e muito
        mais, elaborados por especialistas.
      </p>
    </div>

    <div className="flex gap-8">
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-8">
          <PaperFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>
      </div>

      <div className="flex-1">
        <div className="lg:hidden mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <PaperFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground">{filteredPapers.length} trabalho(s) encontrado(s)</p>
        </div>

        {filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum trabalho encontrado com os filtros selecionados.
            </p>
            <Button onClick={handleResetFilters}>Resetar Filtros</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <ProductCard key={paper.id} paper={paper} onPurchase={handlePurchase} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Card className="bg-muted/50 border-border">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Não encontrou o que precisa?
              </h3>
              <p className="text-muted-foreground mb-4">
                Solicite um trabalho personalizado feito especialmente para você.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Solicitar Trabalho Personalizado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default function ReadyPapers() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDetailPage = !!id;

  const [filters, setFilters] = useState<PaperFilters>(() =>
    createFiltersFromSearchParams(searchParams)
  );

  // Estado para controlar o modal de checkout e animação
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number } | null>(null);

  const {
    data: papersResponse,
    loading,
    error,
  } = useApi<{ papers: ReadyPaper[]; total: number }>(`/papers?${buildApiQueryParams(filters)}`, {
    dependencies: [filters],
  });

  const { paperDetail, loadingDetail } = usePaperDetail(isDetailPage, id);

  // Criar handlePurchase aqui com acesso ao navigate
  const { toast } = useToast();
  const { addItem, setCartOpen } = useCart();

  // Handler para abrir modal de checkout (página de detalhes)
  const handleBuyClick = () => {
    if (!paperDetail) return;

    if (paperDetail.price === 0) {
      // Download grátis
      handleFreePaperDownload(paperDetail);
    } else {
      // Abrir modal de checkout
      setCheckoutModalOpen(true);
    }
  };

  // Handler para adicionar ao carrinho (página de detalhes)
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!paperDetail) return;

    e.preventDefault();
    e.stopPropagation();

    if (paperDetail.price === 0) {
      toast({
        title: 'Trabalho gratuito',
        description: 'Este trabalho é gratuito. Clique em "Comprar Agora" para fazer o download.',
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
        id: paperDetail.id.toString(),
        title: paperDetail.title,
        description: `${paperTypeLabels[paperDetail.paperType]} - ${paperDetail.pageCount} páginas`,
        price: paperDetail.price,
        type: 'paper',
        thumbnailUrl: paperDetail.thumbnailUrl || undefined,
      });

      // Abrir drawer do carrinho após animação
      setTimeout(() => {
        setCartOpen(true);
      }, 800);

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${paperDetail.title} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o trabalho ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  // Download de paper gratuito
  const handleFreePaperDownload = async (paper: ReadyPaper) => {
    try {
      const response = await api.get(`/papers/${paper.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${paper.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Download iniciado!',
        description: 'Seu arquivo está sendo baixado.',
      });
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  // Handler para compra na listagem (mantém comportamento antigo para ProductCard)
  const handlePurchase = async (paper: ReadyPaper) => {
    if (paper.price === 0) {
      // Download grátis
      await handleFreePaperDownload(paper);
    } else {
      // Adicionar ao carrinho e redirecionar
      addItem({
        id: paper.id.toString(),
        title: paper.title,
        description: `${paperTypeLabels[paper.paperType]} - ${paper.pageCount} páginas`,
        price: paper.price,
        type: 'paper',
        thumbnailUrl: paper.thumbnailUrl,
      });

      toast({
        title: 'Adicionado ao carrinho!',
        description: 'Redirecionando para o checkout...',
      });

      // Redirecionar para checkout
      setTimeout(() => {
        navigate('/checkout');
      }, 500);
    }
  };

  useSEOUpdate(isDetailPage, paperDetail);

  const filteredPapers = papersResponse?.papers || [];

  const handleFiltersChange = (newFilters: PaperFilters) => {
    setFilters(newFilters);
    setSearchParams(createURLParamsFromFilters(newFilters));
  };

  const handleResetFilters = () => {
    const defaultFilters = getDefaultFilters();
    setFilters(defaultFilters);
    setSearchParams({});
  };

  if (loading || loadingDetail) {
    return <LoadingScreen />;
  }

  if (error && !isDetailPage) {
    return <ErrorScreen />;
  }

  if (isDetailPage) {
    if (!paperDetail) {
      return <PaperNotFound />;
    }
    return (
      <>
        <PaperDetailPage
          paperDetail={paperDetail}
          onBuyClick={handleBuyClick}
          onAddToCart={handleAddToCart}
          flyingItem={flyingItem}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          open={checkoutModalOpen}
          onOpenChange={setCheckoutModalOpen}
          paperId={paperDetail.id.toString()}
          courseTitle={paperDetail.title}
          coursePrice={paperDetail.price}
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

  return (
    <PapersListingPage
      filters={filters}
      filteredPapers={filteredPapers}
      handleFiltersChange={handleFiltersChange}
      handleResetFilters={handleResetFilters}
      handlePurchase={handlePurchase}
    />
  );
}
