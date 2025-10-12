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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { mockChatMessages, mockContactMessages } from '@/data/mock-messages';
import { useToast } from '@/hooks/use-toast';
import type { ChatSupportMessage, ContactMessage } from '@/types/message';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Mail, MessageSquare, Search, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const contactStatusMap = {
  unread: { label: 'Não lida', variant: 'destructive' as const },
  read: { label: 'Lida', variant: 'default' as const },
  replied: { label: 'Respondida', variant: 'default' as const },
};

type ContactSortField = 'createdAt' | 'name' | 'subject' | 'status';
type ChatSortField = 'createdAt' | 'userName' | 'messageCount' | 'unreadCount';
type SortOrder = 'asc' | 'desc';

export function AdminMessages() {
  const { toast } = useToast();

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(mockContactMessages);
  const [chatMessages, setChatMessages] = useState<ChatSupportMessage[]>(mockChatMessages);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatSupportMessage | null>(null);
  const [deleteContact, setDeleteContact] = useState<ContactMessage | null>(null);
  const [deleteChat, setDeleteChat] = useState<ChatSupportMessage | null>(null);

  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [chatReply, setChatReply] = useState('');

  // Contact filters
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Chat filters
  const [chatSearchFilter, setChatSearchFilter] = useState('');
  const [chatDateFilter, setChatDateFilter] = useState('all');
  const [chatUnreadFilter, setChatUnreadFilter] = useState('all');

  // Contact sorting and pagination
  const [contactSortField, setContactSortField] = useState<ContactSortField>('createdAt');
  const [contactSortOrder, setContactSortOrder] = useState<SortOrder>('desc');
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const contactItemsPerPage = 10;

  // Chat sorting and pagination
  const [chatSortField, setChatSortField] = useState<ChatSortField>('createdAt');
  const [chatSortOrder, setChatSortOrder] = useState<SortOrder>('desc');
  const [chatCurrentPage, setChatCurrentPage] = useState(1);
  const chatItemsPerPage = 10;

  // Handler para alternar ordenação de contato
  const handleContactSort = (field: ContactSortField) => {
    if (contactSortField === field) {
      setContactSortOrder(contactSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setContactSortField(field);
      setContactSortOrder('asc');
    }
  };

  // Handler para alternar ordenação de chat
  const handleChatSort = (field: ChatSortField) => {
    if (chatSortField === field) {
      setChatSortOrder(chatSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setChatSortField(field);
      setChatSortOrder('asc');
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

  const handleContactOpen = (message: ContactMessage) => {
    setSelectedContact(message);
    if (message.status === 'unread') {
      // Mark as read
      setContactMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, status: 'read' } : m))
      );
    }
  };

  const handleContactReply = async () => {
    if (!selectedContact || !replyMessage.trim()) return;

    setIsReplying(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mark as replied
      setContactMessages((prev) =>
        prev.map((m) => (m.id === selectedContact.id ? { ...m, status: 'replied' } : m))
      );

      // Open email client
      const subject = encodeURIComponent(`Re: ${selectedContact.subject}`);
      const body = encodeURIComponent(replyMessage);
      window.open(`mailto:${selectedContact.email}?subject=${subject}&body=${body}`);

      toast({
        title: 'Sucesso',
        description: 'Email enviado com sucesso',
      });

      setSelectedContact(null);
      setReplyMessage('');
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar email',
        variant: 'destructive',
      });
    } finally {
      setIsReplying(false);
    }
  };

  const handleContactDelete = async () => {
    if (!deleteContact) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setContactMessages((prev) => prev.filter((m) => m.id !== deleteContact.id));

      toast({
        title: 'Sucesso',
        description: 'Mensagem deletada com sucesso',
      });

      setDeleteContact(null);
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar mensagem',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChatReply = async () => {
    if (!selectedChat || !chatReply.trim()) return;

    setIsReplying(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Add new message to chat
      const newMessage = {
        id: Date.now(),
        content: chatReply,
        createdAt: new Date(),
        senderId: 'admin',
        isRead: true,
      };

      setChatMessages((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                messages: [...chat.messages, newMessage],
                messageCount: chat.messageCount + 1,
                latestMessage: {
                  content: chatReply,
                  createdAt: new Date(),
                  senderName: 'Admin',
                },
              }
            : chat
        )
      );

      // Update selected chat
      setSelectedChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessage],
              messageCount: prev.messageCount + 1,
              latestMessage: {
                content: chatReply,
                createdAt: new Date(),
                senderName: 'Admin',
              },
            }
          : null
      );

      toast({
        title: 'Sucesso',
        description: 'Resposta enviada com sucesso!',
      });

      setChatReply('');
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar resposta',
        variant: 'destructive',
      });
    } finally {
      setIsReplying(false);
    }
  };

  const handleChatDelete = async () => {
    if (!deleteChat) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setChatMessages((prev) => prev.filter((c) => c.id !== deleteChat.id));

      toast({
        title: 'Sucesso',
        description: 'Chat deletado com sucesso',
      });

      setDeleteChat(null);
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar chat',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort chat messages
  const filteredAndSortedChatMessages = useMemo(() => {
    let filtered = chatMessages.filter((chat) => {
      const matchesSearch =
        chatSearchFilter === '' ||
        (chat.userInfo.name && chat.userInfo.name.toLowerCase().includes(chatSearchFilter.toLowerCase())) ||
        (chat.userInfo.email && chat.userInfo.email.toLowerCase().includes(chatSearchFilter.toLowerCase()));

      const matchesUnread =
        chatUnreadFilter === 'all' ||
        (chatUnreadFilter === 'unread' && chat.unreadCount > 0) ||
        (chatUnreadFilter === 'read' && chat.unreadCount === 0);

      let matchesDate = true;
      if (chatDateFilter !== 'all') {
        const now = new Date();
        const chatDate = new Date(chat.createdAt);
        const diffInDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (chatDateFilter) {
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

      return matchesSearch && matchesUnread && matchesDate;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (chatSortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'userName':
          aValue = (a.userInfo.name || '').toLowerCase();
          bValue = (b.userInfo.name || '').toLowerCase();
          break;
        case 'messageCount':
          aValue = a.messageCount;
          bValue = b.messageCount;
          break;
        case 'unreadCount':
          aValue = a.unreadCount;
          bValue = b.unreadCount;
          break;
      }

      if (aValue < bValue) return chatSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return chatSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [chatMessages, chatSearchFilter, chatUnreadFilter, chatDateFilter, chatSortField, chatSortOrder]);

  // Paginação de chat
  const chatTotalPages = Math.ceil(filteredAndSortedChatMessages.length / chatItemsPerPage);
  const paginatedChatMessages = useMemo(() => {
    const startIndex = (chatCurrentPage - 1) * chatItemsPerPage;
    const endIndex = startIndex + chatItemsPerPage;
    return filteredAndSortedChatMessages.slice(startIndex, endIndex);
  }, [filteredAndSortedChatMessages, chatCurrentPage, chatItemsPerPage]);

  // Reset para página 1 quando filtros mudarem
  useMemo(() => {
    setChatCurrentPage(1);
  }, [chatSearchFilter, chatUnreadFilter, chatDateFilter]);

  const unreadContactCount = contactMessages.filter((m) => m.status === 'unread').length;
  const unreadChatCount = chatMessages.reduce((acc, chat) => acc + chat.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
        <p className="text-muted-foreground">
          Gerencie todas as mensagens de contato e chat da plataforma
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contato ({contactMessages.length})
            {unreadContactCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadContactCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat ({chatMessages.length})
            {unreadChatCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadChatCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
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
                    <SelectItem value="unread">Não lida</SelectItem>
                    <SelectItem value="read">Lida</SelectItem>
                    <SelectItem value="replied">Respondida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Messages Table */}
          <Card>
            <CardContent className="p-0">
              {filteredAndSortedContactMessages.length === 0 ? (
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
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          {/* Chat Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Use os filtros abaixo para encontrar conversas específicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={chatSearchFilter}
                    onChange={(e) => setChatSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={chatDateFilter} onValueChange={setChatDateFilter}>
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
                <Select value={chatUnreadFilter} onValueChange={setChatUnreadFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Leitura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="unread">Com não lidas</SelectItem>
                    <SelectItem value="read">Todas lidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {filteredAndSortedChatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma conversa de chat encontrada.</p>
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
                            onClick={() => handleChatSort('userName')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Cliente
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden md:table-cell">Última Mensagem</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChatSort('messageCount')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Mensagens
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChatSort('unreadCount')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Não Lidas
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChatSort('createdAt')}
                            className="h-8 font-medium gap-0.5"
                          >
                            Criado em
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedChatMessages.map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell className="font-medium">
                          {chat.userInfo.name || 'Cliente'}
                        </TableCell>
                        <TableCell>{chat.userInfo.email || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <span
                              className="truncate max-w-[200px] block"
                              title={chat.latestMessage.content}
                            >
                              {chat.latestMessage.content}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(chat.latestMessage.createdAt), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{chat.messageCount}</Badge>
                        </TableCell>
                        <TableCell>
                          {chat.unreadCount > 0 ? (
                            <Badge variant="destructive">{chat.unreadCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(chat.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedChat(chat)}
                              title="Ver Chat"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteChat(chat)}
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
              <div className="mt-4 px-6 pb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredAndSortedChatMessages.length > 0 ? ((chatCurrentPage - 1) * chatItemsPerPage) + 1 : 0} a{' '}
                  {Math.min(chatCurrentPage * chatItemsPerPage, filteredAndSortedChatMessages.length)} de{' '}
                  {filteredAndSortedChatMessages.length} conversa(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setChatCurrentPage(1)}
                    disabled={chatCurrentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setChatCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={chatCurrentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setChatCurrentPage((prev) => Math.min(prev + 1, chatTotalPages))}
                    disabled={chatCurrentPage === chatTotalPages || chatTotalPages === 0}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setChatCurrentPage(chatTotalPages)}
                    disabled={chatCurrentPage === chatTotalPages || chatTotalPages === 0}
                    className="h-8 w-8"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              disabled={isReplying || !replyMessage.trim()}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {isReplying ? 'Enviando...' : 'Responder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Conversa com {selectedChat?.userInfo.name || 'Cliente'}</DialogTitle>
            <DialogDescription>{selectedChat?.userInfo.email}</DialogDescription>
          </DialogHeader>

          {selectedChat && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
                {selectedChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 block mt-1">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="space-y-2 mt-4">
                <label htmlFor="chat-reply-textarea" className="text-sm font-medium">
                  Resposta:
                </label>
                <Textarea
                  id="chat-reply-textarea"
                  placeholder="Digite sua resposta..."
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChat(null)}>
              Fechar
            </Button>
            <Button
              onClick={handleChatReply}
              disabled={isReplying || !chatReply.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isReplying ? 'Enviando...' : 'Enviar Resposta'}
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
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a mensagem de <strong>{deleteContact?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContactDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Chat Modal */}
      <AlertDialog open={!!deleteChat} onOpenChange={() => !isDeleting && setDeleteChat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta conversa de chat? Esta ação é irreversível...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChatDelete}
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
