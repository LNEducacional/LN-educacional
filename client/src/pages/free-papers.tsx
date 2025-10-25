import { PaperFiltersComponent } from '@/components/papers/paper-filters';
import { ProductCard } from '@/components/papers/product-card';
import { CardSkeleton } from '@/components/skeletons/card-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { PaperFilters, ReadyPaper } from '@/types/paper';
import { Filter } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginRequiredModal } from '@/components/auth/login-required-modal';

export default function FreePapers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<PaperFilters>({
    academicArea: (searchParams.get('area') as PaperFilters['academicArea']) || 'all',
    paperType: (searchParams.get('type') as PaperFilters['paperType']) || 'all',
    maxPages: Number.parseInt(searchParams.get('maxPages') || '200', 10),
    maxPrice: 0, // Sempre 0 para trabalhos gratuitos
  });

  // Estado para paginação infinita
  const [allPapers, setAllPapers] = useState<ReadyPaper[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Estado para modal de login
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 12;

  // Buscar papers gratuitos da API
  const buildQueryParams = useCallback(
    (page = 0) => {
      const queryParams = new URLSearchParams();
      if (filters.academicArea !== 'all') queryParams.append('area', filters.academicArea);
      if (filters.paperType !== 'all') queryParams.append('type', filters.paperType);
      queryParams.append('maxPages', filters.maxPages.toString());
      queryParams.append('free', 'true');
      queryParams.append('skip', (page * ITEMS_PER_PAGE).toString());
      queryParams.append('take', ITEMS_PER_PAGE.toString());
      return queryParams.toString();
    },
    [filters]
  );

  const apiUrl = `/papers?${buildQueryParams(0)}`;

  console.log('🔍 API URL:', apiUrl);

  const {
    data: initialData,
    loading: initialLoading,
    error,
    refetch,
  } = useApi<{ papers: ReadyPaper[]; total: number }>(apiUrl, {
    dependencies: [filters],
  });

  console.log('📊 useApi State:', { initialData, initialLoading, error });

  // Resetar dados quando filtros mudarem
  useEffect(() => {
    console.log('🔄 useEffect triggered. InitialData:', initialData);
    if (initialData) {
      console.log('✅ Setting papers:', initialData.papers.length);
      setAllPapers(initialData.papers);
      setCurrentPage(0);
      setHasMore(initialData.papers.length === ITEMS_PER_PAGE);
    }
  }, [initialData]);

  // Função para carregar mais papers
  const loadMorePapers = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/papers?${buildQueryParams(nextPage)}`
      );

      if (!response.ok) throw new Error('Failed to load more papers');

      const data = await response.json();

      if (data.papers && data.papers.length > 0) {
        setAllPapers((prev) => [...prev, ...data.papers]);
        setCurrentPage(nextPage);
        setHasMore(data.papers.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more papers:', error);
      toast({
        title: 'Erro ao carregar mais trabalhos',
        description: 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, buildQueryParams, toast]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          loadMorePapers();
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMorePapers]);

  const filteredPapers = allPapers;

  const updateURLParams = (newFilters: PaperFilters) => {
    const params = new URLSearchParams();
    if (newFilters.academicArea !== 'all') {
      params.set('area', newFilters.academicArea);
    }
    if (newFilters.paperType !== 'all') {
      params.set('type', newFilters.paperType);
    }
    if (newFilters.maxPages !== 200) {
      params.set('maxPages', newFilters.maxPages.toString());
    }
    setSearchParams(params);
  };

  const handleFiltersChange = (newFilters: PaperFilters) => {
    // Manter o preço sempre em 0 para trabalhos gratuitos
    const updatedFilters = { ...newFilters, maxPrice: 0 };
    setFilters(updatedFilters);
    updateURLParams(updatedFilters);

    // Reset pagination when filters change
    setAllPapers([]);
    setCurrentPage(0);
    setHasMore(true);
  };

  const handleResetFilters = () => {
    const defaultFilters: PaperFilters = {
      academicArea: 'all',
      paperType: 'all',
      maxPages: 200,
      maxPrice: 0,
    };
    setFilters(defaultFilters);
    setSearchParams({});
  };

  const handleDownload = async (paper: ReadyPaper) => {
    // Verificar se usuário está logado
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/papers/${paper.id}/download`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao baixar arquivo');
      }

      const data = await response.json();

      // Abrir URL de download em nova aba
      window.open(data.downloadUrl, '_blank');

      toast({
        title: 'Download iniciado!',
        description: `${data.paper.title} foi adicionado à sua biblioteca.`,
      });

      // Opcional: Atualizar contador de downloads local
      setAllPapers((prev) =>
        prev.map((p) =>
          p.id === paper.id ? { ...p, downloadCount: (p.downloadCount || 0) + 1 } : p
        )
      );
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: error instanceof Error ? error.message : 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  // SEO Meta Tags
  useEffect(() => {
    document.title = 'Trabalhos Gratuitos - LN Educacional';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Acesse nossa biblioteca de trabalhos acadêmicos gratuitos. TCC, artigos e projetos disponíveis para download.'
      );
    }
  }, []);

  console.log('🎨 Rendering with:', {
    allPapersLength: allPapers.length,
    filteredPapersLength: filteredPapers.length,
    initialLoading,
    error
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Trabalhos Gratuitos</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore nossa biblioteca de trabalhos acadêmicos gratuitos. Conteúdo de qualidade
          disponível para estudantes e pesquisadores.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Filtros Desktop */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-8">
            <PaperFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          {/* Filtros Mobile */}
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

          {/* Resultados */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              {initialLoading
                ? 'Carregando...'
                : `${filteredPapers.length} trabalho(s) gratuito(s) encontrado(s)${!hasMore ? ' (todos carregados)' : ''}`}
            </p>
          </div>

          {initialLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <CardSkeleton key={`paper-skeleton-${i + Date.now()}`} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">
                Erro ao carregar trabalhos. Por favor, tente novamente.
              </p>
              <Button onClick={() => refetch()}>Tentar Novamente</Button>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum trabalho encontrado com os filtros selecionados.
              </p>
              <Button onClick={handleResetFilters}>Resetar Filtros</Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPapers.map((paper) => (
                  <ProductCard
                    key={paper.id}
                    paper={paper}
                    isFree={true}
                    onPurchase={handleDownload}
                  />
                ))}
              </div>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="mt-8">
                {isLoadingMore && (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }, (_, i) => (
                      <CardSkeleton key={`loading-skeleton-${i}`} />
                    ))}
                  </div>
                )}
                {!hasMore && filteredPapers.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Todos os trabalhos foram carregados</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Informativo */}
          <div className="mt-12 text-center">
            <Card className="bg-muted/50 border-border">
              <CardContent className="py-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">💡 Dica</h3>
                <p className="text-muted-foreground mb-4">
                  Todos os trabalhos desta seção são completamente gratuitos. Faça login para
                  acessar o download imediato.
                </p>
                <Button variant="outline" onClick={() => navigate('/register')}>
                  Criar Conta Gratuita
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Login Obrigatório */}
      <LoginRequiredModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
