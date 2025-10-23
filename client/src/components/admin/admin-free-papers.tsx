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
import { useApi, useApiMutation } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import type { PaperType, ReadyPaper } from '@/types/paper';
import { formatKeywords, formatPaperType } from '@/utils/paper-formatters';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Eye, FileText, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface AdminFreePapersProps {
  onAddPaper: () => void;
  onEditPaper: (id: string) => void;
  onViewPaper: (id: string) => void;
}

interface FilterCriteria {
  title: string;
  pages: string;
  paperType: PaperType | 'all';
}

type SortField = 'title' | 'paperType' | 'pageCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const matchesFilters = (paper: ReadyPaper, filters: FilterCriteria): boolean => {
  // Title filter - search in title and description
  if (filters.title) {
    const searchTerm = filters.title.toLowerCase();
    const titleMatch = paper.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = paper.description.toLowerCase().includes(searchTerm);
    if (!titleMatch && !descriptionMatch) {
      return false;
    }
  }

  // Page count filter using lookup table
  if (filters.pages !== 'all') {
    const pageRanges = {
      '0-50': { min: 0, max: 50 },
      '51-100': { min: 51, max: 100 },
      '100+': { min: 101, max: Number.POSITIVE_INFINITY },
    } as const;

    const rangeConfig = pageRanges[filters.pages as keyof typeof pageRanges];
    if (rangeConfig) {
      const pageCount = paper.pageCount;
      if (pageCount < rangeConfig.min || pageCount > rangeConfig.max) {
        return false;
      }
    }
  }

  // Paper type filter
  if (filters.paperType !== 'all' && paper.paperType !== filters.paperType) {
    return false;
  }

  return true;
};

export function AdminFreePapers({ onAddPaper, onEditPaper, onViewPaper }: AdminFreePapersProps) {
  const {
    data: papersResponse,
    loading,
    error,
    refetch,
  } = useApi<{ papers: ReadyPaper[]; total: number }>('/admin/papers?free=true&take=1000', { dependencies: [] });
  const deletePaper = useApiMutation<void, void>('delete');

  const papers = papersResponse?.papers || [];

  const [filters, setFilters] = useState({
    title: '',
    pages: 'all',
    paperType: 'all' as PaperType | 'all',
  });
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const filteredAndSortedPapers = useMemo(() => {
    // Primeiro filtra
    let filtered = papers.filter((paper) => matchesFilters(paper, filters));

    // Depois ordena
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'paperType':
          aValue = formatPaperType(a.paperType).toLowerCase();
          bValue = formatPaperType(b.paperType).toLowerCase();
          break;
        case 'pageCount':
          aValue = a.pageCount;
          bValue = b.pageCount;
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
  }, [papers, filters, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedPapers.length / itemsPerPage);
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPapers.slice(startIndex, endIndex);
  }, [filteredAndSortedPapers, currentPage, itemsPerPage]);

  // Reset para página 1 quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [filters.title, filters.pages, filters.paperType]);

  const handleDeletePaper = async (id: string, title: string) => {
    try {
      await deletePaper.mutate(`/admin/papers/${id}`);

      toast({
        title: 'Trabalho excluído',
        description: `"${title}" foi removido com sucesso.`,
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o trabalho.',
        variant: 'destructive',
      });
    }
  };

  const hasFilters = Object.values(filters).some((value) => value !== '' && value !== 'all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trabalhos Gratuitos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os trabalhos gratuitos disponíveis na plataforma
          </p>
        </div>
        <Button onClick={onAddPaper} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Trabalho Gratuito
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
                htmlFor="title-search-free"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Título
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="title-search-free"
                  placeholder="Buscar por título..."
                  value={filters.title}
                  onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pages-select-free"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Páginas
              </label>
              <Select
                value={filters.pages}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, pages: value }))}
              >
                <SelectTrigger id="pages-select-free">
                  <SelectValue placeholder="Todas as páginas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as páginas</SelectItem>
                  <SelectItem value="0-50">0-50 páginas</SelectItem>
                  <SelectItem value="51-100">51-100 páginas</SelectItem>
                  <SelectItem value="100+">100+ páginas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="type-select-free"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Tipo
              </label>
              <Select
                value={filters.paperType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, paperType: value as PaperType | 'all' }))
                }
              >
                <SelectTrigger id="type-select-free">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="article">Artigo</SelectItem>
                  <SelectItem value="summary">Resumo</SelectItem>
                  <SelectItem value="review">Resenha</SelectItem>
                  <SelectItem value="thesis">TCC</SelectItem>
                  <SelectItem value="dissertation">Dissertação</SelectItem>
                  <SelectItem value="monography">Monografia</SelectItem>
                  <SelectItem value="case_study">Estudo de Caso</SelectItem>
                  <SelectItem value="project">Projeto</SelectItem>
                  <SelectItem value="essay">Ensaio</SelectItem>
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
            {loading
              ? 'Carregando...'
              : `${filteredAndSortedPapers.length} trabalho${filteredAndSortedPapers.length !== 1 ? 's' : ''} encontrado${filteredAndSortedPapers.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando trabalhos gratuitos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Erro ao carregar trabalhos
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          ) : filteredAndSortedPapers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {hasFilters ? 'Nenhum trabalho encontrado' : 'Nenhum trabalho gratuito cadastrado'}
              </h3>
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
                        onClick={() => handleSort('paperType')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Tipo
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
                  {paginatedPapers.map((paper) => (
                    <TableRow key={paper.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div
                              className="font-medium text-foreground cursor-help"
                              title={paper.description}
                            >
                              {paper.title}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatPaperType(paper.paperType)}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{paper.pageCount}</TableCell>
                      <TableCell>
                        <Badge className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          Gratuito
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(paper.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPaper(paper.id)}
                            className="h-8 w-8 p-0"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPaper(paper.id)}
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
                                <AlertDialogTitle>Excluir Trabalho Gratuito</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O trabalho será removido
                                  permanentemente.
                                  <br />
                                  <br />
                                  <strong>Trabalho:</strong> "{paper.title}"
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePaper(paper.id, paper.title)}
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
              Mostrando {filteredAndSortedPapers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedPapers.length)} de{' '}
              {filteredAndSortedPapers.length} trabalho(s)
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
