import { CardSkeleton } from '@/components/skeletons/card-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EbookCard } from '@/components/ebooks/ebook-card';
import { useAuth } from '@/context/auth-context';
import { queryKeys } from '@/lib/query-client';
import api from '@/services/api';
import type { Ebook } from '@/types/ebook';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

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
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [_sortBy, _setSortBy] = useState<string>('newest');
  const { user } = useAuth();

  // Buscar ebooks da API
  const filters = {
    ...(selectedArea !== 'all' && { area: selectedArea }),
    sort: 'newest',
  };

  const {
    data: ebooksData,
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
    gcTime: 0,
    staleTime: 0,
  });

  // Obter ebooks com status de compra
  const purchasedEbookIds = useMemo(() => {
    if (!user || !purchases) return new Set<string>();
    const purchasesArray = Array.isArray(purchases) ? purchases : [];
    return new Set(purchasesArray.map((p) => p.ebookId));
  }, [user, purchases]);

  // Filtrar ebooks
  const filteredEbooks = ebooksData?.ebooks || [];

  return (
    <>
      {/* SEO Meta Tags */}
      <title>E-books & Apostilas - LN Educacional</title>
      <meta
        name="description"
        content="Explore nossa coleção de e-books e apostilas educacionais com download imediato."
      />

      <div className="min-h-[calc(100vh-200px)] bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">E-books & Apostilas</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Materiais didáticos completos para download imediato, organizados por área de conhecimento.
            </p>
          </div>

          {/* Filtros */}
          <div className="mb-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-auto">
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-full sm:w-[280px]">
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
              <div className="text-sm text-muted-foreground">
                {filteredEbooks.length}{' '}
                {filteredEbooks.length === 1 ? 'e-book encontrado' : 'e-books encontrados'}
              </div>
            </div>
          </div>

          {/* Lista de E-books */}
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
          ) : filteredEbooks.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Nenhum e-book encontrado.</p>
                <Button onClick={() => setSelectedArea('all')}>Ver todos os e-books</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEbooks.map((ebook, index) => (
                <div
                  key={ebook.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <EbookCard
                    ebook={ebook}
                    variant="default"
                    isPurchased={purchasedEbookIds.has(ebook.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Estado vazio */}
          {filteredEbooks.length === 0 && !ebooksLoading && !ebooksError && (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum e-book encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Não há e-books disponíveis para a área selecionada.
              </p>
              <Button onClick={() => setSelectedArea('all')} variant="outline">
                Ver todos os e-books
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EbooksGuides;
