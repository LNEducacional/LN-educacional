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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import collaboratorService from '@/services/collaborator.service';
import type { CollaboratorApplication } from '@/types/collaborator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowUpDown,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Download,
  Eye,
  Kanban,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  Table2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApplicationKanban } from './application-kanban';
import { CollaboratorAnalytics } from './collaborator-analytics';
import { EvaluationForm } from './evaluation-form';
import type { ApplicationStage } from '@/types/collaborator';

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  interviewing: { label: 'Em Entrevista', variant: 'default' as const },
  approved: { label: 'Aprovado', variant: 'default' as const },
  rejected: { label: 'Rejeitado', variant: 'destructive' as const },
};

type SortField = 'createdAt' | 'fullName' | 'area' | 'experience' | 'status';
type SortOrder = 'asc' | 'desc';

export function AdminCollaborators() {
  const { toast } = useToast();

  const [applications, setApplications] = useState<CollaboratorApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CollaboratorApplication | null>(
    null
  );
  const [deleteApplication, setDeleteApplication] = useState<CollaboratorApplication | null>(null);
  const [evaluatingApplication, setEvaluatingApplication] = useState<CollaboratorApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState('');

  // View controls
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'analytics'>('table');

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await collaboratorService.getApplications({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchFilter || undefined,
      });

      // Transform backend data to frontend format
      const transformedApplications = response.applications.map((app: any) => ({
        id: app.id,
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        area: app.area,
        experience: app.experience,
        availability: app.availability,
        status: app.status.toLowerCase() as 'pending' | 'interviewing' | 'approved' | 'rejected',
        createdAt: app.createdAt,
        resumeUrl: app.resumeUrl,
        stage: 'application' as ApplicationStage,
      }));

      setApplications(transformedApplications);
    } catch (error: any) {
      console.error('[ADMIN/COLLABORATORS] Error fetching applications:', error);
      toast({
        title: 'Erro ao carregar colaboradores',
        description: error.response?.data?.error || 'Não foi possível carregar a lista de colaboradores',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchFilter, toast]);

  // Bulk actions
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch applications on mount and when filters change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Sorting and pagination
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique values for filters
  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(applications.map((app) => app.area))).sort();
  }, [applications]);

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

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    // Primeiro filtra
    let filtered = applications.filter((app) => {
      // Search filter
      const matchesSearch =
        searchFilter === '' ||
        app.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        app.email.toLowerCase().includes(searchFilter.toLowerCase());

      // Area filter
      const matchesArea = areaFilter === 'all' || app.area === areaFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });

    // Depois ordena
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'fullName':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'area':
          aValue = a.area.toLowerCase();
          bValue = b.area.toLowerCase();
          break;
        case 'experience':
          aValue = a.experience.toLowerCase();
          bValue = b.experience.toLowerCase();
          break;
        case 'status':
          aValue = statusMap[a.status].label.toLowerCase();
          bValue = statusMap[b.status].label.toLowerCase();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, searchFilter, areaFilter, statusFilter, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedApplications.length / itemsPerPage);
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedApplications.slice(startIndex, endIndex);
  }, [filteredAndSortedApplications, currentPage, itemsPerPage]);

  // Reset para página 1 quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [searchFilter, areaFilter, statusFilter]);

  const handleStatusUpdate = async (
    applicationId: number | string,
    newStatus: CollaboratorApplication['status']
  ) => {
    setIsUpdatingStatus(true);

    try {
      // Call real API - convert status to UPPERCASE for backend
      const backendStatus = newStatus.toUpperCase() as 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED';
      await collaboratorService.updateStatus(String(applicationId), backendStatus);

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      toast({
        title: 'Sucesso',
        description: 'Status da candidatura atualizado com sucesso',
      });
    } catch (error: any) {
      console.error('[ADMIN/COLLABORATORS] Error updating status:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao atualizar status da candidatura',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStageUpdate = async (applicationId: number, newStage: ApplicationStage) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
      );

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => (prev ? { ...prev, stage: newStage } : null));
      }
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar etapa da candidatura',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteApplication) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setApplications((prev) => prev.filter((app) => app.id !== deleteApplication.id));

      toast({
        title: 'Sucesso',
        description: 'Candidatura deletada com sucesso',
      });

      setDeleteApplication(null);
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar candidatura',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendFeedback = (application: CollaboratorApplication) => {
    const subject = encodeURIComponent(`Feedback sobre sua candidatura - ${application.area}`);
    const body = encodeURIComponent(
      `Olá ${application.fullName},\n\n${feedback}\n\nAtenciosamente,\nEquipe LN Educacional`
    );

    window.open(`mailto:${application.email}?subject=${subject}&body=${body}`);

    toast({
      title: 'Cliente de email aberto',
      description: 'Rascunho de e-mail de feedback foi preparado',
    });

    setFeedback('');
  };

  // Bulk actions handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(filteredAndSortedApplications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (applicationId: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, applicationId]);
    } else {
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: CollaboratorApplication['status']) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          selectedApplications.includes(app.id) ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: 'Sucesso',
        description: `Status de ${selectedApplications.length} candidaturas atualizado para ${statusMap[newStatus].label}`,
      });

      setSelectedApplications([]);
      setIsBulkActionsOpen(false);
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status das candidaturas',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setApplications((prev) =>
        prev.filter((app) => !selectedApplications.includes(app.id))
      );

      toast({
        title: 'Sucesso',
        description: `${selectedApplications.length} candidaturas deletadas com sucesso`,
      });

      setSelectedApplications([]);
      setIsBulkActionsOpen(false);
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar candidaturas',
        variant: 'destructive',
      });
    }
  };

  const hasFilters =
    searchFilter !== '' ||
    areaFilter !== 'all' ||
    statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-600">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-foreground">Colaboradores</CardTitle>
              <CardDescription className="text-lg">
                Gerencie todas as candidaturas de colaboradores da plataforma
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center gap-2"
              >
                <Table2 className="h-4 w-4" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="flex items-center gap-2"
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('analytics')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Use os filtros abaixo para encontrar candidaturas específicas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por candidato..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {uniqueAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="interviewing">Em Entrevista</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedApplications.length > 0 && viewMode === 'table' && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedApplications.length} item{selectedApplications.length > 1 ? 's' : ''} selecionado{selectedApplications.length > 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplications([])}
                >
                  Limpar seleção
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu open={isBulkActionsOpen} onOpenChange={setIsBulkActionsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="flex items-center gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      Ações em lote
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('pending')}>
                      Marcar como Pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('interviewing')}>
                      Marcar como Em Entrevista
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('approved')}>
                      Marcar como Aprovado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('rejected')}>
                      Marcar como Rejeitado
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleBulkDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      Deletar selecionados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content - Table, Kanban or Analytics */}
      {viewMode === 'analytics' ? (
        <CollaboratorAnalytics />
      ) : viewMode === 'kanban' ? (
        <ApplicationKanban
          applications={filteredAndSortedApplications}
          onApplicationSelect={setSelectedApplication}
          onStageUpdate={handleStageUpdate}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-muted-foreground">Carregando candidaturas...</span>
              </div>
            </div>
          ) : filteredAndSortedApplications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma candidatura de colaborador encontrada.
              </p>
              {hasFilters && (
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros de pesquisa para ver mais resultados.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedApplications.length === filteredAndSortedApplications.length && filteredAndSortedApplications.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('createdAt')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Data
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('fullName')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Candidato
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('area')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Área
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('experience')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Experiência
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
                    <TableHead className="w-[200px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedApplications.includes(application.id)}
                        onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                        aria-label={`Selecionar ${application.fullName}`}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(application.createdAt), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{application.fullName}</div>
                      <div className="text-sm text-muted-foreground">{application.email}</div>
                    </TableCell>
                    <TableCell>{application.area}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="truncate max-w-[150px] block" title={application.experience}>
                        {application.experience.substring(0, 50)}...
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[application.status].variant}>
                        {statusMap[application.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEvaluatingApplication(application)}
                          title="Avaliar"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </Button>
                        {application.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(application.id, 'approved')}
                              disabled={isUpdatingStatus}
                              title="Aprovar"
                              className="text-accent hover:text-accent/80"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(application.id, 'rejected')}
                              disabled={isUpdatingStatus}
                              title="Rejeitar"
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteApplication(application)}
                          title="Deletar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
          {!isLoading && viewMode === 'table' && (
            <div className="mt-4 px-6 pb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredAndSortedApplications.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a{' '}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedApplications.length)} de{' '}
                {filteredAndSortedApplications.length} candidatura(s)
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
          )}
        </CardContent>
        </Card>
      )}

      {/* Application Details Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidatura de Colaborador</DialogTitle>
            <DialogDescription>
              {selectedApplication &&
                format(new Date(selectedApplication.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informações Pessoais</h3>

                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{selectedApplication.fullName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <a
                      href={`mailto:${selectedApplication.email}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedApplication.email}
                    </a>
                  </div>

                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <a
                      href={`tel:${selectedApplication.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedApplication.phone}
                    </a>
                  </div>

                  <div className="space-y-2">
                    <Label>Área</Label>
                    <p className="font-medium">{selectedApplication.area}</p>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Status e Ações</h3>

                  <div className="space-y-2">
                    <Label>Status Atual</Label>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusMap[selectedApplication.status].variant}>
                        {statusMap[selectedApplication.status].label}
                      </Badge>

                      <Select
                        value={selectedApplication.status}
                        onValueChange={(value) =>
                          handleStatusUpdate(
                            selectedApplication.id,
                            value as CollaboratorApplication['status']
                          )
                        }
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="interviewing">Em Entrevista</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedApplication.resumeUrl && (
                    <div className="space-y-2">
                      <Label>Currículo</Label>
                      <a
                        href={selectedApplication.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Currículo
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Experience */}
              <div className="space-y-2">
                <Label>Experiência</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedApplication.experience}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedApplication.availability}
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label>Enviar Feedback</Label>
                <Textarea
                  placeholder="Digite seu feedback para o candidato..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={() => handleSendFeedback(selectedApplication)}
                  disabled={!feedback.trim()}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Enviar E-mail
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Modal */}
      <Dialog open={!!evaluatingApplication} onOpenChange={() => setEvaluatingApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliar Candidato</DialogTitle>
            <DialogDescription>
              Avalie o candidato em diferentes critérios para auxiliar na decisão de contratação.
            </DialogDescription>
          </DialogHeader>

          {evaluatingApplication && (
            <EvaluationForm
              applicationId={evaluatingApplication.id}
              applicantName={evaluatingApplication.fullName}
              onComplete={() => {
                setEvaluatingApplication(null);
                toast({
                  title: 'Avaliação concluída',
                  description: `Avaliação de ${evaluatingApplication.fullName} foi salva com sucesso.`,
                });
              }}
              onCancel={() => setEvaluatingApplication(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={!!deleteApplication}
        onOpenChange={() => !isDeleting && setDeleteApplication(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja deletar a candidatura de{' '}
                <strong>{deleteApplication?.fullName}</strong>?
              </p>
              <p>Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
