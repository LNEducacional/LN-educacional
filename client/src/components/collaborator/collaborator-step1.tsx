import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CollaboratorFormData } from '@/types/collaborator';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

interface CollaboratorStep1Props {
  register: UseFormRegister<CollaboratorFormData>;
  errors: FieldErrors<CollaboratorFormData>;
  canProceed: boolean;
  onNext: () => void;
}

export function CollaboratorStep1({
  register,
  errors,
  canProceed,
  onNext,
}: CollaboratorStep1Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
        <CardDescription>
          Preencha seus dados pessoais para iniciarmos sua candidatura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder="Seu nome completo"
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="seu@email.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="(11) 99999-9999"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <Label htmlFor="motivation">Por que deseja ser colaborador?</Label>
          <Textarea
            id="motivation"
            {...register('motivation')}
            placeholder="Conte-nos sua motivação para se tornar um colaborador..."
            className={`resize-none ${errors.motivation ? 'border-destructive' : ''}`}
            rows={4}
          />
          {errors.motivation && (
            <p className="text-sm text-destructive mt-1">{errors.motivation.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onNext} disabled={!canProceed}>
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
