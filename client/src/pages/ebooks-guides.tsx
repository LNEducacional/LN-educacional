import { CardSkeleton } from '@/components/skeletons/card-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-client';
import api from '@/services/api';
import type { Ebook } from '@/types/ebook';
import { formatEbookAcademicArea, formatEbookPrice } from '@/utils/ebook-formatters';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Search } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Purchase {
  id: string;
  ebookId: string;
  userId: string;
  purchasedAt: string;
  ebook?: Ebook;
}

const areaLabels: Record<string, string> = {
  all: 'Todas as áreas',
  ADMINISTRATION: 'Administração',
  LAW: 'Direito',
  EDUCATION: 'Educação',
  ENGINEERING: 'Engenharia',
  PSYCHOLOGY: 'Psicologia',
  HEALTH: 'Saúde',
  ACCOUNTING: 'Contabilidade',
  ARTS: 'Artes',
  ECONOMICS: 'Economia',
  SOCIAL_SCIENCES: 'Ciências Sociais',
  EXACT_SCIENCES: 'Ciências Exatas',
  BIOLOGICAL_SCIENCES: 'Ciências Biológicas',
  HEALTH_SCIENCES: 'Ciências da Saúde',
  APPLIED_SOCIAL_SCIENCES: 'Ciências Sociais Aplicadas',
  HUMANITIES: 'Ciências Humanas',
  LANGUAGES: 'Linguística, Letras e Artes',
  AGRICULTURAL_SCIENCES: 'Ciências Agrárias',
  MULTIDISCIPLINARY: 'Multidisciplinar',
  OTHER: 'Outros',
};

const EbooksGuides: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  // Estados para busca avançada
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [pageRange, setPageRange] = useState<string>('all');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  // Buscar ebooks da API
  const filters = {
    ...(selectedArea !== 'all' && { area: selectedArea }),
    ...(activeTab === 'free' && { free: true }),
    ...(activeTab === 'paid' && { paid: true }),
    sort: sortBy,
  };

  const {
    data: ebooksResponse,
    isLoading: ebooksLoading,
    error: ebooksError,
  } = useQuery({
    queryKey: queryKeys.products.ebooks(filters),
    queryFn: async () => {
      const response = await api.get('/ebooks', { params: filters });
      return response.data as { ebooks: Ebook[]; total: number };
    },
  });

  // Buscar compras do usuário
  const { data: purchases } = useQuery({
    queryKey: ['student', 'purchases', 'ebooks'],
    queryFn: async () => {
      if (!user) return [];
      const response = await api.get('/student/purchases/ebooks');
      return response.data as Purchase[];
    },
    enabled: !!user,
  });

  // Processar ebooks com status de compra
  const processedEbooks = useMemo(() => {
    const ebooks = ebooksResponse?.ebooks || [];
    const purchasesArray = Array.isArray(purchases) ? purchases : [];
    const purchasedIds = purchasesArray.map((p) => p.ebookId);
    return ebooks.map((ebook) => ({
      ...ebook,
      isPurchased: purchasedIds.includes(ebook.id),
      isFree: ebook.price === 0,
    }));
  }, [ebooksResponse, purchases]);

  // Filtrar e-books com busca avançada
  const filteredEbooks = useMemo(() => {
    let filtered = [...processedEbooks];

    // Filtro por busca de texto (título, descrição, autor)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (ebook) =>
          ebook.title.toLowerCase().includes(query) ||
          ebook.description.toLowerCase().includes(query) ||
          ebook.authorName.toLowerCase().includes(query)
      );
    }

    // Filtro por faixa de preço
    if (priceRange !== 'all') {
      filtered = filtered.filter((ebook) => {
        const price = ebook.price / 100; // Converter de centavos para reais
        switch (priceRange) {
          case 'free':
            return price === 0;
          case 'under-20':
            return price > 0 && price < 20;
          case '20-50':
            return price >= 20 && price <= 50;
          case '50-100':
            return price > 50 && price <= 100;
          case 'over-100':
            return price > 100;
          default:
            return true;
        }
      });
    }

    // Filtro por quantidade de páginas
    if (pageRange !== 'all') {
      filtered = filtered.filter((ebook) => {
        switch (pageRange) {
          case 'short':
            return ebook.pageCount <= 50;
          case 'medium':
            return ebook.pageCount > 50 && ebook.pageCount <= 150;
          case 'long':
            return ebook.pageCount > 150 && ebook.pageCount <= 300;
          case 'very-long':
            return ebook.pageCount > 300;
          default:
            return true;
        }
      });
    }

    // Ordenação
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'pages-low':
        filtered.sort((a, b) => a.pageCount - b.pageCount);
        break;
      case 'pages-high':
        filtered.sort((a, b) => b.pageCount - a.pageCount);
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        break;
      default:
        break;
    }

    return filtered;
  }, [processedEbooks, searchQuery, priceRange, pageRange, sortBy]);

  const clearFilters = () => {
    setActiveTab('all');
    setSelectedArea('all');
    setSearchQuery('');
    setPriceRange('all');
    setPageRange('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    activeTab !== 'all' ||
    selectedArea !== 'all' ||
    searchQuery.trim() !== '' ||
    priceRange !== 'all' ||
    pageRange !== 'all' ||
    sortBy !== 'newest';

  // Componente EbookCard extraído para reduzir complexidade cognitiva
  const EbookCard = ({ ebook, index }: { ebook: Ebook; index: number }) => (
    <div className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
      <Card className="hover:shadow-lg transition-all duration-300 relative">
        {isNewEbook(ebook.publishedAt) && (
          <Badge className="absolute top-2 right-2 z-10 bg-green-500 text-white">Novo</Badge>
        )}
        <CardContent className="p-0">
          {/* Thumbnail */}
          <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg overflow-hidden">
            {ebook.coverUrl ? (
              <img
                src={ebook.coverUrl}
                alt={ebook.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FileText className="h-20 w-20 text-primary/30" />
              </div>
            )}
            {ebook.isPurchased && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-white">Adquirido</Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{ebook.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{ebook.description}</p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{ebook.pageCount} páginas</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {formatEbookAcademicArea(ebook.academicArea)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-primary">{formatEbookPrice(ebook.price)}</div>
              <Button
                onClick={(e) => handlePurchase(ebook, e)}
                className="btn-hero"
                disabled={purchasing === ebook.id}
              >
                {ebook.isPurchased ? 'Baixar' : ebook.isFree ? 'Baixar Grátis' : 'Comprar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const handlePurchase = (ebook: Ebook, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para comprar o e-book.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (ebook.isPurchased) {
      // Download direto se já comprado
      handleDownload(ebook.id);
      return;
    }

    // Adicionar ao carrinho
    addItem({
      id: ebook.id,
      title: ebook.title,
      description: ebook.description,
      price: ebook.price,
      type: 'ebook',
      thumbnailUrl: ebook.coverUrl,
    });

    toast({
      title: 'E-book adicionado!',
      description: 'O e-book foi adicionado ao seu carrinho.',
    });
  };

  const handleDownload = async (ebookId: string) => {
    try {
      setPurchasing(ebookId);
      const response = await api.get(`/ebooks/${ebookId}/download`);
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
        toast({
          title: 'Download iniciado!',
          description: 'Seu e-book está sendo baixado.',
        });
      }
    } catch (_error) {
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível baixar o e-book. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const isNewEbook = (publishedAt?: string) => {
    if (!publishedAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(publishedAt) > thirtyDaysAgo;
  };

  return (
    <>
      {/* SEO Meta Tags Avançadas */}
      <title>E-books & Apostilas Educacionais - Download Imediato | LN Educacional</title>
      <meta
        name="description"
        content="Explore nossa coleção de e-books e apostilas educacionais de qualidade. Conteúdo em diversas áreas acadêmicas com download imediato. Grátis e pagos disponíveis."
      />
      <meta
        name="keywords"
        content="ebooks, apostilas, educação, download, material didático, estudo, acadêmico, grátis, administração, direito, psicologia, engenharia"
      />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="E-books & Apostilas Educacionais - LN Educacional" />
      <meta
        property="og:description"
        content="Explore nossa coleção de e-books e apostilas educacionais de qualidade. Conteúdo em diversas áreas acadêmicas com download imediato."
      />
      <meta property="og:image" content="/og-ebooks-collection.jpg" />
      <meta property="og:url" content="https://lneducacional.com.br/ebooks" />
      <meta property="og:site_name" content="LN Educacional" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="E-books & Apostilas Educacionais - LN Educacional" />
      <meta
        name="twitter:description"
        content="Explore nossa coleção de e-books e apostilas educacionais de qualidade. Conteúdo em diversas áreas acadêmicas com download imediato."
      />
      <meta name="twitter:image" content="/twitter-ebooks-collection.jpg" />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'E-books & Apostilas Educacionais',
          description: 'Coleção de e-books e apostilas educacionais para download',
          publisher: {
            '@type': 'Organization',
            name: 'LN Educacional',
            url: 'https://lneducacional.com.br',
          },
          mainEntity: {
            '@type': 'ItemList',
            name: 'E-books Educacionais',
            numberOfItems: filteredEbooks.length,
            itemListElement: filteredEbooks.slice(0, 10).map((ebook, index) => ({
              '@type': 'Book',
              position: index + 1,
              name: ebook.title,
              author: ebook.authorName,
              genre: formatEbookAcademicArea(ebook.academicArea),
              url: `https://lneducacional.com.br/ebooks/${ebook.id}`,
            })),
          },
        })}
      </script>

      <div className="min-h-[calc(100vh-200px)] bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">E-books & Apostilas</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Materiais didáticos completos para download, organizados por área de conhecimento.
            </p>
          </div>

          {/* Seção Promocional */}
          <Card className="mb-12 animate-slide-up bg-gradient-elegant">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-6xl">📚</div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Acesso Vitalício
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Todos os e-books e apostilas adquiridos ficam disponíveis permanentemente na sua
                    área do cliente, permitindo download sempre que precisar.
                  </p>
                  <Button onClick={() => navigate('/biblioteca')} className="btn-hero">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Acessar Minha Biblioteca
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Busca e Filtros Avançados */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Campo de Busca */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar por título, autor ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                {/* Tabs */}
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="free">Gratuitos</TabsTrigger>
                  <TabsTrigger value="paid">Pagos</TabsTrigger>
                </TabsList>

                {/* Filtro por área */}
                <div className="w-full lg:w-auto">
                  <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger className="w-full lg:w-[280px]">
                      <SelectValue placeholder="Filtrar por área acadêmica" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(areaLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros Avançados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Filtro por Preço */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Preço</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer preço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer preço</SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="under-20">Até R$ 20</SelectItem>
                      <SelectItem value="20-50">R$ 20 - R$ 50</SelectItem>
                      <SelectItem value="50-100">R$ 50 - R$ 100</SelectItem>
                      <SelectItem value="over-100">Acima de R$ 100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Páginas */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Páginas</label>
                  <Select value={pageRange} onValueChange={setPageRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer tamanho</SelectItem>
                      <SelectItem value="short">Até 50 páginas</SelectItem>
                      <SelectItem value="medium">51 - 150 páginas</SelectItem>
                      <SelectItem value="long">151 - 300 páginas</SelectItem>
                      <SelectItem value="very-long">Mais de 300 páginas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ordenação */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ordenar por
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mais recentes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                      <SelectItem value="oldest">Mais antigos</SelectItem>
                      <SelectItem value="title">Nome (A-Z)</SelectItem>
                      <SelectItem value="price-low">Menor preço</SelectItem>
                      <SelectItem value="price-high">Maior preço</SelectItem>
                      <SelectItem value="pages-low">Menos páginas</SelectItem>
                      <SelectItem value="pages-high">Mais páginas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão Limpar Filtros */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mb-6">
                <div className="text-sm text-muted-foreground">
                  {filteredEbooks.length}{' '}
                  {filteredEbooks.length === 1 ? 'e-book encontrado' : 'e-books encontrados'}
                </div>
              </div>

              {/* Conteúdo das Tabs */}
              <TabsContent value={activeTab} className="mt-0">
                {ebooksLoading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }, (_, i) => (
                      <CardSkeleton key={`ebook-skeleton-${i + Date.now()}`} />
                    ))}
                  </div>
                ) : ebooksError ? (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <p className="text-destructive mb-4">
                        Erro ao carregar e-books. Por favor, tente novamente.
                      </p>
                      <Button onClick={() => window.location.reload()}>Recarregar</Button>
                    </CardContent>
                  </Card>
                ) : filteredEbooks.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEbooks.map((ebook, index) => (
                      <EbookCard key={ebook.id} ebook={ebook} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Nenhum e-book encontrado
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Nenhum e-book encontrado para esta seleção.
                    </p>
                    {hasActiveFilters && (
                      <Button onClick={clearFilters} variant="outline">
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default EbooksGuides;
