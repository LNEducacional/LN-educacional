import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { Ebook } from '@/types/ebook';
import { formatEbookAcademicArea, formatEbookPrice } from '@/utils/ebook-formatters';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Download, Eye, FileText, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function EbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  // Buscar dados do e-book
  const {
    data: ebook,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ebook', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido');
      const response = await api.get(`/ebooks/${id}`);
      return response.data as Ebook;
    },
    enabled: !!id,
  });

  // Verificar se usuário já comprou o e-book
  const { data: isPurchased = false } = useQuery({
    queryKey: ['ebook', id, 'purchased'],
    queryFn: async () => {
      if (!id || !user) return false;
      try {
        const response = await api.get(`/student/purchases/ebooks`);
        const purchases = response.data || [];
        return purchases.some((purchase: any) => purchase.ebookId === id);
      } catch {
        return false;
      }
    },
    enabled: !!id && !!user,
  });

  const handleBack = () => {
    navigate('/ebooks');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleAddToCart = () => {
    if (!ebook) return;

    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para comprar o e-book.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

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

  const handleDownload = async () => {
    if (!ebook || !isPurchased) return;

    setDownloading(true);
    try {
      const response = await api.get(`/ebooks/${ebook.id}/download`);
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
        toast({
          title: 'Download iniciado!',
          description: 'Seu e-book está sendo baixado.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível baixar o e-book. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = () => {
    toast({
      title: 'Preview em breve',
      description: 'A funcionalidade de preview será implementada em breve.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando detalhes do e-book...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">E-book não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                O e-book solicitado não foi encontrado ou não está mais disponível.
              </p>
              <Button onClick={handleBack}>Voltar para E-books</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags Avançadas */}
      <title>{ebook.title} - LN Educacional</title>
      <meta name="description" content={ebook.description} />
      <meta
        name="keywords"
        content={`${ebook.title}, ${formatEbookAcademicArea(ebook.academicArea)}, ${ebook.authorName}, ebook, apostila, educação`}
      />
      <meta name="author" content={ebook.authorName} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="book" />
      <meta property="og:title" content={ebook.title} />
      <meta property="og:description" content={ebook.description} />
      <meta property="og:image" content={ebook.coverUrl || '/og-default-ebook.jpg'} />
      <meta property="og:url" content={`https://lneducacional.com.br/ebooks/${ebook.id}`} />
      <meta property="og:site_name" content="LN Educacional" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ebook.title} />
      <meta name="twitter:description" content={ebook.description} />
      <meta name="twitter:image" content={ebook.coverUrl || '/twitter-default-ebook.jpg'} />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Book',
          name: ebook.title,
          description: ebook.description,
          author: {
            '@type': 'Person',
            name: ebook.authorName,
          },
          publisher: {
            '@type': 'Organization',
            name: 'LN Educacional',
          },
          image: ebook.coverUrl,
          numberOfPages: ebook.pageCount,
          inLanguage: 'pt-BR',
          genre: formatEbookAcademicArea(ebook.academicArea),
          offers: {
            '@type': 'Offer',
            price: (ebook.price / 100).toFixed(2),
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'LN Educacional',
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.5',
            reviewCount: '10',
          },
        })}
      </script>

      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={handleBack} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar para E-books
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna principal - Detalhes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações principais */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-foreground">{ebook.title}</h1>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatEbookAcademicArea(ebook.academicArea)}
                        </Badge>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{ebook.pageCount} páginas</span>
                        {ebook.authorName && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">por {ebook.authorName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>
                </CardContent>
              </Card>

              {/* Preview do conteúdo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview do Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Preview Disponível
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Visualize uma amostra do conteúdo antes de adquirir
                    </p>
                    <Button variant="outline" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Informações técnicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Técnicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">{ebook.pageCount}</div>
                      <div className="text-xs text-muted-foreground">Páginas</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">PDF</div>
                      <div className="text-xs text-muted-foreground">Formato</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Download className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">Vitalício</div>
                      <div className="text-xs text-muted-foreground">Acesso</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">Sim</div>
                      <div className="text-xs text-muted-foreground">Offline</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Compra */}
            <div className="space-y-6">
              {/* Capa e preço */}
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  {/* Capa */}
                  <div className="relative h-64 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden">
                    {ebook.coverUrl ? (
                      <img
                        src={ebook.coverUrl}
                        alt={ebook.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-20 w-20 text-primary/30" />
                      </div>
                    )}
                    {isPurchased && (
                      <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                        Adquirido
                      </Badge>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatEbookPrice(ebook.price)}
                    </div>
                    {ebook.price === 0 && (
                      <p className="text-sm text-muted-foreground">Download gratuito</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="space-y-3">
                    {isPurchased ? (
                      <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full"
                        size="lg"
                      >
                        {downloading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Baixando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar E-book
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        {user ? (
                          <Button onClick={handleAddToCart} className="w-full" size="lg">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {ebook.price === 0 ? 'Baixar Grátis' : 'Adicionar ao Carrinho'}
                          </Button>
                        ) : (
                          <Button onClick={handleLogin} className="w-full" size="lg">
                            Fazer Login para {ebook.price === 0 ? 'Baixar' : 'Comprar'}
                          </Button>
                        )}
                      </>
                    )}

                    <Button variant="outline" onClick={handlePreview} className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Preview
                    </Button>
                  </div>

                  {/* Garantias */}
                  {ebook.price > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span>Download imediato após compra</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>Acesso vitalício</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Formato PDF de alta qualidade</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
