import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogIn, UserPlus, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredModal({ open, onOpenChange }: LoginRequiredModalProps) {
  const navigate = useNavigate();

  const handleRegister = () => {
    onOpenChange(false);
    navigate('/register');
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Download className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Login Necessário</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Para fazer download dos trabalhos gratuitos, você precisa estar logado em sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Benefícios de criar uma conta:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Acesso ilimitado a trabalhos gratuitos</li>
              <li>Histórico de downloads</li>
              <li>Notificações de novos conteúdos</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleRegister} className="w-full" size="lg">
            <UserPlus className="mr-2 h-4 w-4" />
            Criar Conta Gratuita
          </Button>
          <Button onClick={handleLogin} variant="outline" className="w-full" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Já tenho conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
