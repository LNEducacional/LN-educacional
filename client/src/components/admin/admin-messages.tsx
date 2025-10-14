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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import contactService, { type Message } from '@/services/contact.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Mail, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const contactStatusMap = {
  UNREAD: { label: 'Não lida', variant: 'destructive' as const },
  READ: { label: 'Lida', variant: 'default' as const },
  ARCHIVED: { label: 'Arquivada', variant: 'secondary' as const },
};

type ContactSortField = 'createdAt' | 'name' | 'subject' | 'status';
type SortOrder = 'asc' | 'desc';

export function AdminMessages() {
  const { toast } = useToast();

  const [contactMessages, setContactMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Message | null>(null);
  const [deleteContact, setDeleteContact] = useState<Message | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  // Contact filters
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Contact sorting and pagination
  const [contactSortField, setContactSortField] = useState<ContactSortField>('createdAt');
  const [contactSortOrder, setContactSortOrder] = useState<SortOrder>('desc');
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const contactItemsPerPage = 10;

  // Buscar mensagens do backend
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await contactService.getMessages({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchFilter || undefined,
      });
      setContactMessages(result.items || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mensagens',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchFilter, toast]);

  // Carregar mensagens ao montar componente
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handler para alternar ordenação de contato
  const handleContactSort = (field: ContactSortField) => {
    if (contactSortField === field) {
      setContactSortOrder(contactSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setContactSortField(field);
      setContactSortOrder('asc');
    }
  };

  // Filter and sort contact messages
  const filteredAndSortedContactMessages = useMemo(() => {
    let filtered = contactMessages.filter((message) => {
      const matchesSearch =
        searchFilter === '' ||
        message.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        message.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
        message.subject.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const messageDate = new Date(message.createdAt);
        const diffInDays = Math.floor(
          (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (dateFilter) {
          case 'today':
            matchesDate = diffInDays === 0;
            break;
          case 'week':
            matchesDate = diffInDays <= 7;
            break;
          case 'month':
            matchesDate = diffInDays <= 30;
            break;
          case '3months':
            matchesDate = diffInDays <= 90;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (contactSortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'subject':
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        case 'status':
          aValue = contactStatusMap[a.status].label.toLowerCase();
          bValue = contactStatusMap[b.status].label.toLowerCase();
          break;
      }

      if (aValue < bValue) return contactSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return contactSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contactMessages, searchFilter, statusFilter, dateFilter, contactSortField, contactSortOrder]);

  // Paginação de contato
  const contactTotalPages = Math.ceil(filteredAndSortedContactMessages.length / contactItemsPerPage);
  const paginatedContactMessages = useMemo(() => {
    const startIndex = (contactCurrentPage - 1) * contactItemsPerPage;
    const endIndex = startIndex + contactItemsPerPage;
    return filteredAndSortedContactMessages.slice(startIndex, endIndex);
  }, [filteredAndSortedContactMessages, contactCurrentPage, contactItemsPerPage]);

  // Reset para página 1 quando filtros mudarem
  useMemo(() => {
    setContactCurrentPage(1);
  }, [searchFilter, statusFilter, dateFilter]);

  const handleContactOpen = async (message: Message) => {
    setSelectedContact(message);
    if (message.status === 'UNREAD') {
      // Mark as read
      try {
        await contactService.updateMessageStatus(message.id, 'READ');
        setContactMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, status: 'READ' } : m))
        );
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    }
  };

  const handleContactReply = () => {
    if (!selectedContact || !replyMessage.trim()) return;

    // Open email client
    const subject = encodeURIComponent(`Re: ${selectedContact.subject}`);
    const body = encodeURIComponent(replyMessage);
    window.open(`mailto:${selectedContact.email}?subject=${subject}&body=${body}`);

    toast({
      title: 'Sucesso',
      description: 'Cliente de email aberto com sucesso',
    });

    setSelectedContact(null);
    setReplyMessage('');
  };

  const handleContactDelete = async () => {
    if (!deleteContact) return;

    setIsDeleting(true);

    try {
      // Como não há endpoint de delete, vamos apenas arquivar
      await contactService.updateMessageStatus(deleteContact.id, 'ARCHIVED');

      setContactMessages((prev) => prev.filter((m) => m.id !== deleteContact.id));

      toast({
        title: 'Sucesso',
        description: 'Mensagem arquivada com sucesso',
      });

      setDeleteContact(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar mensagem',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const unreadContactCount = contactMessages.filter((m) => m.status === 'UNREAD').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
        <p className="text-muted-foreground">
          Gerencie todas as mensagens de contato recebidas através do formulário
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactMessages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {unreadContactCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Arquivadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {contactMessages.filter((m) => m.status === 'ARCHIVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Use os filtros abaixo para encontrar mensagens específicas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou assunto..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="UNREAD">Não lida</SelectItem>
                <SelectItem value="READ">Lida</SelectItem>
                <SelectItem value="ARCHIVED">Arquivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Messages Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : filteredAndSortedContactMessages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma mensagem encontrada.</p>
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
                        onClick={() => handleContactSort('createdAt')}
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
                        onClick={() => handleContactSort('name')}
                        className="h-8 font-medium gap-0.5"
                      >
                        De
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactSort('subject')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Assunto
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Mensagem</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactSort('status')}
                        className="h-8 font-medium gap-0.5"
                      >
                        Status
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContactMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{message.name}</div>
                        <div className="text-sm text-muted-foreground">{message.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="truncate max-w-[200px] block" title={message.subject}>
                        {message.subject}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="truncate max-w-[300px] block" title={message.message}>
                        {message.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contactStatusMap[message.status].variant}>
                        {contactStatusMap[message.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactOpen(message)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteContact(message)}
                          title="Arquivar"
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
          <div className="mt-4 px-6 pb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredAndSortedContactMessages.length > 0 ? ((contactCurrentPage - 1) * contactItemsPerPage) + 1 : 0} a{' '}
              {Math.min(contactCurrentPage * contactItemsPerPage, filteredAndSortedContactMessages.length)} de{' '}
              {filteredAndSortedContactMessages.length} mensagem(ns)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setContactCurrentPage(1)}
                disabled={contactCurrentPage === 1}
                className="h-8 w-8"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setContactCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={contactCurrentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setContactCurrentPage((prev) => Math.min(prev + 1, contactTotalPages))}
                disabled={contactCurrentPage === contactTotalPages || contactTotalPages === 0}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setContactCurrentPage(contactTotalPages)}
                disabled={contactCurrentPage === contactTotalPages || contactTotalPages === 0}
                className="h-8 w-8"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Message Modal */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContact?.subject}</DialogTitle>
            <DialogDescription>
              Recebida em{' '}
              {selectedContact &&
                format(new Date(selectedContact.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">De:</span>
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => window.open(`mailto:${selectedContact.email}`)}
                >
                  {selectedContact.name}
                </Badge>
                <a
                  href={`mailto:${selectedContact.email}`}
                  className="text-primary hover:underline text-sm"
                >
                  {selectedContact.email}
                </a>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Mensagem:</div>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reply-textarea" className="text-sm font-medium">
                  Resposta:
                </label>
                <Textarea
                  id="reply-textarea"
                  placeholder="Escreva sua resposta..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedContact(null)}>
              Fechar
            </Button>
            <Button
              onClick={handleContactReply}
              disabled={!replyMessage.trim()}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Responder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Modal */}
      <AlertDialog
        open={!!deleteContact}
        onOpenChange={() => !isDeleting && setDeleteContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Arquivamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar a mensagem de <strong>{deleteContact?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContactDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Arquivando...' : 'Arquivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
