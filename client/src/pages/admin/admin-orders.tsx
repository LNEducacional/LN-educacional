import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  Loader2,
  Package,
  Search,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber?: string;
  userId?: string;
  user?: {
    name: string;
    email: string;
  };
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  discount?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'CANCELED' | 'REFUNDED' | 'INTERESTED';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
  paymentDetails?: {
    pixCode?: string;
    boletoUrl?: string;
    cardLast4?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productType: 'COURSE' | 'PAPER' | 'EBOOK';
  productTitle: string;
  price: number;
  quantity: number;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  todayRevenue: number;
}

export function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.paymentMethod = paymentFilter;

      const [ordersResponse, statsResponse] = await Promise.all([
        api.get('/admin/orders', { params }),
        api.get('/admin/orders/stats'),
      ]);

      // A API retorna { orders, total }
      setOrders(ordersResponse.data.orders || ordersResponse.data);
      setStats(statsResponse.data);
    } catch (_error) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Não foi possível carregar a lista de pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, paymentFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });

      toast({
        title: 'Status atualizado',
        description: 'O status do pedido foi atualizado com sucesso',
      });

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const response = await api.get(`/admin/orders/${orderId}`);
        setSelectedOrder(response.data);
      }
    } catch (_error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do pedido',
        variant: 'destructive',
      });
    }
  };

  const handleRefund = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/refund`);

      toast({
        title: 'Reembolso processado',
        description: 'O reembolso foi processado com sucesso',
      });

      fetchOrders();
    } catch (_error) {
      toast({
        title: 'Erro ao processar reembolso',
        description: 'Não foi possível processar o reembolso',
        variant: 'destructive',
      });
    }
  };

  const handleExportOrders = async () => {
    try {
      const response = await api.get('/admin/orders/export', {
        responseType: 'blob',
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pedidos-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Exportação concluída',
        description: 'Os pedidos foram exportados com sucesso',
      });
    } catch (_error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar os pedidos',
        variant: 'destructive',
      });
    }
  };

  const openDetailsDialog = async (order: Order) => {
    try {
      const response = await api.get(`/admin/orders/${order.id}`);
      setSelectedOrder(response.data);
      setIsDetailsDialogOpen(true);
    } catch (_error) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar os detalhes do pedido',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, label: 'Pendente', icon: Clock },
      PROCESSING: { variant: 'default' as const, label: 'Processando', icon: Package },
      COMPLETED: { variant: 'success' as const, label: 'Concluído', icon: CheckCircle },
      CANCELLED: { variant: 'destructive' as const, label: 'Cancelado', icon: XCircle },
      CANCELED: { variant: 'destructive' as const, label: 'Cancelado', icon: XCircle },
      REFUNDED: { variant: 'outline' as const, label: 'Reembolsado', icon: XCircle },
      INTERESTED: { variant: 'outline' as const, label: 'Interessado', icon: Clock },
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (method: string, status: string) => {
    const methodLabels = {
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
    };

    const statusVariants = {
      PENDING: 'secondary',
      PROCESSING: 'default',
      APPROVED: 'success',
      FAILED: 'destructive',
      REFUNDED: 'outline',
    } as const;

    return (
      <div className="flex items-center gap-2">
        <Badge variant={statusVariants[status as keyof typeof statusVariants]}>
          {methodLabels[method as keyof typeof methodLabels]}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie os pedidos realizados na plataforma</p>
        </div>
        <Button onClick={handleExportOrders}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.pending} pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.todayRevenue)}</div>
              <p className="text-xs text-muted-foreground">{stats.completed} concluídos</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número do pedido ou cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="PROCESSING">Processando</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                <SelectItem value="INTERESTED">Interessado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="BOLETO">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum pedido encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há pedidos com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">#{order.orderNumber || order.id.slice(-8)}</p>
                      {getStatusBadge(order.status)}
                      {order.paymentMethod && getPaymentBadge(order.paymentMethod, order.paymentStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {order.user?.name || order.customerName || 'N/A'} ({order.user?.email || order.customerEmail || 'N/A'})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="text-sm">
                        {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'itens'}
                      </p>
                      <p className="text-sm font-medium">Total: {formatPrice(order.total || order.totalAmount || 0)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Informações completas sobre o pedido</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status do Pedido</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status do Pagamento</p>
                  <div className="mt-1">
                    {getPaymentBadge(selectedOrder.paymentMethod, selectedOrder.paymentStatus)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data do Pedido</p>
                  <p className="mt-1">
                    {format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                  <p className="mt-1">
                    {format(new Date(selectedOrder.updatedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Informações do Cliente</h3>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">{selectedOrder.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Itens do Pedido</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.productTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            Tipo:{' '}
                            {item.productType === 'COURSE'
                              ? 'Curso'
                              : item.productType === 'PAPER'
                                ? 'Paper'
                                : 'E-book'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.price)}</p>
                          <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Resumo do Pagamento</h3>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="text-accent">-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.paymentDetails && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Detalhes do Pagamento</h3>
                  <div className="p-4 border rounded-lg">
                    {selectedOrder.paymentDetails.pixCode && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Código PIX</p>
                        <p className="mt-1 font-mono text-sm break-all">
                          {selectedOrder.paymentDetails.pixCode}
                        </p>
                      </div>
                    )}
                    {selectedOrder.paymentDetails.boletoUrl && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Boleto</p>
                        <a
                          href={selectedOrder.paymentDetails.boletoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Visualizar Boleto
                        </a>
                      </div>
                    )}
                    {selectedOrder.paymentDetails.cardLast4 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cartão</p>
                        <p className="mt-1">
                          **** **** **** {selectedOrder.paymentDetails.cardLast4}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <div className="space-x-2">
                  {selectedOrder.status === 'PENDING' && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                      >
                        Processar Pedido
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                      >
                        Cancelar Pedido
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'PROCESSING' && (
                    <Button
                      variant="default"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                    >
                      Marcar como Concluído
                    </Button>
                  )}
                  {selectedOrder.status === 'COMPLETED' &&
                    selectedOrder.paymentStatus === 'APPROVED' && (
                      <Button variant="outline" onClick={() => handleRefund(selectedOrder.id)}>
                        Processar Reembolso
                      </Button>
                    )}
                </div>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
