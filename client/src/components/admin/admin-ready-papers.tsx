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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mockReadyPapers } from '@/data/mock-ready-papers';
import { toast } from '@/hooks/use-toast';
import type { AcademicArea, PaperType, ReadyPaper } from '@/types/paper';
import {
  formatAcademicArea,
  formatKeywords,
  formatPaperType,
  formatPrice,
} from '@/utils/paper-formatters';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Eye, FileText, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface AdminReadyPapersProps {
  onAddPaper: () => void;
  onEditPaper: (id: number) => void;
  onViewPaper: (id: number) => void;
}

interface FilterCriteria {
  search: string;
  paperType: PaperType | 'all';
  academicArea: AcademicArea | 'all';
}

type SortField = 'title' | 'authorName' | 'paperType' | 'academicArea' | 'pageCount' | 'price';
type SortOrder = 'asc' | 'desc';


export function AdminReadyPapers({ onAddPaper, onEditPaper, onViewPaper }: AdminReadyPapersProps) {
  const [papers, setPapers] = useState<ReadyPaper[]>(mockReadyPapers);
  const [search, setSearch] = useState('');
  const [paperTypeFilter, setPaperTypeFilter] = useState<PaperType | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<AcademicArea | 'all'>('all');
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

  // Filtragem, ordenação e paginação
  const filteredAndSortedPapers = useMemo(() => {
    // Primeiro filtra
    let filtered = papers.filter((paper) => {
      const matchesSearch = search === '' ||
        paper.title.toLowerCase().includes(search.toLowerCase()) ||
        paper.authorName.toLowerCase().includes(search.toLowerCase());
      const matchesType = paperTypeFilter === 'all' || paper.paperType === paperTypeFilter;
      const matchesArea = areaFilter === 'all' || paper.academicArea === areaFilter;

      return matchesSearch && matchesType && matchesArea;
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
        case 'authorName':
          aValue = a.authorName.toLowerCase();
          bValue = b.authorName.toLowerCase();
          break;
        case 'paperType':
          aValue = formatPaperType(a.paperType).toLowerCase();
          bValue = formatPaperType(b.paperType).toLowerCase();
          break;
        case 'academicArea':
          aValue = formatAcademicArea(a.academicArea).toLowerCase();
          bValue = formatAcademicArea(b.academicArea).toLowerCase();
          break;
        case 'pageCount':
          aValue = a.pageCount;
          bValue = b.pageCount;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [papers, search, paperTypeFilter, areaFilter, sortField, sortOrder]);

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
  }, [search, paperTypeFilter, areaFilter]);

  const handleDeletePaper = async (id: number) => {
    try {
      setPapers((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Trabalho excluído',
        description: 'O trabalho foi removido com sucesso.',
      });
    } catch (_error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o trabalho. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const hasFilters = search !== '' || paperTypeFilter !== 'all' || areaFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trabalhos Prontos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os trabalhos prontos disponíveis na plataforma
          </p>
        </div>
        <Button onClick={onAddPaper} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Trabalho
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Use os filtros abaixo para encontrar trabalhos específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou autor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paperTypeFilter} onValueChange={(value) => setPaperTypeFilter(value as PaperType | 'all')}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Tipo de Trabalho" />
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
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={(value) => setAreaFilter(value as AcademicArea | 'all')}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Área Acadêmica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                <SelectItem value="exact_sciences">Ciências Exatas</SelectItem>
                <SelectItem value="biological_sciences">Ciências Biológicas</SelectItem>
                <SelectItem value="health_sciences">Ciências da Saúde</SelectItem>
                <SelectItem value="applied_social_sciences">Ciências Sociais Aplicadas</SelectItem>
                <SelectItem value="humanities">Ciências Humanas</SelectItem>
                <SelectItem value="engineering">Engenharias</SelectItem>
                <SelectItem value="languages">Linguística/Letras/Artes</SelectItem>
                <SelectItem value="agricultural_sciences">Ciências Agrárias</SelectItem>
                <SelectItem value="multidisciplinary">Multidisciplinar</SelectItem>
                <SelectItem value="social_sciences">Ciências Sociais</SelectItem>
                <SelectItem value="other">Outras</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Trabalhos ({filteredAndSortedPapers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedPapers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {hasFilters ? 'Nenhum trabalho encontrado' : 'Nenhum trabalho cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? 'Nenhum trabalho encontrado com os filtros aplicados.'
                  : 'Nenhum trabalho pronto cadastrado. Adicione seu primeiro trabalho.'}
              </p>
              {!hasFilters && (
                <Button onClick={onAddPaper}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Trabalho
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
                        onClick={() => handleSort('authorName')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Autor
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
                        onClick={() => handleSort('academicArea')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Área
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
                            <div className="font-medium text-foreground">{paper.title}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{paper.authorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatPaperType(paper.paperType)}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatAcademicArea(paper.academicArea)}
                      </TableCell>
                      <TableCell className="text-foreground">{paper.pageCount}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatPrice(paper.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPaper(paper.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPaper(paper.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o trabalho "{paper.title}"? Esta
                                  ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePaper(paper.id)}
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
