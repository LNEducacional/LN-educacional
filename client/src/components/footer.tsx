import {
  Instagram,
  Mail,
  Phone,
  Youtube,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function Footer() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async () => {
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Por favor, informe um e-mail válido');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/leads/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        setErrorMessage(data.error || 'Erro ao cadastrar. Tente novamente.');
      }
    } catch {
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 py-10">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="LN Educacional"
                className="h-8 w-8 object-contain brightness-0 invert"
              />
              <h3 className="text-xl font-bold text-white">LN Educacional</h3>
            </div>

            <p className="text-gray-400 leading-relaxed max-w-sm">
              Transformando vidas através da educação online de qualidade. Aprenda com os melhores e
              alcance seus objetivos profissionais.
            </p>
          </div>

          {/* Contact Info & Social Links - Centered */}
          <div className="space-y-6 flex flex-col items-center justify-center text-center">
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <a
                  href="mailto:trabalhos.academicos.assessoria2@gmail.com"
                  className="break-all hover:text-primary transition-colors"
                >
                  trabalhos.academicos.assessoria2@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <a
                  href="https://wa.me/5594984211357"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  (94) 98421-1357
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href="https://www.youtube.com/channel/UCfCtiGQBz-L_FY3vY1dOjCQ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 text-gray-300 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
              <a
                href="https://www.instagram.com/ln_educacional"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 text-gray-300 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-gray-400 hover:text-primary transition-colors text-sm text-left"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-gray-400 hover:text-primary transition-colors text-sm text-left"
                >
                  Política de Privacidade
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <div className="max-w-md mx-auto sm:mx-0">
            <h4 className="font-semibold mb-2 text-center sm:text-left text-white">Receba novidades</h4>
            <p className="text-gray-400 text-sm mb-4 text-center sm:text-left">
              Fique por dentro dos novos cursos e promoções exclusivas.
            </p>
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Email cadastrado com sucesso! Você receberá nossas novidades.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubscribe();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="btn-accent whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Inscrever'
                    )}
                  </button>
                </div>
                {errorMessage && (
                  <p className="text-red-500 text-xs">{errorMessage}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © 2024 LN Educacional. Todos os direitos reservados.
          </div>
          <div className="text-sm text-gray-400">
            Feito com ❤️ para transformar a educação
          </div>
        </div>
      </div>

      {/* Terms of Use Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
            <DialogDescription>
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Bem-vindo ao LN Educacional. Ao acessar e utilizar nossos serviços, você concorda com
              os seguintes termos e condições.
            </p>
            <h3 className="font-semibold text-foreground mt-4">1. Aceitação dos Termos</h3>
            <p>
              Ao utilizar nossa plataforma, você concorda em cumprir e estar vinculado aos presentes
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá
              utilizar nossos serviços.
            </p>
            <h3 className="font-semibold text-foreground mt-4">2. Uso dos Serviços</h3>
            <p>
              Nossos serviços são destinados ao uso educacional e profissional. Você se compromete a
              utilizar a plataforma de forma ética e em conformidade com todas as leis aplicáveis.
            </p>
            <h3 className="font-semibold text-foreground mt-4">3. Propriedade Intelectual</h3>
            <p>
              Todo o conteúdo disponibilizado na plataforma, incluindo textos, gráficos, logotipos,
              ícones e imagens, é de propriedade do LN Educacional ou de seus licenciadores e está
              protegido por leis de direitos autorais.
            </p>
            <h3 className="font-semibold text-foreground mt-4">4. Limitação de Responsabilidade</h3>
            <p>
              O LN Educacional não se responsabiliza por quaisquer danos diretos, indiretos,
              incidentais ou consequenciais resultantes do uso ou da impossibilidade de uso de nossos
              serviços.
            </p>
            <h3 className="font-semibold text-foreground mt-4">5. Modificações</h3>
            <p>
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As
              alterações entrarão em vigor imediatamente após sua publicação na plataforma.
            </p>
            <p className="mt-4 italic">
              Este é um conteúdo temporário. Os termos definitivos serão fornecidos em breve.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
            <DialogDescription>
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              A privacidade dos nossos usuários é extremamente importante para nós. Esta Política de
              Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.
            </p>
            <h3 className="font-semibold text-foreground mt-4">1. Informações Coletadas</h3>
            <p>
              Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e
              outras informações de perfil quando você se cadastra ou utiliza nossos serviços.
            </p>
            <h3 className="font-semibold text-foreground mt-4">2. Uso das Informações</h3>
            <p>
              Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, processar
              transações, enviar comunicações importantes e personalizar sua experiência na plataforma.
            </p>
            <h3 className="font-semibold text-foreground mt-4">3. Compartilhamento de Informações</h3>
            <p>
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto
              quando necessário para fornecer nossos serviços ou quando exigido por lei.
            </p>
            <h3 className="font-semibold text-foreground mt-4">4. Segurança</h3>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger
              suas informações pessoais contra acesso não autorizado, alteração, divulgação ou
              destruição.
            </p>
            <h3 className="font-semibold text-foreground mt-4">5. Cookies</h3>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso
              da plataforma e auxiliar em nossos esforços de marketing.
            </p>
            <h3 className="font-semibold text-foreground mt-4">6. Seus Direitos</h3>
            <p>
              Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer
              momento. Entre em contato conosco para exercer esses direitos.
            </p>
            <h3 className="font-semibold text-foreground mt-4">7. Contato</h3>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através
              do e-mail: trabalhos.academicos.assessoria2@gmail.com
            </p>
            <p className="mt-4 italic">
              Este é um conteúdo temporário. A política definitiva será fornecida em breve.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
