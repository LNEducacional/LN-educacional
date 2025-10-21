import { useState } from 'react';
import api from '@/services/api';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

export interface CheckoutData {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    mobilePhone?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    province?: string;
  };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  installments?: number;
  // Dados de registro para usuários não autenticados
  registration?: {
    password: string;
  };
}

export interface CheckoutResponse {
  success: boolean;
  orderId: string;
  chargeId: string;
  status?: string;
  paymentMethod: string;
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

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutResponse, setCheckoutResponse] = useState<CheckoutResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  const processCheckout = async (data: CheckoutData): Promise<CheckoutResponse | null> => {
    setIsLoading(true);
    try {
      const response = await api.post<any>('/checkout/create', {
        courseId: data.courseId,
        paymentMethod: data.paymentMethod,
        customer: data.customer,
        creditCard: data.creditCard,
        installments: data.installments,
        registration: data.registration,
      });

      // Se retornou token (novo usuário), fazer login automático
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você já está logado e pode acessar seus cursos.',
        });
      }

      setCheckoutResponse(response.data);

      // Se pagamento com cartão foi aprovado, redirecionar
      if (data.paymentMethod === 'CREDIT_CARD' && (response.data.status === 'CONFIRMED' || response.data.status === 'RECEIVED')) {
        toast({
          title: 'Pagamento aprovado!',
          description: 'Você já pode acessar o curso.',
        });

        // Invalidar cache de cursos do usuário
        queryClient.invalidateQueries({ queryKey: ['student', 'enrollments'] });
        queryClient.invalidateQueries({ queryKey: ['student', 'courses'] });

        return response.data;
      }

      // Para PIX e Boleto, mostrar instruções
      if (data.paymentMethod === 'PIX') {
        toast({
          title: 'QR Code PIX gerado!',
          description: 'Escaneie o QR Code para completar o pagamento.',
        });
      } else if (data.paymentMethod === 'BOLETO') {
        toast({
          title: 'Boleto gerado!',
          description: 'Clique no link para visualizar e pagar o boleto.',
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro no pagamento',
        description: error.response?.data?.error || 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await api.get(`/checkout/status/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  };

  return {
    processCheckout,
    checkPaymentStatus,
    isLoading,
    checkoutResponse,
    setCheckoutResponse,
  };
}
