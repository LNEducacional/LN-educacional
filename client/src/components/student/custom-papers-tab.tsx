import { customPapersApi } from '@/api/custom-papers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { CustomPaper } from '@/types/custom-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  MessageCircle,
  Plus,
  Send,
  AlertCircle,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
  QUOTED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
  APPROVED: 'bg-accent-subtle text-accent-foreground dark:bg-accent/20 dark:text-accent',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400',
  REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  REQUESTED: 'Aguardando Orçamento',
  QUOTED: 'Orçamento Disponível',
  APPROVED: 'Aprovado',
  IN_PROGRESS: 'Em Desenvolvimento',
  REVIEW: 'Em Revisão',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rejeitado',
};

export function CustomPapersTab() {
  const queryClient = useQueryClient();
  const [selectedPaper, setSelectedPaper] = useState<CustomPaper | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: papers, isLoading } = useQuery({
    queryKey: ['my-custom-papers'],
    queryFn: () => customPapersApi.getMyRequests(),
  });

  const approveQuoteMutation = useMutation({
    mutationFn: (paperId: string) => customPapersApi.approveQuote(paperId),
    onSuccess: () => {
      toast({ title: 'Orçamento aprovado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['my-custom-papers'] });
      setDetailsModalOpen(false);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ paperId, content }: { paperId: string; content: string }) =>
      customPapersApi.sendMessage(paperId, { content }),
    onSuccess: () => {
      setMessageContent('');
      toast({ title: 'Mensagem enviada!' });
      // Refresh the selected paper details
      if (selectedPaper) {
        fetchPaperDetails(selectedPaper.id);
      }
    },
  });

  const fetchPaperDetails = async (paperId: string) => {
    const { data } = await customPapersApi.getRequestDetails(paperId);
    setSelectedPaper(data);
  };

  const handleOpenDetails = (paper: CustomPaper) => {
    setSelectedPaper(paper);
    fetchPaperDetails(paper.id);
    setDetailsModalOpen(true);
  };

  const handleSendMessage = () => {
    if (selectedPaper && messageContent.trim()) {
      sendMessageMutation.mutate({
        paperId: selectedPaper.id,
        content: messageContent,
      });
    }
  };

  const handleApproveQuote = () => {
    if (selectedPaper) {
      approveQuoteMutation.mutate(selectedPaper.id);
    }
  };

  // Garantir que papers seja um array
  const papersArray = Array.isArray(papers) ? papers : [];

  // Group papers by status
  const activePapers = papersArray.filter((p) =>
    ['REQUESTED', 'QUOTED', 'APPROVED', 'IN_PROGRESS', 'REVIEW'].includes(p.status)
  );

  const completedPapers = papersArray.filter((p) =>
    ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(p.status)
  );

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  // Calcular estatísticas
  const totalInvestment = papersArray
    .filter(p => p.finalPrice || p.quotedPrice)
    .reduce((sum, p) => sum + (p.finalPrice || p.quotedPrice || 0), 0);

  const stats = [
    {
      label: 'Trabalhos Ativos',
      value: activePapers.length,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Concluídos',
      value: completedPapers.filter(p => p.status === 'COMPLETED').length,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Investimento Total',
      value: `R$ ${(totalInvestment / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trabalhos Personalizados</h1>
            <p className="text-muted-foreground">
              Acompanhe suas solicitações de trabalhos personalizados
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/custom-papers">
              <Plus className="h-4 w-4" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Ativos ({activePapers.length})</TabsTrigger>
          <TabsTrigger value="completed">Finalizados ({completedPapers.length})</TabsTrigger>
        </TabsList>

        {/* Active Papers */}
        <TabsContent value="active" className="space-y-4">
          {activePapers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Nenhum trabalho ativo</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Você não tem solicitações ativas no momento. Solicite um trabalho personalizado para começar!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            activePapers.map((paper) => (
              <Card
                key={paper.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4"
                style={{
                  borderLeftColor: paper.status === 'QUOTED' ? 'rgb(59 130 246)' :
                                   paper.status === 'IN_PROGRESS' ? 'rgb(168 85 247)' :
                                   paper.status === 'REVIEW' ? 'rgb(249 115 22)' :
                                   'rgb(229 231 235)'
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg leading-tight">{paper.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{paper.paperType}</span>
                        <span>•</span>
                        <span>{paper.academicArea}</span>
                        <span>•</span>
                        <span>{paper.pageCount} páginas</span>
                      </CardDescription>
                    </div>
                    <Badge className={cn('font-medium shrink-0', statusColors[paper.status])}>
                      {statusLabels[paper.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-md bg-background">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prazo</p>
                        <p className="text-sm font-semibold">
                          {format(new Date(paper.deadline), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>

                    {paper.quotedPrice && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-background">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valor</p>
                          <p className="text-sm font-semibold">
                            R$ {(paper.quotedPrice / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-md bg-background">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Solicitado</p>
                        <p className="text-sm font-semibold">
                          {format(new Date(paper.requestedAt), 'dd/MM')}
                        </p>
                      </div>
                    </div>

                    {paper.messages && paper.messages.length > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-background">
                          <MessageCircle className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Mensagens</p>
                          <p className="text-sm font-semibold">{paper.messages.length}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDetails(paper)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Detalhes
                    </Button>

                    {paper.status === 'QUOTED' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPaper(paper);
                          handleApproveQuote();
                        }}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar Orçamento
                      </Button>
                    )}

                    {paper.status === 'COMPLETED' && paper.deliveryFiles?.length > 0 && (
                      <Button size="sm" variant="outline" asChild className="gap-2">
                        <a href={paper.deliveryFiles[0]} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          Baixar Trabalho
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed Papers */}
        <TabsContent value="completed" className="space-y-4">
          {completedPapers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Nenhum trabalho finalizado</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Seus trabalhos concluídos, cancelados ou rejeitados aparecerão aqui.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            completedPapers.map((paper) => (
              <Card
                key={paper.id}
                className={cn(
                  'transition-all duration-200 hover:shadow-md',
                  paper.status === 'COMPLETED' ? 'border-l-4 border-l-emerald-500' :
                  paper.status === 'CANCELLED' ? 'border-l-4 border-l-gray-400' :
                  'border-l-4 border-l-red-500'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg leading-tight">{paper.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{paper.paperType}</span>
                        <span>•</span>
                        <span>{paper.academicArea}</span>
                        <span>•</span>
                        <span>{paper.pageCount} páginas</span>
                      </CardDescription>
                    </div>
                    <Badge className={cn('font-medium shrink-0', statusColors[paper.status])}>
                      {statusLabels[paper.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Solicitado {format(new Date(paper.requestedAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    {paper.completedAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-muted-foreground">
                          Concluído {format(new Date(paper.completedAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                    {paper.finalPrice && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold">R$ {(paper.finalPrice / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDetails(paper)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Detalhes
                    </Button>

                    {paper.status === 'COMPLETED' && paper.deliveryFiles?.length > 0 && (
                      <Button size="sm" asChild className="gap-2">
                        <a href={paper.deliveryFiles[0]} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          Baixar Trabalho
                        </a>
                      </Button>
                    )}
                  </div>

                  {paper.status === 'REJECTED' && paper.rejectionReason && (
                    <Alert variant="destructive" className="mt-3 border-l-4 border-l-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-1">Motivo da rejeição:</p>
                        <p className="text-sm">{paper.rejectionReason}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedPaper && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPaper.title}</DialogTitle>
                <DialogDescription>
                  <Badge className={cn('font-medium', statusColors[selectedPaper.status])}>
                    {statusLabels[selectedPaper.status]}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Details */}
                <div>
                  <h3 className="font-semibold mb-2">Detalhes da Solicitação</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Tipo:</span> {selectedPaper.paperType}
                    </p>
                    <p>
                      <span className="font-medium">Área:</span> {selectedPaper.academicArea}
                    </p>
                    <p>
                      <span className="font-medium">Páginas:</span> {selectedPaper.pageCount}
                    </p>
                    <p>
                      <span className="font-medium">Prazo:</span>{' '}
                      {format(new Date(selectedPaper.deadline), 'dd/MM/yyyy')}
                    </p>
                    <p>
                      <span className="font-medium">Urgência:</span> {selectedPaper.urgency}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPaper.description}
                  </p>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="font-semibold mb-2">Requisitos</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPaper.requirements}
                  </p>
                </div>

                {/* Quote */}
                {selectedPaper.quotedPrice && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Orçamento</h3>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          R$ {(selectedPaper.quotedPrice / 100).toFixed(2)}
                        </p>
                        {selectedPaper.adminNotes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {selectedPaper.adminNotes}
                          </p>
                        )}
                        {selectedPaper.status === 'QUOTED' && (
                          <Button
                            className="mt-4"
                            onClick={handleApproveQuote}
                            disabled={approveQuoteMutation.isPending}
                          >
                            Aprovar Orçamento
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Messages */}
                {selectedPaper.messages && selectedPaper.messages.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Mensagens</h3>
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-3">
                          {selectedPaper.messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                'p-3 rounded-lg',
                                message.isFromAdmin ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {message.isFromAdmin ? 'Admin' : 'Você'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.createdAt), 'dd/MM HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Send Message */}
                      <div className="mt-4 flex gap-2">
                        <Textarea
                          placeholder="Digite sua mensagem..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <Button
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={!messageContent.trim() || sendMessageMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Delivery Files */}
                {selectedPaper.status === 'COMPLETED' &&
                  selectedPaper.deliveryFiles &&
                  selectedPaper.deliveryFiles.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Arquivos do Trabalho</h3>
                        <div className="space-y-2">
                          {selectedPaper.deliveryFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">Trabalho Finalizado {index + 1}</span>
                              </div>
                              <Button size="sm" variant="outline" asChild>
                                <a href={file} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Success Message for Completed */}
                {selectedPaper.status === 'COMPLETED' && (
                  <Alert className="border-accent/20 bg-accent-subtle">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-accent-foreground">
                      Seu trabalho foi concluído com sucesso! Você pode baixar os arquivos acima.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
