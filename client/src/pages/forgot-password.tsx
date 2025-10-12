import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, CheckCircle2, GraduationCap, Loader2, Mail } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('E-mail é obrigatório');
      setStatus('error');
      return;
    }

    if (!validateEmail(email)) {
      setError('Digite um e-mail válido');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatus('idle');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock logic: check if email exists in our "database"
      const validEmails = [
        'admin@lneducacional.com',
        'aluno@lneducacional.com',
        'usuario@teste.com',
      ];

      if (validEmails.includes(email.toLowerCase())) {
        setStatus('success');
        toast({
          title: 'E-mail enviado com sucesso!',
          description: 'Verifique sua caixa de entrada e spam.',
        });
      } else {
        // Even for security, we show success message to prevent email enumeration
        setStatus('success');
        toast({
          title: 'Instruções enviadas',
          description: 'Se o e-mail estiver cadastrado, você receberá as instruções.',
        });
      }
    } catch (_error) {
      setError('Erro interno do servidor. Tente novamente mais tarde.');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError('');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      {/* Back to Login */}
      <Link
        to="/login"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Voltar ao login</span>
      </Link>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Forgot Password Form */}
      <Card className="w-full max-w-md mx-auto animate-fade-in shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gradient-primary">LN Educacional</h1>
              <CardTitle className="text-xl text-foreground">Recuperar Senha</CardTitle>
              <p className="text-sm text-muted-foreground">
                Digite seu e-mail para receber instruções de recuperação
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'success' ? (
            /* Success State */
            <div className="text-center space-y-6 animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Instruções Enviadas!</h3>
                <p className="text-sm text-muted-foreground">
                  Se este e-mail estiver cadastrado em nosso sistema, você receberá um link para
                  redefinir sua senha em alguns minutos.
                </p>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Não esqueça de verificar sua pasta de spam ou lixo eletrônico.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link to="/login">Voltar para Login</Link>
                </Button>

                <Button variant="outline" className="w-full" onClick={() => setStatus('idle')}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {status === 'error' && error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail cadastrado"
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      status === 'error' && error
                        ? 'border-destructive focus:border-destructive'
                        : ''
                    }`}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Instruções
                  </>
                )}
              </Button>

              {/* Demo Info */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground text-center mb-2 font-medium">
                  E-mails de demonstração que funcionam:
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• admin@lneducacional.com</p>
                  <p>• aluno@lneducacional.com</p>
                  <p>• usuario@teste.com</p>
                </div>
              </div>
            </form>
          )}

          {/* Additional Links */}
          {status !== 'success' && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                  </Link>
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Não tem uma conta?{' '}
                    <Link
                      to="/register"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Criar conta gratuita
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
