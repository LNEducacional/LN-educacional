import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import collaboratorService, { type CollaboratorResponse } from '@/services/collaborator.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type React from 'react';
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Mail,
  Phone,
  Search,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';

const STATUS_LABELS = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500' },
  INTERVIEWING: { label: 'Em Entrevista', color: 'bg-blue-500' },
  APPROVED: { label: 'Aprovado', color: 'bg-green-500' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-500' },
};

export default function AdminCollaborators() {
  const [applications, setApplications] = useState<CollaboratorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<CollaboratorResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await collaboratorService.getApplications({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      setApplications(response.items || []);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao carregar aplicações',
        description: error.response?.data?.error || 'Erro ao carregar lista de colaboradores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusUpdate = async (
    id: string,
    newStatus: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED'
  ) => {
    setUpdatingStatus(true);
    try {
      await collaboratorService.updateStatus(id, newStatus);

      toast({
        title: 'Status atualizado',
        description: 'O status do colaborador foi atualizado com sucesso.',
      });

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );

      if (selectedApplication?.id === id) {
        setSelectedApplication({ ...selectedApplication, status: newStatus });
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.response?.data?.error || 'Erro ao atualizar status do colaborador',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const openDetails = (application: CollaboratorResponse) => {
    setSelectedApplication(application);
    setIsDetailsOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'INTERVIEWING':
        return <AlertCircle className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Colaboradores</h1>
        <p className="text-muted-foreground">Gerencie as aplicações de colaboradores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Aplicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter((a) => a.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Entrevista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {applications.filter((a) => a.status === 'INTERVIEWING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {applications.filter((a) => a.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="INTERVIEWING">Em Entrevista</SelectItem>
                <SelectItem value="APPROVED">Aprovados</SelectItem>
                <SelectItem value="REJECTED">Rejeitados</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aplicações</CardTitle>
          <CardDescription>Lista de todas as aplicações de colaboradores</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma aplicação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.fullName}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.area.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_LABELS[app.status as keyof typeof STATUS_LABELS].color}
                      >
                        {getStatusIcon(app.status)}
                        <span className="ml-1">
                          {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS].label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(app.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openDetails(app)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Aplicação</DialogTitle>
            <DialogDescription>Informações completas do colaborador</DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome Completo</Label>
                  <p className="font-medium">{selectedApplication.fullName}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status Atual</Label>
                  <Badge
                    className={`mt-1 ${STATUS_LABELS[selectedApplication.status as keyof typeof STATUS_LABELS].color}`}
                  >
                    {STATUS_LABELS[selectedApplication.status as keyof typeof STATUS_LABELS].label}
                  </Badge>
                </div>

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedApplication.email}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedApplication.phone}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Área de Interesse</Label>
                  <p className="font-medium">{selectedApplication.area.replace(/_/g, ' ')}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Disponibilidade</Label>
                  <p className="font-medium">
                    {selectedApplication.availability.replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground">Experiência</Label>
                  <p className="font-medium mt-1 whitespace-pre-wrap">
                    {selectedApplication.experience}
                  </p>
                </div>

                {selectedApplication.resumeUrl && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Currículo</Label>
                    <Button variant="outline" size="sm" className="mt-1">
                      <FileText className="h-4 w-4 mr-1" />
                      Visualizar Currículo
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Data de Aplicação</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedApplication.createdAt), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Atualizar Status</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedApplication.id, 'PENDING')}
                    disabled={updatingStatus || selectedApplication.status === 'PENDING'}
                  >
                    Pendente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedApplication.id, 'INTERVIEWING')}
                    disabled={updatingStatus || selectedApplication.status === 'INTERVIEWING'}
                  >
                    Em Entrevista
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-accent"
                    onClick={() => handleStatusUpdate(selectedApplication.id, 'APPROVED')}
                    disabled={updatingStatus || selectedApplication.status === 'APPROVED'}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleStatusUpdate(selectedApplication.id, 'REJECTED')}
                    disabled={updatingStatus || selectedApplication.status === 'REJECTED'}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
