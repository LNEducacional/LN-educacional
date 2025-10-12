import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CollaboratorFormData } from '@/types/collaborator';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface CollaboratorStep2Props {
  errors: FieldErrors<CollaboratorFormData>;
  setValue: UseFormSetValue<CollaboratorFormData>;
  watchedValues: CollaboratorFormData;
  canProceed: boolean;
  onNext: () => void;
  onPrevious: () => void;
  areasOfInterest: Array<{ value: string; label: string }>;
}

export function CollaboratorStep2({
  errors,
  setValue,
  watchedValues,
  canProceed,
  onNext,
  onPrevious,
  areasOfInterest,
}: CollaboratorStep2Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Experiência Profissional</CardTitle>
        <CardDescription>Conte-nos sobre sua experiência e área de especialização</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="area">Área de Interesse</Label>
          <Select
            value={watchedValues.area}
            onValueChange={(value) =>
              setValue('area', value as keyof (typeof areasOfInterest)[number])
            }
          >
            <SelectTrigger className={errors.area ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione sua área de interesse" />
            </SelectTrigger>
            <SelectContent>
              {areasOfInterest.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.area && <p className="text-sm text-destructive mt-1">{errors.area.message}</p>}
        </div>

        <div>
          <Label htmlFor="availability">Disponibilidade</Label>
          <Select
            value={watchedValues.availability}
            onValueChange={(value) =>
              setValue(
                'availability',
                value as 'part-time' | 'full-time' | 'freelance' | 'contract'
              )
            }
          >
            <SelectTrigger className={errors.availability ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione sua disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="part-time">Meio período</SelectItem>
              <SelectItem value="full-time">Tempo integral</SelectItem>
              <SelectItem value="freelance">Freelancer</SelectItem>
              <SelectItem value="contract">Contrato</SelectItem>
            </SelectContent>
          </Select>
          {errors.availability && (
            <p className="text-sm text-destructive mt-1">{errors.availability.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="experience">Experiência Profissional</Label>
          <Select
            value={watchedValues.experience}
            onValueChange={(value) =>
              setValue('experience', value as '0-1' | '2-5' | '5-10' | '10+')
            }
          >
            <SelectTrigger className={errors.experience ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione sua experiência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">0-1 anos</SelectItem>
              <SelectItem value="2-5">2-5 anos</SelectItem>
              <SelectItem value="5-10">5-10 anos</SelectItem>
              <SelectItem value="10+">Mais de 10 anos</SelectItem>
            </SelectContent>
          </Select>
          {errors.experience && (
            <p className="text-sm text-destructive mt-1">{errors.experience.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="education">Nível de Educação</Label>
          <Select
            value={watchedValues.education}
            onValueChange={(value) =>
              setValue('education', value as 'high-school' | 'bachelor' | 'master' | 'phd')
            }
          >
            <SelectTrigger className={errors.education ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione seu nível de educação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high-school">Ensino Médio</SelectItem>
              <SelectItem value="bachelor">Graduação</SelectItem>
              <SelectItem value="master">Mestrado</SelectItem>
              <SelectItem value="phd">Doutorado</SelectItem>
            </SelectContent>
          </Select>
          {errors.education && (
            <p className="text-sm text-destructive mt-1">{errors.education.message}</p>
          )}
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Anterior
          </Button>
          <Button type="button" onClick={onNext} disabled={!canProceed}>
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
