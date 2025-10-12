import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import contactService from '@/services/contact.service';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertCircle,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Por favor, insira um e-mail válido'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de serviço'),
  captchaToken: z.string().min(1, 'Por favor, complete a verificação captcha'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const FAQ_ITEMS = [
  {
    question: 'Qual o prazo de entrega dos trabalhos personalizados?',
    answer:
      'Para artigos e trabalhos menores: 3 a 5 dias úteis. Para TCCs e trabalhos maiores: 15 a 30 dias úteis, dependendo da complexidade e tamanho do projeto.',
  },
  {
    question: 'Como recebo os trabalhos comprados?',
    answer:
      'Você receberá os trabalhos por e-mail com link para download ou terá acesso direto na sua área do cliente em nosso site.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos PIX (desconto de 5%), cartão de crédito (até 12x) e boleto bancário.',
  },
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [captchaRef, setCaptchaRef] = useState<ReCAPTCHA | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      acceptTerms: false,
      captchaToken: '',
    },
  });

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;

    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setValue('phone', formattedPhoneNumber);
  };

  const onCaptchaChange = (token: string | null) => {
    setValue('captchaToken', token || '');
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      // Remove formatting from phone number before sending
      const cleanData = {
        ...data,
        phone: data.phone?.replace(/[^\d]/g, '') || undefined,
      };

      await contactService.sendMessage(cleanData);

      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Obrigado por entrar em contato. Responderemos em breve.',
      });

      reset();
      captchaRef?.reset();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.response?.data?.error || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      'Olá! Gostaria de mais informações sobre os serviços da LN Educacional.'
    );
    window.open(`https://wa.me/5594984211357?text=${message}`, '_blank');
  };

  useEffect(() => {
    document.title = 'Contato - LN Educacional';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Contato & Termos</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Estamos prontos para atender suas dúvidas e você pode consultar nossos termos de
            serviço.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="contact" className="gap-2">
              <Mail className="h-4 w-4" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2">
              <FileText className="h-4 w-4" />
              Termos de Serviço
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-2xl">Envie uma mensagem</CardTitle>
                    <CardDescription>
                      Preencha o formulário abaixo e nossa equipe entrará em contato com você.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Nome */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Digite seu nome completo"
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>

                      {/* E-mail */}
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="seu.email@exemplo.com"
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>

                      {/* Telefone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={watch('phone') || ''}
                          onChange={handlePhoneChange}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>

                      {/* Assunto */}
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto *</Label>
                        <Input
                          id="subject"
                          {...register('subject')}
                          placeholder="Assunto da sua mensagem"
                          className={errors.subject ? 'border-destructive' : ''}
                        />
                        {errors.subject && (
                          <p className="text-sm text-destructive">{errors.subject.message}</p>
                        )}
                      </div>

                      {/* Mensagem */}
                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem *</Label>
                        <Textarea
                          id="message"
                          {...register('message')}
                          placeholder="Descreva sua dúvida ou solicitação..."
                          rows={6}
                          className={errors.message ? 'border-destructive' : ''}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message.message}</p>
                        )}
                      </div>

                      {/* Aceitar Termos */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="acceptTerms"
                          checked={watch('acceptTerms')}
                          onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
                          className={errors.acceptTerms ? 'border-destructive' : ''}
                        />
                        <label htmlFor="acceptTerms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Li e concordo com os{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('terms')}
                            className="text-primary hover:text-primary-hover underline"
                          >
                            Termos de Serviço
                          </button>
                          {' *'}
                        </label>
                      </div>
                      {errors.acceptTerms && (
                        <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                      )}

                      {/* reCAPTCHA */}
                      <div className="space-y-2">
                        <ReCAPTCHA
                          ref={(ref) => setCaptchaRef(ref)}
                          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                          onChange={onCaptchaChange}
                          className={errors.captchaToken ? 'border border-destructive rounded' : ''}
                        />
                        {errors.captchaToken && (
                          <p className="text-sm text-destructive">{errors.captchaToken.message}</p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary-hover gap-2"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info Sidebar */}
              <div className="space-y-6">
                {/* Email */}
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          Para dúvidas e atendimento:
                        </h3>
                        <a
                          href="mailto:trabalhos.academicos.assessoria2@gmail.com"
                          className="text-primary hover:text-primary-hover text-sm break-all"
                        >
                          trabalhos.academicos.assessoria2@gmail.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* WhatsApp */}
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Atendimento rápido:</h3>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          onClick={handleWhatsAppClick}
                        >
                          (94) 98421-1357
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Horário */}
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-accent/20 rounded-lg">
                        <Clock className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">
                          Horário de Atendimento
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Segunda–Sexta: 09h–18h</p>
                          <p>Sábados: 09h–13h</p>
                          <p>Fechado aos domingos e feriados</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Endereço</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="font-medium">LN Educacional</p>
                          <p>Quadra 57 Lote nº 25</p>
                          <p>Avenida Wagner Pereira da Silva</p>
                          <p>Frente para a Praça Atlas – Sala 03</p>
                          <p>Bairro Centro de Apoio</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Section */}
            <Card className="mt-12 shadow-medium">
              <CardHeader>
                <CardTitle className="text-2xl">Perguntas Frequentes</CardTitle>
                <CardDescription>
                  Confira as dúvidas mais comuns sobre nossos serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item, index) => (
                    <AccordionItem key={item.question} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms">
            <Card className="shadow-medium max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Termos de Serviço</CardTitle>
                <CardDescription className="text-center">
                  Contrato de Prestação de Serviços Acadêmicos
                </CardDescription>
              </CardHeader>

              <CardContent className="prose max-w-none">
                <div className="space-y-8">
                  {/* Informações Importantes */}
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-accent-foreground mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-accent-foreground mb-3">
                          1. Informações Importantes
                        </h3>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          Este contrato estabelece os termos e condições para a prestação de
                          serviços acadêmicos pela LN Educacional. Ao utilizar nossos serviços, você
                          concorda integralmente com estes termos.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Partes Contratantes */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      2. Partes Contratantes
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>CONTRATADA:</strong> LN Educacional, empresa especializada em serviços
                      acadêmicos.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>CONTRATANTE:</strong> Pessoa física que solicita os serviços
                      oferecidos.
                    </p>
                  </div>

                  {/* Objeto do Contrato */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      3. Objeto do Contrato
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      A CONTRATADA compromete-se a prestar os seguintes serviços:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Elaboração de trabalhos acadêmicos personalizados</li>
                      <li>Revisão e formatação de textos acadêmicos</li>
                      <li>Consultoria em metodologia científica</li>
                      <li>E-books e materiais didáticos</li>
                      <li>Cursos online e treinamentos</li>
                    </ul>
                  </div>

                  {/* Direitos e Deveres */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      4. Direitos e Deveres
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Do CONTRATANTE:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Fornecer informações precisas e completas</li>
                          <li>Efetuar o pagamento nos prazos estabelecidos</li>
                          <li>Comunicar alterações ou dúvidas tempestivamente</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Da CONTRATADA:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Entregar os serviços conforme especificações</li>
                          <li>Manter confidencialidade das informações</li>
                          <li>Fornecer suporte durante o processo</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Prazos e Entregas */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      5. Prazos e Entregas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Artigos e trabalhos menores: 3 a 5 dias úteis</li>
                      <li>TCCs e projetos maiores: 15 a 30 dias úteis</li>
                      <li>Revisões: 24 a 48 horas</li>
                      <li>Entregas via e-mail ou área do cliente</li>
                    </ul>
                  </div>

                  {/* Condições de Pagamento */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      6. Condições de Pagamento
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>PIX: Desconto de 5% sobre o valor total</li>
                      <li>Cartão de crédito: Parcelamento em até 12x</li>
                      <li>Boleto bancário: À vista</li>
                      <li>Pagamento obrigatório antes da entrega</li>
                    </ul>
                  </div>

                  {/* Suporte e Atendimento */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      7. Suporte e Atendimento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Oferecemos suporte completo através de e-mail e WhatsApp durante nosso horário
                      de funcionamento. Todas as dúvidas serão respondidas em até 24 horas.
                    </p>
                  </div>

                  {/* Política de Cancelamento */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      8. Política de Cancelamento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cancelamentos podem ser solicitados até 24 horas após a confirmação do pedido.
                      Após o início dos trabalhos, não haverá reembolso, exceto em casos de
                      impossibilidade técnica.
                    </p>
                  </div>

                  {/* Propriedade Intelectual */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      9. Propriedade Intelectual
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Todos os trabalhos entregues tornam-se propriedade exclusiva do contratante. A
                      LN Educacional não retém direitos sobre o conteúdo produzido.
                    </p>
                  </div>

                  {/* Termo de Aceite Digital */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">
                          10. Termo de Aceite Digital
                        </h3>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          Ao utilizar nossos serviços, você declara ter lido, compreendido e aceito
                          todos os termos deste contrato. O aceite digital possui a mesma validade
                          jurídica de um contrato físico assinado.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disposições Finais */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      11. Disposições Finais
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Este contrato é regido pelas leis brasileiras. Eventuais conflitos serão
                      resolvidos através de negociação direta ou, se necessário, pelo foro da
                      comarca de domicílio da contratada.
                    </p>
                  </div>

                  {/* Dados da Empresa */}
                  <div className="border-t border-border pt-6 mt-8">
                    <h3 className="text-lg font-semibold text-foreground mb-3">LN Educacional</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Quadra 57 Lote nº 25, Avenida Wagner Pereira da Silva</p>
                      <p>Frente para a Praça Atlas – Sala 03, Bairro Centro de Apoio</p>
                      <p>E-mail: trabalhos.academicos.assessoria2@gmail.com</p>
                      <p>WhatsApp: (94) 98421-1357</p>
                      <p className="mt-3 font-medium">Última atualização: Janeiro de 2025</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
