import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import contactService, { type Message } from '@/services/contact.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

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
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  Reply,
  Search,
  Trash2,
  User,
} from 'lucide-react';

const STATUS_LABELS = {
  UNREAD: { label: 'Não Lida', color: 'bg-yellow-500' },
  READ: { label: 'Lida', color: 'bg-blue-500' },
  ARCHIVED: { label: 'Arquivada', color: 'bg-gray-500' },
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await contactService.getMessages({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortOrder,
      });
      setMessages(response.items || []);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.response?.data?.error || 'Erro ao carregar lista de mensagens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, dateFrom, dateTo, sortBy, sortOrder, toast]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(messages.map(msg => msg.id));
    } else {
      setSelectedMessages([]);
    }
  };

  const handleSelectMessage = (messageId: string, checked: boolean) => {
    if (checked) {
      setSelectedMessages(prev => [...prev, messageId]);
    } else {
      setSelectedMessages(prev => prev.filter(id => id !== messageId));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: 'READ' | 'ARCHIVED') => {
    if (selectedMessages.length === 0) return;

    setUpdatingStatus(true);
    try {
      // Since we don't have a bulk update endpoint, we'll update them one by one
      await Promise.all(
        selectedMessages.map(id => contactService.updateMessageStatus(id, newStatus))
      );

      toast({
        title: 'Status atualizado',
        description: `${selectedMessages.length} mensagens foram marcadas como ${newStatus === 'read' ? 'lidas' : 'arquivadas'}.`,
      });

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          selectedMessages.includes(msg.id) ? { ...msg, status: newStatus } : msg
        )
      );

      setSelectedMessages([]);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Erro ao atualizar status das mensagens selecionadas',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExportToCSV = () => {
    const csvHeaders = ['Nome', 'Email', 'Assunto', 'Mensagem', 'Status', 'Data'];
    const csvData = messages.map(msg => [
      msg.name,
      msg.email,
      msg.subject,
      msg.message.replace(/\n/g, ' '), // Remove line breaks
      STATUS_LABELS[msg.status as keyof typeof STATUS_LABELS].label,
      format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mensagens_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportação concluída',
      description: 'O arquivo CSV foi baixado com sucesso.',
    });
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleStatusUpdate = async (id: string, newStatus: 'UNREAD' | 'READ' | 'ARCHIVED') => {
    setUpdatingStatus(true);
    try {
      await contactService.updateMessageStatus(id, newStatus);

      toast({
        title: 'Status atualizado',
        description: 'O status da mensagem foi atualizado com sucesso.',
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus } : msg))
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.response?.data?.error || 'Erro ao atualizar status da mensagem',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  const openDetails = async (message: Message) => {
    setSelectedMessage(message);
    setIsDetailsOpen(true);
    setReplyText('');

    // Mark as read if unread
    if (message.status === 'UNREAD') {
      await handleStatusUpdate(message.id, 'READ');
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;

    // Open email client with pre-filled reply
    const subject = encodeURIComponent(`Re: ${selectedMessage.subject}`);
    const body = encodeURIComponent(replyText);
    window.open(`mailto:${selectedMessage.email}?subject=${subject}&body=${body}`);

    toast({
      title: 'Email aberto',
      description: 'Seu cliente de email foi aberto com a resposta pré-preenchida.',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return <Clock className="h-4 w-4" />;
      case 'READ':
        return <CheckCircle className="h-4 w-4" />;
      case 'ARCHIVED':
        return <Archive className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mensagens</h1>
        <p className="text-muted-foreground">
          Gerencie as mensagens recebidas através do formulário de contato
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {messages.filter((m) => m.status === 'UNREAD').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {messages.filter((m) => m.status === 'READ').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Arquivadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {messages.filter((m) => m.status === 'ARCHIVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email ou assunto..."
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
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="UNREAD">Não Lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="ARCHIVED">Arquivadas</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>

          {/* Advanced Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <div>
                <Label htmlFor="dateFrom" className="text-sm">Data inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-sm">Data final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Ordem</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedMessages.length > 0 && (
            <div className="flex gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedMessages.length} mensagem(ns) selecionada(s):
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('read')}
                disabled={updatingStatus}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Marcar como lidas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('ARCHIVED')}
                disabled={updatingStatus}
              >
                <Archive className="h-4 w-4 mr-1" />
                Arquivar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens</CardTitle>
          <CardDescription>Lista de todas as mensagens recebidas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedMessages.length === messages.length && messages.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id} className={msg.status === 'UNREAD' ? 'font-semibold' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMessages.includes(msg.id)}
                        onCheckedChange={(checked) => handleSelectMessage(msg.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_LABELS[msg.status as keyof typeof STATUS_LABELS].color}
                      >
                        {getStatusIcon(msg.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{msg.name}</TableCell>
                    <TableCell>{msg.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{msg.subject}</TableCell>
                    <TableCell>
                      {format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetails(msg)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(msg.id, 'read')}
                              disabled={msg.status === 'read'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como lida
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(msg.id, 'ARCHIVED')}
                              disabled={msg.status === 'ARCHIVED'}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
            <DialogDescription>Informações completas da mensagem recebida</DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Remetente</Label>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedMessage.name}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    className={`mt-1 ${STATUS_LABELS[selectedMessage.status as keyof typeof STATUS_LABELS].color}`}
                  >
                    {STATUS_LABELS[selectedMessage.status as keyof typeof STATUS_LABELS].label}
                  </Badge>
                </div>

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedMessage.email}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Data de Recebimento</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedMessage.createdAt), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground">Assunto</Label>
                  <p className="font-medium mt-1">{selectedMessage.subject}</p>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground">Mensagem</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Resposta Rápida</Label>
                <Textarea
                  placeholder="Digite sua resposta aqui..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedMessage.id, 'UNREAD')}
                    disabled={updatingStatus || selectedMessage.status === 'UNREAD'}
                  >
                    Marcar como Não Lida
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedMessage.id, 'READ')}
                    disabled={updatingStatus || selectedMessage.status === 'READ'}
                  >
                    Marcar como Lida
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedMessage.id, 'ARCHIVED')}
                    disabled={updatingStatus || selectedMessage.status === 'ARCHIVED'}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Arquivar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Responder por Email
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
