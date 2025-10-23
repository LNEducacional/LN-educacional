import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { Ebook } from '@/types/ebook';
import { formatEbookAcademicArea, formatEbookPrice } from '@/utils/ebook-formatters';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle,
  Download,
  FileText,
  ShoppingBag,
  ShoppingCart,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckoutModal from '@/components/checkout/checkout-modal';
import { FlyToCartAnimation } from '@/components/cart/fly-to-cart-animation';

export default function EbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number } | null>(null);

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

  const handlePurchase = () => {
    if (!ebook) return;

    if (ebook.price && ebook.price > 0) {
      setCheckoutModalOpen(true);
    } else {
      // E-book gratuito
      if (!user) {
        toast({
          title: 'Login necessário',
          description: 'Faça login para baixar o e-book gratuito',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      handleDownload();
    }
  };

  const handleDownload = async () => {
    if (!ebook) return;

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

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ebook) return;

    if (!ebook.price || ebook.price === 0) {
      toast({
        title: 'E-book gratuito',
        description: 'Este e-book é gratuito. Clique em "Baixar Grátis".',
      });
      return;
    }

    try {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      setFlyingItem({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      addItem({
        id: ebook.id,
        title: ebook.title,
        description: ebook.description,
        price: ebook.price,
        type: 'ebook',
        thumbnailUrl: ebook.coverUrl || '',
      });

      setTimeout(() => {
        setCartOpen(true);
      }, 800);

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${ebook.title} foi adicionado ao seu carrinho.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o e-book ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando e-book...</p>
        </div>
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">E-book não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O e-book solicitado não foi encontrado ou não está mais disponível.
          </p>
          <Button onClick={() => navigate('/ebooks')}>Voltar para E-books</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Ebook Header */}
            <div className="space-y-6">
              <Badge className="bg-accent text-accent-foreground">
                {formatEbookAcademicArea(ebook.academicArea)}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gradient-primary leading-tight break-words">
                {ebook.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{ebook.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ebook.pageCount}</p>
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
                    <p className="text-2xl font-bold">PDF</p>
                    <p className="text-xs text-muted-foreground">Formato</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Vitalício</p>
                    <p className="text-xs text-muted-foreground">Acesso</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Author Info */}
            {ebook.authorName && (
              <Card className="border-l-4 border-l-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-accent-foreground" />
                    Autor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold">{ebook.authorName}</h3>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Purchase Card */}
          <div>
            <Card className="sticky top-4 border-2 border-primary/20 shadow-lg">
              <CardContent className="p-0">
                {ebook.coverUrl && (
                  <div className="relative">
                    <img
                      src={ebook.coverUrl}
                      alt={ebook.title}
                      className="w-full aspect-[4/3] object-cover rounded-t-lg"
                    />
                    {isPurchased && (
                      <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                        ADQUIRIDO
                      </Badge>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gradient-primary">
                      {formatEbookPrice(ebook.price)}
                    </span>
                  </div>

                  {/* CTA Button */}
                  {isPurchased ? (
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full btn-hero"
                      size="lg"
                    >
                      {downloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          Baixar E-book
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={handlePurchase}
                        className="w-full btn-accent text-lg py-6"
                        size="lg"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {ebook.price && ebook.price > 0 ? 'Comprar Agora' : 'Baixar Grátis'}
                      </Button>

                      {ebook.price && ebook.price > 0 && (
                        <Button
                          onClick={handleAddToCart}
                          variant="outline"
                          className="w-full text-lg py-6 border-2"
                          size="lg"
                        >
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Benefits */}
                  <div className="space-y-3 pt-4 border-t">
                    <p className="font-semibold text-sm">Este e-book inclui:</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>Download imediato após compra</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>Acesso vitalício ao arquivo</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>Formato PDF de alta qualidade</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>Leitura offline em qualquer dispositivo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ebook Content */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="about" className="gap-2">
              <FileText className="h-4 w-4" />
              Sobre o E-book
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card className="border-primary/20">
              <CardHeader className="border-b bg-gradient-subtle">
                <CardTitle className="text-2xl">Sobre este E-book</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Descrição
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>
                </div>

                {ebook.authorName && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-accent-foreground" />
                      Sobre o Autor
                    </h3>
                    <p className="font-medium text-lg">{ebook.authorName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Checkout Modal */}
      {ebook && (
        <CheckoutModal
          open={checkoutModalOpen}
          onOpenChange={setCheckoutModalOpen}
          ebookId={ebook.id}
          courseTitle={ebook.title}
          coursePrice={ebook.price}
        />
      )}

      {/* Animação de item voando para o carrinho */}
      {flyingItem && (
        <FlyToCartAnimation startPosition={flyingItem} onComplete={() => setFlyingItem(null)} />
      )}
    </div>
  );
}
