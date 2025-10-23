import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Copy, CreditCard, ExternalLink, Loader2, QrCode, Receipt } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

const checkoutSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  cpfCnpj: z
    .string()
    .min(11, 'CPF/CNPJ deve ter pelo menos 11 dígitos')
    .max(14, 'CPF/CNPJ deve ter no máximo 14 dígitos')
    .regex(/^\d+$/, 'CPF/CNPJ deve conter apenas números'),
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  paymentMethod: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD'], {
    required_error: 'Selecione um método de pagamento',
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CartItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  type: string;
}

interface CheckoutData {
  items: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    type: string;
  }>;
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
  };
  paymentMethod: string;
}

type ToastFunction = (props: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => void;

interface FormInstance {
  control: import('react-hook-form').Control<CheckoutFormData>;
  handleSubmit: (fn: (data: CheckoutFormData) => void) => (e?: React.BaseSyntheticEvent) => void;
  watch: (name: string) => string;
}

const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

interface CheckoutResponse {
  orderId: string;
  chargeId?: string;
  paymentUrl?: string;
  pixQRCode?: string;
  pixCode?: string;
  boletoUrl?: string;
  status?: string;
  paymentMethod?: string;
  pix?: {
    payload: string;
    qrCodeImage: string;
    expirationDate: string;
  };
  boleto?: {
    url: string;
    barcode: string;
  };
}

interface OrderStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'APPROVED' | 'REFUSED';
}

// Custom hook for form initialization
function useCheckoutForm(user: User | null) {
  return useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      cpfCnpj: '',
      phone: '',
      paymentMethod: 'PIX',
    },
  });
}

// Custom hook for order status polling
function useOrderStatusPolling() {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startPolling = (orderId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get<OrderStatus>(`/orders/${orderId}`);
        setOrderStatus(response.data);

        if (response.data.paymentStatus === 'APPROVED') {
          clearInterval(interval);
          toast({
            title: 'Pagamento aprovado!',
            description: 'Seu pagamento foi confirmado com sucesso.',
          });
        } else if (response.data.paymentStatus === 'REFUSED') {
          clearInterval(interval);
          toast({
            title: 'Pagamento recusado',
            description: 'Houve um problema com seu pagamento. Tente novamente.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status do pedido:', error);
      }
    }, 5000);

    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  return { orderStatus, startPolling, stopPolling };
}

// Function to prepare checkout data
function prepareCheckoutData(items: CartItem[], data: CheckoutFormData) {
  // A API /checkout/create aceita apenas um item por vez
  const firstItem = items[0];

  const payload: any = {
    paymentMethod: data.paymentMethod,
    customer: {
      name: data.fullName,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      phone: data.phone,
    },
  };

  // Adicionar o ID do item baseado no tipo
  if (firstItem.type === 'course') {
    payload.courseId = firstItem.id;
  } else if (firstItem.type === 'ebook') {
    payload.ebookId = firstItem.id;
  } else if (firstItem.type === 'paper') {
    payload.paperId = firstItem.id;
  }

  return payload;
}

// Function to handle payment processing
async function processPayment(checkoutData: any): Promise<CheckoutResponse> {
  const response = await api.post<any>('/checkout/create', checkoutData);

  // Adaptar resposta para o formato esperado pelo componente
  const adaptedResponse: CheckoutResponse = {
    orderId: response.data.orderId,
    chargeId: response.data.chargeId,
    paymentMethod: response.data.paymentMethod,
    status: response.data.status,
  };

  // Mapear dados do PIX
  if (response.data.pix) {
    adaptedResponse.pixCode = response.data.pix.payload;
    // Adicionar prefixo data:image para o base64 do QR Code
    adaptedResponse.pixQRCode = `data:image/png;base64,${response.data.pix.qrCodeImage}`;
    adaptedResponse.pix = response.data.pix;
  }

  // Mapear dados do Boleto
  if (response.data.boleto) {
    adaptedResponse.boletoUrl = response.data.boleto.url;
    adaptedResponse.boleto = response.data.boleto;
  }

  return adaptedResponse;
}

// Function to handle copy PIX code
function copyPixCodeToClipboard(pixCode: string | undefined, toast: ToastFunction) {
  if (pixCode) {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: 'Código PIX copiado!',
      description: 'Cole o código no seu aplicativo bancário.',
    });
  }
}

// Component for Payment Status Display
function PaymentStatusDisplay({ orderStatus }: { orderStatus: OrderStatus | null }) {
  if (!orderStatus) return null;

  return (
    <div className="p-4 rounded-lg bg-muted">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status do Pagamento:</span>
        <span
          className={`text-sm font-bold ${
            orderStatus.paymentStatus === 'APPROVED'
              ? 'text-green-600'
              : orderStatus.paymentStatus === 'REFUSED'
                ? 'text-red-600'
                : 'text-yellow-600'
          }`}
        >
          {orderStatus.paymentStatus === 'APPROVED'
            ? 'Aprovado'
            : orderStatus.paymentStatus === 'REFUSED'
              ? 'Recusado'
              : 'Aguardando Pagamento'}
        </span>
      </div>
    </div>
  );
}

// Component for PIX Payment Display
function PixPaymentDisplay({
  orderData,
  copyPixCode,
}: {
  orderData: CheckoutResponse | null;
  copyPixCode: () => void;
}) {
  if (!orderData?.pixCode && !orderData?.pixQRCode) return null;

  return (
    <div className="text-center space-y-4">
      {orderData.pixQRCode ? (
        <div className="p-4 bg-white rounded-lg mx-auto w-fit">
          <img src={orderData.pixQRCode} alt="QR Code PIX" className="w-48 h-48" />
        </div>
      ) : (
        <div className="w-48 h-48 bg-muted mx-auto rounded-lg flex items-center justify-center">
          <QrCode className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX</p>
      {orderData.pixCode && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono break-all">{orderData.pixCode}</p>
        </div>
      )}
      <Button onClick={copyPixCode} variant="outline" className="w-full">
        <Copy className="h-4 w-4 mr-2" />
        Copiar código PIX
      </Button>
    </div>
  );
}

// Component for Payment Actions
function PaymentActions({ orderData }: { orderData: CheckoutResponse | null }) {
  if (!orderData) return null;

  if (orderData.paymentMethod === 'BOLETO' && orderData.boletoUrl) {
    return (
      <div className="text-center">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(orderData.boletoUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Visualizar Boleto
        </Button>
      </div>
    );
  }

  if (
    (orderData.paymentMethod === 'CREDIT_CARD' || orderData.paymentMethod === 'DEBIT_CARD') &&
    orderData.paymentUrl
  ) {
    return (
      <div className="text-center">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(orderData.paymentUrl, '_blank')}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Ir para Pagamento
        </Button>
      </div>
    );
  }

  return null;
}

// Component for Order Confirmation
function OrderConfirmation({
  orderData,
  orderStatus,
  copyPixCode,
  navigate,
}: {
  orderData: CheckoutResponse | null;
  orderStatus: OrderStatus | null;
  copyPixCode: () => void;
  navigate: (path: string) => void;
}) {
  return (
    <div className="min-h-[50vh] bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Pedido Confirmado!</CardTitle>
          <CardDescription>
            Seu pedido #{orderData?.orderId} foi realizado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PaymentStatusDisplay orderStatus={orderStatus} />
          <PixPaymentDisplay orderData={orderData} copyPixCode={copyPixCode} />
          <PaymentActions orderData={orderData} />
          <Button onClick={() => navigate('/ready-papers')} className="w-full btn-hero">
            Voltar para a Loja
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for Customer Form Fields
function CustomerFormFields({ form }: { form: FormInstance }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Completo</FormLabel>
            <FormControl>
              <Input placeholder="Digite seu nome completo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="seu@email.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Component for Contact Form Fields
function ContactFormFields({ form }: { form: FormInstance }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="cpfCnpj"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CPF/CNPJ</FormLabel>
            <FormControl>
              <Input placeholder="00000000000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input placeholder="11999999999" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Component for Payment Method Selection
function PaymentMethodSelection({ form }: { form: FormInstance }) {
  return (
    <FormField
      control={form.control}
      name="paymentMethod"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Método de Pagamento</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="PIX" id="pix" />
                <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                  <QrCode className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">PIX</span>
                    <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="BOLETO" id="boleto" />
                <Label htmlFor="boleto" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">Boleto</span>
                    <p className="text-xs text-muted-foreground">Vencimento em 3 dias</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="CREDIT_CARD" id="credit_card" />
                <Label
                  htmlFor="credit_card"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">Cartão de Crédito</span>
                    <p className="text-xs text-muted-foreground">Parcelamento disponível</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="DEBIT_CARD" id="debit_card" />
                <Label
                  htmlFor="debit_card"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">Cartão de Débito</span>
                    <p className="text-xs text-muted-foreground">Pagamento à vista</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
          {(form.watch('paymentMethod') === 'CREDIT_CARD' ||
            form.watch('paymentMethod') === 'DEBIT_CARD') && (
            <p className="text-xs text-muted-foreground mt-2">
              Após confirmar o pedido, você será redirecionado para a página de pagamento seguro.
            </p>
          )}
        </FormItem>
      )}
    />
  );
}

// Component for Order Summary
function OrderSummary({ items, cartTotal }: { items: CartItem[]; cartTotal: number }) {
  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div className="flex-1">
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
              </div>
              <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(cartTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for Form Actions
function FormActions({
  isProcessing,
  navigate,
}: {
  isProcessing: boolean;
  navigate: (path: number) => void;
}) {
  return (
    <div className="flex gap-4 pt-4">
      <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
        Voltar
      </Button>
      <Button type="submit" disabled={isProcessing} className="flex-1 btn-hero">
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          'Finalizar Compra'
        )}
      </Button>
    </div>
  );
}

// Component for Empty Cart
function EmptyCart({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="min-h-[50vh] bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Carrinho Vazio</CardTitle>
          <CardDescription>Adicione itens ao carrinho antes de finalizar a compra.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/ready-papers')} className="w-full btn-hero">
            Continuar Comprando
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, cartTotal, clearCart, validateCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderData, setOrderData] = useState<CheckoutResponse | null>(null);

  const form = useCheckoutForm(user);
  const { orderStatus, startPolling, stopPolling } = useOrderStatusPolling();

  // Early return for empty cart
  if (items.length === 0 && !orderConfirmed) {
    return <EmptyCart navigate={navigate} />;
  }

  useEffect(() => {
    validateCart();
  }, [validateCart]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleFormSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione itens ao carrinho antes de finalizar a compra.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const checkoutData = prepareCheckoutData(items, data);
      const result = await processPayment(checkoutData);

      setOrderData(result);
      setOrderConfirmed(true);
      clearCart();
      startPolling(result.orderId);

      toast({
        title: 'Pedido realizado com sucesso!',
        description: `Pedido #${result.orderId} confirmado.`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description:
          error.response?.data?.message || 'Erro ao processar o pedido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPixCode = () => {
    copyPixCodeToClipboard(orderData?.pixCode, toast);
  };

  if (orderConfirmed) {
    return (
      <OrderConfirmation
        orderData={orderData}
        orderStatus={orderStatus}
        copyPixCode={handleCopyPixCode}
        navigate={navigate}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-subtle py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Finalizar Compra</h1>
            <p className="text-muted-foreground">Preencha seus dados para completar o pedido</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                    <CustomerFormFields form={form} />
                    <ContactFormFields form={form} />
                    <Separator />
                    <PaymentMethodSelection form={form} />
                    <FormActions isProcessing={isProcessing} navigate={navigate} />
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary items={items} cartTotal={cartTotal} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
