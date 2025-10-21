import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, QrCode, Receipt, Check, Loader2 } from 'lucide-react';
import { useCheckout, type CheckoutData } from '@/hooks/use-checkout';
import { useAuth } from '@/context/auth-context';
import { formatPrice } from '@/utils/course-formatters';
import CreditCardForm from './credit-card-form';
import PixPayment from './pix-payment';
import BoletoPayment from './boleto-payment';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
}

export default function CheckoutModal({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  coursePrice,
}: CheckoutModalProps) {
  const { user } = useAuth();
  const { processCheckout, isLoading, checkoutResponse } = useCheckout();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD');

  // Step 1: Customer data
  const [customerData, setCustomerData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpfCnpj: '',
    phone: '',
  });

  // Step 2 & 3: Payment data
  const [creditCardData, setCreditCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  const [installments, setInstallments] = useState(1);

  const handleNext = () => {
    if (step === 1) {
      // Validar dados do cliente
      if (!customerData.name || !customerData.email || !customerData.cpfCnpj) {
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePayment = async () => {
    const checkoutData: CheckoutData = {
      courseId,
      courseTitle,
      coursePrice,
      paymentMethod,
      customer: customerData,
      ...(paymentMethod === 'CREDIT_CARD' && {
        creditCard: creditCardData,
        installments,
      }),
    };

    const result = await processCheckout(checkoutData);
    if (result) {
      setStep(3); // Go to success/waiting screen
    }
  };

  const handleClose = () => {
    setStep(1);
    setCustomerData({
      name: user?.name || '',
      email: user?.email || '',
      cpfCnpj: '',
      phone: '',
    });
    setCreditCardData({
      holderName: '',
      number: '',
      expiryMonth: '',
      expiryYear: '',
      ccv: '',
    });
    setInstallments(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Compra</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-all ${
                s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Course Summary */}
        <div className="bg-muted/30 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">Você está comprando:</h3>
          <p className="font-bold text-lg">{courseTitle}</p>
          <p className="text-2xl font-black text-primary mt-2">{formatPrice(coursePrice)}</p>
        </div>

        {/* Step 1: Customer Data */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Seus Dados</h3>

            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                placeholder="João da Silva"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                placeholder="joao@email.com"
              />
            </div>

            <div>
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={customerData.cpfCnpj}
                onChange={(e) => setCustomerData({ ...customerData, cpfCnpj: e.target.value.replace(/\D/g, '') })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="(11) 99999-9999"
                maxLength={11}
              />
            </div>

            <Button onClick={handleNext} className="w-full" size="lg">
              Continuar para Pagamento
            </Button>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Forma de Pagamento</h3>

            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="CREDIT_CARD" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão
                </TabsTrigger>
                <TabsTrigger value="PIX" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  PIX
                </TabsTrigger>
                <TabsTrigger value="BOLETO" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Boleto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="CREDIT_CARD" className="mt-4">
                <CreditCardForm
                  data={creditCardData}
                  onChange={setCreditCardData}
                  installments={installments}
                  onInstallmentsChange={setInstallments}
                  totalAmount={coursePrice}
                />
              </TabsContent>

              <TabsContent value="PIX" className="mt-4">
                <div className="text-center py-6">
                  <QrCode className="h-16 w-16 mx-auto text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Ao clicar em "Finalizar", será gerado um QR Code PIX para pagamento instant &#226;neo.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="BOLETO" className="mt-4">
                <div className="text-center py-6">
                  <Receipt className="h-16 w-16 mx-auto text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Ao clicar em "Finalizar", será gerado um boleto bancário com vencimento em 7 dias.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button onClick={handlePayment} className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Finalizar Pagamento'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && checkoutResponse && (
          <div className="space-y-4">
            {checkoutResponse.pix && (
              <PixPayment
                data={checkoutResponse.pix}
                orderId={checkoutResponse.orderId}
                onPaymentConfirmed={handleClose}
              />
            )}
            {checkoutResponse.boleto && <BoletoPayment data={checkoutResponse.boleto} />}
            {checkoutResponse.paymentMethod === 'CREDIT_CARD' && checkoutResponse.status === 'CONFIRMED' && (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pagamento Aprovado!</h3>
                <p className="text-muted-foreground mb-6">
                  Seu acesso ao curso já está liberado.
                </p>
                <Button onClick={() => (window.location.href = `/courses/${courseId}`)}>
                  Acessar Curso Agora
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
