import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';
import type { Ebook } from '@/types/ebook';
import { formatEbookAcademicArea, formatEbookPrice } from '@/utils/ebook-formatters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, BookOpen, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Eye, Filter, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface AdminEbooksProps {
  onAddEbook: () => void;
  onEditEbook: (id: string) => void;
  onViewEbook: (id: string) => void;
}

const isInPageRange = (pageCount: number, range: string): boolean => {
  if (range === 'all') return true;

  const ranges = {
    '1-50': { min: 1, max: 50 },
    '51-100': { min: 51, max: 100 },
    '101-200': { min: 101, max: 200 },
    '201+': { min: 201, max: Number.POSITIVE_INFINITY },
  } as const;

  const rangeConfig = ranges[range as keyof typeof ranges];
  if (!rangeConfig) return true;

  return pageCount >= rangeConfig.min && pageCount <= rangeConfig.max;
};

type SortField = 'title' | 'academicArea' | 'pageCount' | 'price' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function AdminEbooks({ onAddEbook, onEditEbook, onViewEbook }: AdminEbooksProps) {
  const queryClient = useQueryClient();
  const [_loading, _setLoading] = useState(false);
  const [filters, setFilters] = useState({
    title: '',
    area: 'all',
    pages: 'all',
  });
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar ebooks da API
  const { data: ebooks = [], isLoading } = useQuery({
    queryKey: ['admin', 'ebooks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.title) params.append('search', filters.title);
      if (filters.area !== 'all') params.append('area', filters.area);

      const response = await api.get(`/admin/ebooks?${params.toString()}`);
      return response.data as Ebook[];
    },
  });

  // Handler para alternar ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, inverte a ordem
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é um novo campo, ordena ascendente por padrão
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtragem e ordenação
  const filteredAndSortedEbooks = useMemo(() => {
    if (!ebooks) return [];

    // Primeiro filtra
    let filtered = ebooks.filter((ebook) => {
      return isInPageRange(ebook.pageCount, filters.pages);
    });

    // Depois ordena
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'academicArea':
          aValue = formatEbookAcademicArea(a.academicArea).toLowerCase();
          bValue = formatEbookAcademicArea(b.academicArea).toLowerCase();
          break;
        case 'pageCount':
          aValue = a.pageCount;
          bValue = b.pageCount;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ebooks, filters.pages, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedEbooks.length / itemsPerPage);
  const paginatedEbooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedEbooks.slice(startIndex, endIndex);
  }, [filteredAndSortedEbooks, currentPage, itemsPerPage]);

  // Reset para página 1 quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [filters.title, filters.area, filters.pages]);

  // Mutation para deletar ebook
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/ebooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ebooks'] });
    },
  });

  const handleDeleteEbook = async (id: string, title: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('E-book excluído com sucesso', {
        description: `"${title}" foi removido.`,
      });
    } catch (_error) {
      toast.error('Erro ao excluir', {
        description: 'Não foi possível excluir o e-book. Tente novamente.',
      });
    }
  };

  // Mutation para toggle status ativo
  const _toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/ebooks/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ebooks'] });
      toast.success('Status atualizado', {
        description: 'O status do e-book foi atualizado com sucesso.',
      });
    },
  });

  const hasFilters = Object.values(filters).some((value) => value !== '' && value !== 'all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">E-books</h1>
          <p className="text-muted-foreground">
            Gerencie todos os e-books disponíveis na plataforma
          </p>
        </div>
        <Button onClick={onAddEbook} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar E-book
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="title-search"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Título
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="title-search"
                  placeholder="Buscar por título..."
                  value={filters.title}
                  onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="area-select"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Área Acadêmica
              </label>
              <Select
                value={filters.area}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, area: value }))}
              >
                <SelectTrigger id="area-select">
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="ADMINISTRATION">Administração</SelectItem>
                  <SelectItem value="LAW">Direito</SelectItem>
                  <SelectItem value="EDUCATION">Educação</SelectItem>
                  <SelectItem value="ENGINEERING">Engenharia</SelectItem>
                  <SelectItem value="PSYCHOLOGY">Psicologia</SelectItem>
                  <SelectItem value="HEALTH">Saúde</SelectItem>
                  <SelectItem value="ACCOUNTING">Contabilidade</SelectItem>
                  <SelectItem value="ARTS">Artes</SelectItem>
                  <SelectItem value="ECONOMICS">Economia</SelectItem>
                  <SelectItem value="SOCIAL_SCIENCES">Ciências Sociais</SelectItem>
                  <SelectItem value="EXACT_SCIENCES">Ciências Exatas</SelectItem>
                  <SelectItem value="BIOLOGICAL_SCIENCES">Ciências Biológicas</SelectItem>
                  <SelectItem value="HEALTH_SCIENCES">Ciências da Saúde</SelectItem>
                  <SelectItem value="APPLIED_SOCIAL_SCIENCES">
                    Ciências Sociais Aplicadas
                  </SelectItem>
                  <SelectItem value="HUMANITIES">Ciências Humanas</SelectItem>
                  <SelectItem value="LANGUAGES">Linguística, Letras e Artes</SelectItem>
                  <SelectItem value="AGRICULTURAL_SCIENCES">Ciências Agrárias</SelectItem>
                  <SelectItem value="MULTIDISCIPLINARY">Multidisciplinar</SelectItem>
                  <SelectItem value="OTHER">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="pages-select"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Páginas
              </label>
              <Select
                value={filters.pages}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, pages: value }))}
              >
                <SelectTrigger id="pages-select">
                  <SelectValue placeholder="Todas as páginas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as páginas</SelectItem>
                  <SelectItem value="1-50">1-50 páginas</SelectItem>
                  <SelectItem value="51-100">51-100 páginas</SelectItem>
                  <SelectItem value="101-200">101-200 páginas</SelectItem>
                  <SelectItem value="201+">201+ páginas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredAndSortedEbooks.length} e-book{filteredAndSortedEbooks.length !== 1 ? 's' : ''} encontrado
            {filteredAndSortedEbooks.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAndSortedEbooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {hasFilters ? 'Nenhum e-book encontrado' : 'Nenhum e-book cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? 'Nenhum e-book encontrado com os filtros aplicados.'
                  : 'Nenhum e-book cadastrado. Adicione o primeiro e-book.'}
              </p>
              {!hasFilters && (
                <Button onClick={onAddEbook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro E-book
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('title')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Título
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('academicArea')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Área Acadêmica
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('pageCount')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Páginas
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('price')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Preço
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('createdAt')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Data de Criação
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEbooks.map((ebook) => (
                    <TableRow key={ebook.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{ebook.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {ebook.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatEbookAcademicArea(ebook.academicArea)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{ebook.pageCount}</TableCell>
                      <TableCell>
                        {ebook.price === 0 ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            Gratuito
                          </Badge>
                        ) : (
                          <span className="font-medium text-foreground">
                            {formatEbookPrice(ebook.price)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ebook.price === 0 ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            Gratuito
                          </Badge>
                        ) : (
                          <Badge className="bg-primary text-primary-foreground">Premium</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(ebook.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewEbook(ebook.id)}
                            className="h-8 w-8 p-0"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditEbook(ebook.id)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir E-book</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este e-book? Esta ação não pode ser
                                  desfeita.
                                  <br />
                                  <br />
                                  <strong>E-book:</strong> "{ebook.title}"
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEbook(ebook.id, ebook.title)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação - sempre mostrar */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredAndSortedEbooks.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedEbooks.length)} de{' '}
              {filteredAndSortedEbooks.length} e-book(s)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
