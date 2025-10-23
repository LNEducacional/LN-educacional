import { customPapersApi } from '@/api/custom-papers';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
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
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { CustomPaper } from '@/types/custom-paper';
import { formatAcademicArea, formatPaperType } from '@/utils/paper-formatters';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  QUOTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-accent-subtle text-accent-foreground',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  REVIEW: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-accent-subtle text-accent-foreground',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  REQUESTED: 'Solicitado',
  QUOTED: 'Orçado',
  APPROVED: 'Aprovado',
  IN_PROGRESS: 'Em Progresso',
  REVIEW: 'Em Revisão',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rejeitado',
};

const urgencyLabels = {
  NORMAL: 'Normal',
  URGENT: 'Urgente',
  VERY_URGENT: 'Muito Urgente',
};

type SortField = 'title' | 'userName' | 'paperType' | 'deadline' | 'status' | 'quotedPrice';
type SortOrder = 'asc' | 'desc';

export function AdminCustomPapersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<CustomPaper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusFilter = () => {
    switch (currentTab) {
      case 'pending':
        return 'REQUESTED';
      case 'quoted':
        return 'QUOTED';
      case 'active':
        return 'IN_PROGRESS';
      case 'review':
        return 'REVIEW';
      case 'completed':
        return 'COMPLETED';
      default:
        return undefined;
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-custom-papers', currentTab, searchTerm, selectedUrgency],
    queryFn: async () => {
      const response = await customPapersApi.getAllRequests({
        status: getStatusFilter(),
        urgency: selectedUrgency !== 'all' ? selectedUrgency : undefined,
        search: searchTerm || undefined,
        page: 1,
        limit: 1000, // Buscar todos para ordenar e paginar no frontend
      });
      return response.data;
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
  const filteredAndSortedPapers = useMemo(() => {
    if (!data?.items) return [];

    let papers = [...data.items];

    // Ordenação
    papers.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'userName':
          aValue = (a.user?.name || '').toLowerCase();
          bValue = (b.user?.name || '').toLowerCase();
          break;
        case 'paperType':
          aValue = formatPaperType(a.paperType).toLowerCase();
          bValue = formatPaperType(b.paperType).toLowerCase();
          break;
        case 'deadline':
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
          break;
        case 'status':
          aValue = statusLabels[a.status].toLowerCase();
          bValue = statusLabels[b.status].toLowerCase();
          break;
        case 'quotedPrice':
          aValue = a.quotedPrice || 0;
          bValue = b.quotedPrice || 0;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return papers;
  }, [data?.items, sortField, sortOrder]);

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
  }, [searchTerm, currentTab, selectedUrgency]);

  // Calcular estatísticas dinâmicas
  const stats = useMemo(() => {
    if (!data?.items) {
      return {
        newRequests: 0,
        inProgress: 0,
        urgent: 0,
        potentialRevenue: 0,
      };
    }

    const newRequests = data.items.filter((p) => p.status === 'REQUESTED').length;
    const inProgress = data.items.filter((p) => p.status === 'IN_PROGRESS').length;
    const urgent = data.items.filter((p) => p.urgency === 'URGENT' || p.urgency === 'VERY_URGENT').length;
    const potentialRevenue = data.items
      .filter((p) => p.status === 'QUOTED' || p.status === 'APPROVED')
      .reduce((sum, p) => sum + (p.quotedPrice || 0), 0);

    return {
      newRequests,
      inProgress,
      urgent,
      potentialRevenue,
    };
  }, [data?.items]);

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'VERY_URGENT':
        return 'destructive';
      case 'URGENT':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleDeleteClick = (paper: CustomPaper, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaperToDelete(paper);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paperToDelete) return;

    setIsDeleting(true);
    try {
      await customPapersApi.deleteRequest(paperToDelete.id);
      toast.success('Trabalho personalizado excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-custom-papers'] });
      setDeleteDialogOpen(false);
      setPaperToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir trabalho:', error);
      toast.error(error.response?.data?.error || 'Erro ao excluir trabalho personalizado');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Trabalhos Personalizados</h1>
                <p className="text-muted-foreground">Gerencie solicitações de trabalhos personalizados</p>
              </div>
              <Button onClick={() => navigate('/admin/custom-papers/adicionar')}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Trabalho
              </Button>
            </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newRequests}</div>
            <p className="text-xs text-muted-foreground">Aguardando orçamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Trabalhos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">Prazo &lt; 3 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats.potentialRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Orçamentos pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={currentTab} onValueChange={setCurrentTab}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="quoted">Orçados</SelectItem>
                <SelectItem value="active">Em Progresso</SelectItem>
                <SelectItem value="review">Revisão</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
                <SelectItem value="VERY_URGENT">Muito Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
              {isLoading ? (
                <div className="p-8 text-center">Carregando...</div>
              ) : !data?.items || data.items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum trabalho personalizado encontrado</p>
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
                            Solicitação
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('userName')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Cliente
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
                            Tipo/Área
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('deadline')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Prazo
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('status')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Status
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('quotedPrice')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Valor
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPapers.map((paper: CustomPaper) => (
                      <TableRow
                        key={paper.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/custom-papers/${paper.id}`)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium line-clamp-1">{paper.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant={getUrgencyBadgeColor(paper.urgency)}>
                                {urgencyLabels[paper.urgency]}
                              </Badge>
                              <span>{paper.pageCount} páginas</span>
                              {paper.messages && paper.messages.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{paper.messages.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{paper.user?.name}</p>
                            <p className="text-sm text-muted-foreground">{paper.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">{formatPaperType(paper.paperType)}</Badge>
                            <p className="text-sm text-muted-foreground">{formatAcademicArea(paper.academicArea as any)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {format(new Date(paper.deadline), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {Math.ceil(
                                (new Date(paper.deadline).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )}{' '}
                              dias
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium', statusColors[paper.status])}>
                            {statusLabels[paper.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {paper.quotedPrice ? (
                            <div className="space-y-1">
                              <p className="font-medium">
                                R$ {(paper.quotedPrice / 100).toFixed(2)}
                              </p>
                              {paper.finalPrice && paper.finalPrice !== paper.quotedPrice && (
                                <p className="text-sm text-accent">
                                  Final: R$ {(paper.finalPrice / 100).toFixed(2)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/custom-papers/${paper.id}`);
                              }}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/custom-papers/edit/${paper.id}`);
                              }}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteClick(paper, e)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o trabalho personalizado{' '}
              <strong>{paperToDelete?.title}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita e todas as mensagens associadas também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

export default AdminCustomPapersPage;
