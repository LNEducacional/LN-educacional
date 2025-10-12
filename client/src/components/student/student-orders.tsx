import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useStudentOrders } from '@/hooks/use-student-orders';
import type { StudentOrder } from '@/types/student-order';
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Loader2,
  ShoppingBag,
  XCircle,
  Package,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusMap = {
  PENDING: {
    label: 'Pendente',
    icon: Clock,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
  },
  PROCESSING: {
    label: 'Processando',
    icon: Loader2,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Concluído',
    icon: CheckCircle,
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  CANCELED: {
    label: 'Cancelado',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
  },
};

const paymentMethodMap = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
};

const paymentStatusMap = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  REFUNDED: 'Reembolsado',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
};

export function StudentOrders() {
  const navigate = useNavigate();
  const { orders, isLoading } = useStudentOrders();

  const formatPrice = (priceInCents: number): string => {
    return (priceInCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Agrupar por status
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const processingOrders = orders.filter(o => o.status === 'PROCESSING');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const canceledOrders = orders.filter(o => o.status === 'CANCELED');

  // Calcular estatísticas
  const totalSpent = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    {
      label: 'Total de Pedidos',
      value: orders.length,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Pedidos Concluídos',
      value: completedOrders.length,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Total Gasto',
      value: formatPrice(totalSpent),
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (_orderId: string) => {
    // In a real app, this would navigate to order details page
  };

  const handleDownloadProducts = (_orderId: string) => {
    // In a real app, this would download the products
  };

  const handleViewItem = (_orderId: string, _itemTitle: string) => {
    // In a real app, this would view the specific item
  };

  const handleDownloadItem = (_orderId: string, _itemTitle: string) => {
    // In a real app, this would download the specific item
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOrders = (ordersToRender: StudentOrder[]) => (
    ordersToRender.length > 0 ? (
      <div className="space-y-4">
        {ordersToRender.map((order) => {
          const statusInfo = statusMap[order.status];
          const StatusIcon = statusInfo.icon;

          return (
            <Card
              key={order.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <Badge className={cn('flex items-center gap-1 w-fit', statusInfo.badgeClass)}>
                      <StatusIcon
                        className={`h-3 w-3 ${order.status === 'processing' ? 'animate-spin' : ''}`}
                      />
                      {statusInfo.label}
                    </Badge>
                    <div className="text-xl font-bold">{formatPrice(order.totalAmount)}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Order Items */}
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={`${order.id}-item-${index}-${item.title}`}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                            {item.price && (
                              <div className="text-sm font-medium mt-1">
                                {formatPrice(item.price)}
                              </div>
                            )}
                          </div>
                          {order.status === 'COMPLETED' && (
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewItem(order.id, item.title)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDownloadItem(order.id, item.title)}
                                className="gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Baixar
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Detalhes dos itens não disponíveis
                  </div>
                )}

                {/* Payment Information */}
                {order.paymentMethod && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Informações de Pagamento:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Método:</span>
                          <span className="font-medium">
                            {paymentMethodMap[order.paymentMethod]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Status do Pagamento:</span>
                          <span className="font-medium">
                            {paymentStatusMap[order.paymentStatus]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer Actions */}
                <Separator />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleViewDetails(order.id)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </Button>
                  {order.status === 'COMPLETED' && (
                    <Button
                      onClick={() => handleDownloadProducts(order.id)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Produtos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    ) : (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhum pedido nesta categoria</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Explore nossos produtos e faça seu primeiro pedido.
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="mt-4 gap-2">
              <ShoppingBag className="h-4 w-4" />
              Explorar Produtos
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe o status dos seus pedidos e baixe seus produtos
        </p>
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
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="processing">Processando ({processingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídos ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="canceled">Cancelados ({canceledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {renderOrders(orders)}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {renderOrders(pendingOrders)}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4 mt-6">
          {renderOrders(processingOrders)}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {renderOrders(completedOrders)}
        </TabsContent>

        <TabsContent value="canceled" className="space-y-4 mt-6">
          {renderOrders(canceledOrders)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
