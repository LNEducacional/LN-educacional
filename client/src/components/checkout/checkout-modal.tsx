import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, QrCode, Receipt, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useCheckout, type CheckoutData } from '@/hooks/use-checkout';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/utils/course-formatters';
import CreditCardForm from './credit-card-form';
import PixPayment from './pix-payment';
import BoletoPayment from './boleto-payment';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string;
  ebookId?: string;
  courseTitle: string;
  coursePrice: number;
}

export default function CheckoutModal({
  open,
  onOpenChange,
  courseId,
  ebookId,
  courseTitle,
  coursePrice,
}: CheckoutModalProps) {
  const { user } = useAuth();
  const { processCheckout, isLoading, checkoutResponse } = useCheckout();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD');

  // Registration data (for non-authenticated users)
  const [registrationData, setRegistrationData] = useState({
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

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
      const errors: Record<string, string> = {};

      // Validar dados do cliente
      if (!customerData.name) {
        errors.name = 'Nome completo é obrigatório';
      }
      if (!customerData.email) {
        errors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
        errors.email = 'Email inválido';
      }
      if (!customerData.cpfCnpj) {
        errors.cpfCnpj = 'CPF/CNPJ é obrigatório';
      } else if (customerData.cpfCnpj.length < 11) {
        errors.cpfCnpj = 'CPF/CNPJ inválido';
      }

      // Se não estiver logado, validar campos de registro
      if (!user) {
        if (!registrationData.password) {
          errors.password = 'Senha é obrigatória';
        } else if (registrationData.password.length < 8) {
          errors.password = 'Senha deve ter pelo menos 8 caracteres';
        }
        if (!registrationData.confirmPassword) {
          errors.confirmPassword = 'Confirme sua senha';
        } else if (registrationData.password !== registrationData.confirmPassword) {
          errors.confirmPassword = 'Senhas não coincidem';
        }
        if (!registrationData.acceptTerms) {
          errors.acceptTerms = 'Você deve aceitar os termos';
        }
      }

      // Se houver erros, mostrar e não avançar
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios para continuar.',
          variant: 'destructive',
        });
        return;
      }

      // Limpar erros e avançar
      setValidationErrors({});
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
      ...(courseId && { courseId }),
      ...(ebookId && { ebookId }),
      itemTitle: courseTitle,
      itemPrice: coursePrice,
      paymentMethod,
      customer: customerData,
      ...(paymentMethod === 'CREDIT_CARD' && {
        creditCard: creditCardData,
        installments,
      }),
      // Se não estiver logado, incluir dados de registro
      ...(!user && {
        registration: {
          password: registrationData.password,
        },
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
    setRegistrationData({
      password: '',
      confirmPassword: '',
      acceptTerms: false,
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
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                placeholder="João da Silva"
                className={validationErrors.name ? 'border-destructive' : ''}
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                placeholder="joao@email.com"
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
              <Input
                id="cpfCnpj"
                value={customerData.cpfCnpj}
                onChange={(e) => setCustomerData({ ...customerData, cpfCnpj: e.target.value.replace(/\D/g, '') })}
                placeholder="000.000.000-00"
                maxLength={14}
                className={validationErrors.cpfCnpj ? 'border-destructive' : ''}
              />
              {validationErrors.cpfCnpj && (
                <p className="text-xs text-destructive mt-1">{validationErrors.cpfCnpj}</p>
              )}
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

            {/* Campos de registro para usuários não autenticados */}
            {!user && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-lg mb-4">Crie sua Conta</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie uma senha para acessar sua área de membros após a compra
                  </p>
                </div>

                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={registrationData.password}
                      onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className={validationErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={registrationData.confirmPassword}
                      onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                      placeholder="Digite a senha novamente"
                      autoComplete="new-password"
                      className={validationErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={registrationData.acceptTerms}
                      onCheckedChange={(checked) => setRegistrationData({ ...registrationData, acceptTerms: !!checked })}
                      className={validationErrors.acceptTerms ? 'border-destructive' : ''}
                    />
                    <Label htmlFor="terms" className="text-sm leading-tight">
                      Aceito os{' '}
                      <a href="/terms" target="_blank" className="text-primary hover:underline">
                        Termos de Uso
                      </a>{' '}
                      e a{' '}
                      <a href="/privacy" target="_blank" className="text-primary hover:underline">
                        Política de Privacidade
                      </a>
                    </Label>
                  </div>
                  {validationErrors.acceptTerms && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.acceptTerms}</p>
                  )}
                </div>
              </>
            )}

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
              />
            )}
            {checkoutResponse.boleto && <BoletoPayment data={checkoutResponse.boleto} />}
            {checkoutResponse.paymentMethod === 'CREDIT_CARD' && checkoutResponse.status === 'CONFIRMED' && (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-accent-subtle dark:bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-accent dark:text-accent" />
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
