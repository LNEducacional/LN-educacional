import { customPapersApi } from '@/api/custom-papers';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { CustomPaperStatus } from '@/types/custom-paper';
import { formatAcademicArea, formatPaperType } from '@/utils/paper-formatters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Hash,
  MessageCircle,
  Send,
  Tag,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function AdminCustomPaperDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [quotedPrice, setQuotedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    data: paper,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['custom-paper', id],
    queryFn: async () => {
      const response = await customPapersApi.getAdminRequestDetails(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const provideQuoteMutation = useMutation({
    mutationFn: (data: { quotedPrice: number; adminNotes?: string }) =>
      customPapersApi.provideQuote(id!, data),
    onSuccess: () => {
      toast({ title: 'Orçamento enviado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['custom-paper', id] });
      setQuotedPrice('');
      setAdminNotes('');
    },
    onError: () => {
      toast({ title: 'Erro ao enviar orçamento', variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: CustomPaperStatus; notes?: string }) =>
      customPapersApi.updateStatus(id!, data.status, data.notes),
    onSuccess: () => {
      toast({ title: 'Status atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['custom-paper', id] });
      setStatusNotes('');
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (reason: string) => customPapersApi.rejectRequest(id!, reason),
    onSuccess: () => {
      toast({ title: 'Solicitação rejeitada' });
      queryClient.invalidateQueries({ queryKey: ['custom-paper', id] });
      setRejectionReason('');
    },
    onError: () => {
      toast({ title: 'Erro ao rejeitar solicitação', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p>Carregando...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !paper) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="p-8 text-center">
              <p className="text-destructive">Erro ao carregar trabalho personalizado</p>
              <Button onClick={() => navigate('/admin/custom-papers')} className="mt-4">
                Voltar
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const statusColors: Record<string, string> = {
    REQUESTED: 'bg-yellow-100 text-yellow-800',
    QUOTED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    REVIEW: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
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

  const handleProvideQuote = () => {
    const price = Number.parseFloat(quotedPrice) * 100;
    provideQuoteMutation.mutate({ quotedPrice: price, adminNotes });
  };

  const handleStatusChange = (status: CustomPaperStatus) => {
    updateStatusMutation.mutate({ status, notes: statusNotes });
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      rejectRequestMutation.mutate(rejectionReason);
    }
  };

  const handleEdit = () => {
    navigate(`/admin/custom-papers/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/admin/custom-papers');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{paper.title}</h1>
                  <p className="text-muted-foreground">Detalhes do trabalho personalizado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Status e Urgência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Status e Urgência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Status:</span>
                      <Badge className={cn('font-medium', statusColors[paper.status])}>
                        {statusLabels[paper.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Urgência:</span>
                      <Badge
                        variant={
                          paper.urgency === 'VERY_URGENT'
                            ? 'destructive'
                            : paper.urgency === 'URGENT'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {urgencyLabels[paper.urgency]}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Prazo:</span>
                      <span className="text-muted-foreground">
                        {format(new Date(paper.deadline), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">ID:</span>
                      <span className="text-muted-foreground">#{paper.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground leading-relaxed">{paper.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Tipo:</span>
                      <Badge variant="outline">{formatPaperType(paper.paperType)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Área:</span>
                      <Badge variant="outline">
                        {formatAcademicArea(paper.academicArea as any)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Páginas:</span>
                      <span className="text-muted-foreground">{paper.pageCount}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {paper.keywords && (
                      <div className="flex items-start gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <span className="font-medium text-foreground">Palavras-chave:</span>
                          <p className="text-muted-foreground">{paper.keywords}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Nome:</span>
                  <span className="text-muted-foreground">{paper.user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Email:</span>
                  <span className="text-muted-foreground">{paper.user?.email || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Requisitos */}
            <Card>
              <CardHeader>
                <CardTitle>Requisitos do Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{paper.requirements}</p>
              </CardContent>
            </Card>

            {/* Valores */}
            {(paper.quotedPrice || paper.finalPrice) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paper.quotedPrice && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Valor Orçado:</span>
                      <span className="text-muted-foreground">
                        R$ {(paper.quotedPrice / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {paper.finalPrice && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Valor Final:</span>
                      <span className="text-green-600 font-semibold">
                        R$ {(paper.finalPrice / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ações Administrativas */}
            {paper.status === 'REQUESTED' && (
              <Card>
                <CardHeader>
                  <CardTitle>Fornecer Orçamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quotedPrice">Valor (R$)</Label>
                      <Input
                        id="quotedPrice"
                        type="number"
                        step="0.01"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        placeholder="Ex: 500.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Notas do Admin (opcional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Observações sobre o orçamento"
                    />
                  </div>
                  <Button onClick={handleProvideQuote} disabled={!quotedPrice}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Orçamento
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Alterar Status */}
            {paper.status !== 'REQUESTED' && paper.status !== 'REJECTED' && (
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Novo Status</Label>
                    <Select onValueChange={(value) => handleStatusChange(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                        <SelectItem value="REVIEW">Em Revisão</SelectItem>
                        <SelectItem value="COMPLETED">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejeitar Solicitação */}
            {paper.status === 'REQUESTED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Rejeitar Solicitação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Motivo da Rejeição</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explique o motivo da rejeição"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Rejeitar Solicitação
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Rejection Alert */}
            {paper.rejectionReason && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Motivo da Rejeição:</strong>
                  <p className="mt-1">{paper.rejectionReason}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Admin Notes */}
            {paper.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas do Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {paper.adminNotes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default AdminCustomPaperDetailsPage;
