import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
    general: '',
  });

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return 'Nome completo é obrigatório';
    }
    if (name.trim().length < 3) {
      return 'Nome deve ter pelo menos 3 caracteres';
    }
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'E-mail é obrigatório';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'E-mail inválido';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Senha é obrigatória';
    }
    if (password.length < 8) {
      return 'Senha deve ter pelo menos 8 caracteres';
    }
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) {
      return 'Confirmação de senha é obrigatória';
    }
    if (password !== confirmPassword) {
      return 'Senhas não coincidem';
    }
    return '';
  };

  const validateTerms = (acceptTerms: boolean): string => {
    if (!acceptTerms) {
      return 'Você deve aceitar os termos de uso';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
      acceptTerms: validateTerms(formData.acceptTerms),
      general: '',
    };

    const isValid = Object.values(newErrors).every((error) => error === '');
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: '',
      general: '',
    });

    try {
      await signUp(formData.name, formData.email, formData.password);

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo à LN Educacional!',
      });
    } catch (error: unknown) {
      // Type narrowing para acessar propriedades do erro de forma segura
      let errorMessage = 'Erro ao criar conta. Tente novamente.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Usar setTimeout para garantir que a atualização do DOM ocorra após o estado ser limpo
      setTimeout(() => {
        if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('e-mail')) {
          setErrors((prev) => ({
            ...prev,
            email: errorMessage,
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: errorMessage,
          }));
        }
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      {/* Spline Background Animation */}
      <div className="spline-container absolute top-0 left-0 w-full h-full -z-10">
        <iframe
          src="https://my.spline.design/herolightcopy-HWuYMA6IdNGk0VGuyvrItNGB"
          frameBorder="0"
          width="100%"
          height="100%"
          id="aura-spline"
          title="Background Animation"
        />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Voltar ao início</span>
      </Link>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Register Form */}
      <Card className="w-full max-w-md mx-auto animate-fade-in shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <Link to="/" title="Ir para página inicial">
              <img
                src="/logo.png"
                alt="LN Educacional"
                className="h-16 w-16 object-contain -mb-4 hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gradient-primary">LN Educacional</h1>
              <p className="text-sm text-muted-foreground">
                Junte-se a milhares de alunos e comece a aprender hoje
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error */}
            {errors.general && (
              <div key="general-error" className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.name ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p key="name-error" className="text-sm text-destructive animate-fade-in">{errors.name}</p>
              )}
            </div>

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
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.email ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p key="email-error" className="text-sm text-destructive animate-fade-in">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.password ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p key="password-error" className="text-sm text-destructive animate-fade-in">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.confirmPassword ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p key="confirm-password-error" className="text-sm text-destructive animate-fade-in">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                >
                  Eu concordo com os{' '}
                  <Link to="/terms" className="text-primary hover:text-primary/80 underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary/80 underline">
                    Política de Privacidade
                  </Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p key="terms-error" className="text-sm text-destructive animate-fade-in">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Criar Conta
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
