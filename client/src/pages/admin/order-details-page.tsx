import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { Order } from '@/types/order';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  processing: { label: 'Processando', variant: 'default' as const },
  completed: { label: 'Concluído', variant: 'default' as const },
  canceled: { label: 'Cancelado', variant: 'destructive' as const },
};

const paymentMethodMap = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
};

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        // Buscar pedido da API
        const response = await api.get(`/admin/orders/${id}`);
        if (response.data) {
          setOrder(response.data);
        } else {
          toast({
            title: 'Pedido não encontrado',
            description: 'O pedido solicitado não existe.',
            variant: 'destructive',
          });
          navigate('/admin/pedidos');
        }
      } catch (error: any) {
        console.error('[ORDER DETAILS] Error loading order:', error);
        if (error.response?.status === 404) {
          toast({
            title: 'Pedido não encontrado',
            description: 'O pedido solicitado não existe.',
            variant: 'destructive',
          });
          navigate('/admin/pedidos');
        } else {
          toast({
            title: 'Erro ao carregar pedido',
            description: 'Não foi possível carregar os detalhes do pedido.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, toast]);

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amountInCents / 100);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setIsUpdatingStatus(true);

    try {
      // Atualizar status na API
      await api.put(`/admin/orders/${order.id}/status`, {
        status: newStatus.toUpperCase()
      });

      // Update local state
      setOrder({ ...order, status: newStatus.toUpperCase() as Order['status'] });

      toast({
        title: 'Sucesso',
        description: 'Status do pedido atualizado com sucesso',
      });
    } catch (error: any) {
      console.error('[ORDER DETAILS] Error updating status:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao atualizar status do pedido',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendNotification = () => {
    if (!order) return;

    const subject = encodeURIComponent(`Atualização do seu pedido #${order.id}`);
    const body = encodeURIComponent(
      `Olá ${order.customerName},\n\nSeu pedido #${order.id} teve o status atualizado para: ${statusMap[order.status.toLowerCase()].label}\n\nAtenciosamente,\nEquipe LN Educacional`
    );

    window.open(`mailto:${order.customerEmail}?subject=${subject}&body=${body}`);

    toast({
      title: 'Cliente de email aberto',
      description: 'Rascunho de e-mail de notificação foi preparado no seu cliente de email padrão',
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="animate-fade-in">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !order ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Pedido não encontrado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">Pedido #{order.id}</h1>
                      <p className="text-muted-foreground">
                        Detalhes do pedido e informações do cliente
                      </p>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nome:</span>
                          <p className="font-medium">{order.customerName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{order.customerEmail}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CPF/CNPJ:</span>
                          <p className="font-medium">{order.customerCpfCnpj}</p>
                        </div>
                        {order.customerPhone && (
                          <div>
                            <span className="text-muted-foreground">Telefone:</span>
                            <p className="font-medium">{order.customerPhone}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="mt-1">
                            <Badge variant={statusMap[order.status.toLowerCase()].variant}>
                              {statusMap[order.status.toLowerCase()].label}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <p className="font-medium text-lg">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Data:</span>
                          <p className="font-medium">
                            {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {order.paymentMethod && (
                          <div>
                            <span className="text-muted-foreground">Método de Pagamento:</span>
                            <p className="font-medium">{paymentMethodMap[order.paymentMethod]}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Itens do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              </div>
                              <div className="ml-4">
                                <span className="font-medium">{formatCurrency(item.price)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ações</CardTitle>
                      <CardDescription>Gerencie o status e envie notificações</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Select
                          value={order.status.toLowerCase()}
                          onValueChange={handleStatusUpdate}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Atualizar Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="canceled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          onClick={handleSendNotification}
                          className="flex items-center gap-2 w-full"
                        >
                          <Mail className="h-4 w-4" />
                          Enviar Notificação
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OrderDetailsPage;
