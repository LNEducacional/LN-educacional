import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, QrCode, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PixPaymentProps {
  data: {
    payload: string;
    qrCodeImage: string;
    expirationDate: string;
  };
  orderId: string;
  onPaymentConfirmed?: () => void;
}

export default function PixPayment({ data, orderId, onPaymentConfirmed }: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'confirmed'>('pending');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(data.payload);
    setCopied(true);
    toast({
      title: 'Código copiado!',
      description: 'Cole no app do seu banco para pagar.',
    });
    setTimeout(() => setCopied(false), 3000);
  };

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (paymentStatus === 'confirmed') return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/checkout/status/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const result = await response.json();

        if (result.paymentStatus === 'CONFIRMED') {
          setPaymentStatus('confirmed');

          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu acesso ao curso foi liberado.',
          });

          if (onPaymentConfirmed) {
            onPaymentConfirmed();
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Verificar a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);

    // Limpar ao desmontar
    return () => clearInterval(interval);
  }, [orderId, paymentStatus, navigate, toast, onPaymentConfirmed]);

  const expirationDate = new Date(data.expirationDate);

  // Se pagamento confirmado, mostrar tela de sucesso
  if (paymentStatus === 'confirmed') {
    return (
      <div className="text-center space-y-8 py-8">
        <div className="flex justify-center">
          <div className="relative">
            {/* Círculo com animação de pulso */}
            <div className="absolute inset-0 bg-accent-subtle dark:bg-accent/20 rounded-full animate-ping opacity-20"></div>
            <div className="relative h-24 w-24 bg-accent-subtle dark:bg-accent/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-accent dark:text-accent" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-3xl font-bold text-accent dark:text-accent">
            Pagamento Confirmado!
          </h3>
          <p className="text-lg text-foreground">
            Parabéns! Seu acesso ao curso foi liberado.
          </p>
          <p className="text-sm text-muted-foreground">
            Você já pode começar a estudar e acessar todo o conteúdo.
          </p>
        </div>

        <Button
          onClick={() => navigate('/student/courses')}
          size="lg"
          className="px-8 py-6 text-lg font-semibold"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Acessar Meus Cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex items-center justify-center gap-2 text-primary">
        <QrCode className="h-6 w-6" />
        <h3 className="text-xl font-bold">Pagamento via PIX</h3>
      </div>

      <div className="bg-white p-4 rounded-lg inline-block">
        <img
          src={`data:image/png;base64,${data.qrCodeImage}`}
          alt="QR Code PIX"
          className="w-64 h-64"
        />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Escaneie o QR Code acima com o app do seu banco
        </p>
        <p className="text-sm font-medium">
          ou copie o código abaixo:
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={data.payload}
          readOnly
          className="font-mono text-xs"
        />
        <Button onClick={handleCopy} size="icon" variant="outline">
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
        <p className="text-xs text-muted-foreground">
          Validade: {expirationDate.toLocaleString('pt-BR')}
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">Aguardando pagamento...</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Após o pagamento, seu acesso será liberado automaticamente.
        </p>
      </div>
    </div>
  );
}
