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
import { ArrowLeft, Filter, Loader2, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
  handlePurchase,
}: { paperDetail: ReadyPaper; handlePurchase: (paper: ReadyPaper) => void }) => (
  <div className="container mx-auto px-4 py-8">
    <Button variant="ghost" asChild className="mb-6">
      <Link to="/ready-papers">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Trabalhos Prontos
      </Link>
    </Button>

    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="space-y-6">
          <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
            <img
              src={paperDetail.thumbnailUrl || '/placeholder.svg'}
              alt={paperDetail.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{paperDetail.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="default">{paperTypeLabels[paperDetail.paperType]}</Badge>
              <Badge variant="secondary">{paperDetail.pageCount} páginas</Badge>
              <Badge variant="outline">{academicAreaLabels[paperDetail.academicArea]}</Badge>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">Descrição</h2>
            <p className="text-muted-foreground leading-relaxed">{paperDetail.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-foreground mb-2">Autor</h3>
              <p className="text-muted-foreground">{paperDetail.authorName}</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Idioma</h3>
              <p className="text-muted-foreground">{paperDetail.language}</p>
            </div>
            {paperDetail.keywords && (
              <div className="md:col-span-2">
                <h3 className="font-medium text-foreground mb-2">Palavras-chave</h3>
                <p className="text-muted-foreground">{paperDetail.keywords}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-8 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-foreground">
              {formatPrice(paperDetail.price)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handlePurchase(paperDetail)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Comprar e Baixar
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Acesso imediato após o pagamento</p>
              <p className="mt-2">
                Já possui este trabalho?
                <Button variant="link" className="p-0 ml-1 h-auto text-primary">
                  Baixar aqui
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
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
  const { addItem } = useCart();

  const handlePurchase = async (paper: ReadyPaper) => {
    if (paper.price === 0) {
      // Download grátis
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
    return <PaperDetailPage paperDetail={paperDetail} handlePurchase={handlePurchase} />;
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
