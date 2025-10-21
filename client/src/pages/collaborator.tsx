import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useViaCEP } from '@/hooks/useViaCEP';
import collaboratorService from '@/services/collaborator.service';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

import {
  Controller,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  type UseFormSetValue,
  useForm,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  FolderOpen,
  Gift,
  Loader2,
  Upload,
  User,
} from 'lucide-react';

// Form validation schema
const collaboratorSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Por favor, insira um e-mail válido'),
  phone: z.string().min(10, 'Telefone deve conter DDD e número válido'),
  // Address fields
  zipCode: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  area: z.enum(
    ['ACADEMIC_WRITING', 'CONTENT_REVIEW', 'TEACHING', 'CONTENT_EDITING', 'CONTENT_CREATION'],
    {
      required_error: 'Selecione uma área de interesse',
    }
  ),
  availability: z.enum(['FULL_TIME', 'PART_TIME', 'WEEKENDS', 'EVENINGS', 'FLEXIBLE'], {
    required_error: 'Selecione sua disponibilidade',
  }),
  experience: z.string().min(10, 'Descrição da experiência deve ter pelo menos 10 caracteres'),
  education: z.string().min(10, 'Formação deve ter pelo menos 10 caracteres'),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos para continuar',
  }),
  resumeFile: z.any().optional(),
  portfolioFiles: z.any().optional(),
});

type CollaboratorFormData = z.infer<typeof collaboratorSchema>;

const AREAS_OF_INTEREST = [
  { value: 'ACADEMIC_WRITING', label: 'Escritor/Redator Acadêmico' },
  { value: 'CONTENT_REVIEW', label: 'Revisor de Textos' },
  { value: 'TEACHING', label: 'Professor/Orientador' },
  { value: 'CONTENT_EDITING', label: 'Editor de Conteúdo' },
  { value: 'CONTENT_CREATION', label: 'Criador de Conteúdo' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'FULL_TIME', label: 'Tempo Integral' },
  { value: 'PART_TIME', label: 'Meio Período' },
  { value: 'WEEKENDS', label: 'Fins de Semana' },
  { value: 'EVENINGS', label: 'Período Noturno' },
  { value: 'FLEXIBLE', label: 'Horário Flexível' },
];

// Validation utilities
const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some((type) => file.type.includes(type));
};

// Step validation utilities
const canProceedToStep2 = (values: Partial<CollaboratorFormData>): boolean => {
  return !!(values.fullName && values.email && values.phone);
};

const canProceedToStep3 = (values: Partial<CollaboratorFormData>): boolean => {
  return !!(
    values.area &&
    values.availability &&
    values.experience && values.experience.length >= 10 &&
    values.education && values.education.length >= 10
  );
};

const getStepProgress = (currentStep: number, totalSteps: number): number => {
  return (currentStep / totalSteps) * 100;
};

// Preview modal component
function PreviewModal({
  showPreview,
  setShowPreview,
  watchedValues,
  resumeFile,
  portfolioFiles,
  handleSubmit,
  onSubmit,
  isSubmitting,
}: {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  watchedValues: Partial<CollaboratorFormData>;
  resumeFile: File | null;
  portfolioFiles: File[];
  handleSubmit: UseFormHandleSubmit<CollaboratorFormData>;
  onSubmit: (data: CollaboratorFormData) => void;
  isSubmitting: boolean;
}) {
  if (!showPreview) return null;

  return (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar Aplicação</DialogTitle>
          <DialogDescription>
            Confirme se todas as informações estão corretas antes de enviar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{watchedValues.fullName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-medium">{watchedValues.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{watchedValues.phone || '-'}</span>
              </div>
              {watchedValues.linkedin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LinkedIn:</span>
                  <span className="font-medium truncate max-w-xs">{watchedValues.linkedin}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Informações Profissionais
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Área:</span>
                <span className="font-medium">
                  {AREAS_OF_INTEREST.find((a) => a.value === watchedValues.area)?.label || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disponibilidade:</span>
                <span className="font-medium">
                  {AVAILABILITY_OPTIONS.find((a) => a.value === watchedValues.availability)
                    ?.label || '-'}
                </span>
              </div>
            </div>

            {watchedValues.education && (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm mb-1">Formação:</p>
                <p className="text-sm bg-muted/50 rounded p-2">{watchedValues.education}</p>
              </div>
            )}

            {watchedValues.experience && (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm mb-1">Experiência:</p>
                <p className="text-sm bg-muted/50 rounded p-2">{watchedValues.experience}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Currículo:</span>
                <span className="font-medium">{resumeFile ? resumeFile.name : 'Não enviado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Portfolio:</span>
                <span className="font-medium">
                  {portfolioFiles.length > 0
                    ? `${portfolioFiles.length} arquivo(s)`
                    : 'Não enviado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Voltar para editar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              'Confirmar e Enviar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component for Step 1: Personal Information
function PersonalInfoStep({
  register,
  errors,
  setValue,
  watchedValues
}: {
  register: UseFormRegister<CollaboratorFormData>;
  errors: FieldErrors<CollaboratorFormData>;
  setValue: UseFormSetValue<CollaboratorFormData>;
  watchedValues: Partial<CollaboratorFormData>;
}) {
  const { fetchAddress, formatCep, loading, error, clearError } = useViaCEP();

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      clearError();
      const addressData = await fetchAddress(cep);
      if (addressData) {
        setValue('address', addressData.logradouro);
        setValue('neighborhood', addressData.bairro);
        setValue('city', addressData.localidade);
        setValue('state', addressData.uf);
      }
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setValue('zipCode', formatted);
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo *</Label>
        <Input
          id="fullName"
          {...register('fullName')}
          placeholder="Digite seu nome completo"
          className={errors.fullName ? 'border-destructive' : ''}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="seu.email@exemplo.com"
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone/WhatsApp *</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="(11) 99999-9999"
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin">LinkedIn (Opcional)</Label>
        <Input
          id="linkedin"
          {...register('linkedin')}
          placeholder="https://linkedin.com/in/seu-perfil"
          className={errors.linkedin ? 'border-destructive' : ''}
        />
        {errors.linkedin && <p className="text-sm text-destructive">{errors.linkedin.message}</p>}
      </div>

      {/* Address Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Endereço (Opcional)</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">CEP</Label>
            <div className="relative">
              <Input
                id="zipCode"
                value={watchedValues.zipCode || ''}
                onChange={handleCepChange}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                maxLength={9}
                className={error ? 'border-destructive' : ''}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </div>
            {loading && <p className="text-sm text-muted-foreground">Buscando endereço...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Rua, Avenida..."
                value={watchedValues.address || ''}
                onChange={(e) => setValue('address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                {...register('addressNumber')}
                placeholder="Nº"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              {...register('neighborhood')}
              placeholder="Bairro"
              value={watchedValues.neighborhood || ''}
              onChange={(e) => setValue('neighborhood', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Cidade"
                value={watchedValues.city || ''}
                onChange={(e) => setValue('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="UF"
                maxLength={2}
                value={watchedValues.state || ''}
                onChange={(e) => setValue('state', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Step 2: Professional Experience
function ProfessionalExperienceStep({
  register,
  errors,
  watchedValues,
  setValue,
  control,
}: {
  register: UseFormRegister<CollaboratorFormData>;
  errors: FieldErrors<CollaboratorFormData>;
  watchedValues: Partial<CollaboratorFormData>;
  setValue: UseFormSetValue<CollaboratorFormData>;
  control: any;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="area">Área de Interesse *</Label>
        <Controller
          name="area"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="area" className={errors.area ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione uma área" />
              </SelectTrigger>
              <SelectContent>
                {AREAS_OF_INTEREST.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.area && <p className="text-sm text-destructive">{errors.area.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="availability">Disponibilidade *</Label>
        <Controller
          name="availability"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="availability" className={errors.availability ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione sua disponibilidade" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.availability && (
          <p className="text-sm text-destructive">{errors.availability.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="education">Formação Acadêmica *</Label>
        <Textarea
          id="education"
          {...register('education')}
          placeholder="Descreva sua formação acadêmica, cursos e certificações..."
          rows={4}
          className={errors.education ? 'border-destructive' : ''}
        />
        {errors.education && <p className="text-sm text-destructive">{errors.education.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Experiência Profissional *</Label>
        <Textarea
          id="experience"
          {...register('experience')}
          placeholder="Descreva sua experiência profissional relevante para a área escolhida..."
          rows={6}
          className={errors.experience ? 'border-destructive' : ''}
        />
        {errors.experience && (
          <p className="text-sm text-destructive">{errors.experience.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolioUrl">Link do Portfolio (Opcional)</Label>
        <Input
          id="portfolioUrl"
          {...register('portfolioUrl')}
          placeholder="https://seu-portfolio.com"
          className={errors.portfolioUrl ? 'border-destructive' : ''}
        />
        {errors.portfolioUrl && (
          <p className="text-sm text-destructive">{errors.portfolioUrl.message}</p>
        )}
      </div>
    </div>
  );
}

// Component for Step 3: Documents and Confirmation
function DocumentsStep({
  errors,
  watchedValues,
  setValue,
  resumeFile,
  setResumeFile,
  portfolioFiles,
  handleFileUpload,
  handlePortfolioUpload,
  removePortfolioFile,
  fileInputRef,
  portfolioInputRef,
}: {
  errors: FieldErrors<CollaboratorFormData>;
  watchedValues: Partial<CollaboratorFormData>;
  setValue: UseFormSetValue<CollaboratorFormData>;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  portfolioFiles: File[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePortfolioUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removePortfolioFile: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  portfolioInputRef: React.RefObject<HTMLInputElement>;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPortfolioDragOver, setIsPortfolioDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      handleFileUpload({ target: { files } } as any);
    }
  };

  const handlePortfolioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPortfolioDragOver(true);
  };

  const handlePortfolioDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPortfolioDragOver(false);
  };

  const handlePortfolioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPortfolioDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handlePortfolioUpload({ target: { files } } as any);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="resume">Currículo (Recomendado)</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/10'
              : 'border-muted hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="resume"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          {resumeFile ? (
            <div className="space-y-2">
              <FileText className="h-12 w-12 text-accent mx-auto" />
              <p className="text-sm font-medium">{resumeFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setResumeFile(null);
                  setValue('resumeFile', undefined);
                }}
              >
                Remover arquivo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                {isDragOver ? 'Solte o arquivo aqui' : 'Clique para enviar ou arraste seu currículo aqui'}
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX (máx. 5MB)</p>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Escolher arquivo
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolio">Arquivos de Portfolio (Opcional)</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            isPortfolioDragOver
              ? 'border-primary bg-primary/10'
              : 'border-muted hover:border-primary/50'
          }`}
          onDragOver={handlePortfolioDragOver}
          onDragLeave={handlePortfolioDragLeave}
          onDrop={handlePortfolioDrop}
        >
          <input
            id="portfolio"
            ref={portfolioInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handlePortfolioUpload}
            className="hidden"
          />
          {portfolioFiles.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FolderOpen className="h-8 w-8 text-accent" />
                <span className="text-sm font-medium">
                  {portfolioFiles.length} arquivo(s) selecionado(s)
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {portfolioFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-muted/50 rounded p-2"
                  >
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePortfolioFile(index)}
                      className="h-6 px-2"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => portfolioInputRef.current?.click()}
                className="w-full"
              >
                Adicionar mais arquivos
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                {isPortfolioDragOver ? 'Solte os arquivos aqui' : 'Envie amostras do seu trabalho'}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX ou imagens (máx. 10MB cada, até 5 arquivos)
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => portfolioInputRef.current?.click()}
              >
                Escolher arquivos
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={watchedValues.acceptTerms}
            onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="acceptTerms" className="text-sm font-medium cursor-pointer">
              Aceito os termos e condições *
            </Label>
            <p className="text-xs text-muted-foreground">
              Declaro que todas as informações fornecidas são verdadeiras e aceito os termos de
              colaboração da LN Educacional.
            </p>
          </div>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-destructive ml-6">{errors.acceptTerms.message}</p>
        )}
      </div>
    </div>
  );
}

export default function Collaborator() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const totalSteps = 3;

  // Auto-save functionality
  const AUTO_SAVE_KEY = 'collaborator_application_draft';

  // Get saved data from localStorage
  const getSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error reading saved data:', error);
      return {};
    }
  }, [AUTO_SAVE_KEY]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<CollaboratorFormData>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: getSavedData(),
  });

  const watchedValues = watch();

  // Auto-save hook
  const { clearSavedData } = useAutoSave(AUTO_SAVE_KEY, watchedValues);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!validateFileSize(file, 5)) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }
      if (!validateFileType(file, ['pdf', 'document'])) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, envie um arquivo PDF ou DOC/DOCX.',
          variant: 'destructive',
        });
        return;
      }
      setResumeFile(file);
      setValue('resumeFile', file);
    }
  };

  const handlePortfolioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      if (!validateFileSize(file, 10)) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o limite de 10MB.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (portfolioFiles.length + validFiles.length > 5) {
      toast({
        title: 'Limite de arquivos',
        description: 'Você pode enviar no máximo 5 arquivos de portfolio.',
        variant: 'destructive',
      });
      return;
    }

    setPortfolioFiles([...portfolioFiles, ...validFiles]);
    setValue('portfolioFiles', [...portfolioFiles, ...validFiles]);
  };

  const removePortfolioFile = (index: number) => {
    const newFiles = portfolioFiles.filter((_, i) => i !== index);
    setPortfolioFiles(newFiles);
    setValue('portfolioFiles', newFiles);
  };

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Form navigation functions
  const _handleNextStep = useCallback(() => {
    const validationMap = {
      1: () => canProceedToStep2(watchedValues),
      2: () => canProceedToStep3(watchedValues),
    };

    const isCurrentStepValid = validationMap[currentStep as keyof typeof validationMap];

    if (isCurrentStepValid && !isCurrentStepValid()) {
      if (currentStep === 2) {
        toast({
          title: 'Preencha todos os campos obrigatórios',
          description: 'Os campos de Experiência Profissional e Formação Acadêmica devem ter pelo menos 10 caracteres.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Preencha todos os campos',
          description: 'Complete os campos obrigatórios para continuar.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, watchedValues, toast]);

  const _handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Form submission with validation
  const _handleFormSubmit = useCallback(
    async (data: CollaboratorFormData) => {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        toast({
          title: 'Aceite os termos',
          description: 'Você deve aceitar os termos para continuar.',
          variant: 'destructive',
        });
        return;
      }

      // Validate user authentication
      if (!user) {
        toast({
          title: 'Faça login primeiro',
          description: 'Você precisa estar logado para se candidatar.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      setIsSubmitting(true);

      try {
        const [resumeUrl, portfolioUrls] = await Promise.all([
          resumeFile ? convertFileToBase64(resumeFile) : undefined,
          portfolioFiles.length > 0 ? Promise.all(portfolioFiles.map(convertFileToBase64)) : [],
        ]);

        const response = await collaboratorService.apply({
          ...data,
          resumeUrl,
          portfolioFiles: portfolioUrls,
        });

        toast({
          title: 'Aplicação enviada com sucesso!',
          description: 'Avaliaremos seu perfil e entraremos em contato.',
        });

        // Clear saved data after successful submission
        clearSavedData();

        setApplicationId(response.id);
        setIsSubmitSuccess(true);
      } catch (error: unknown) {
        const errorMessage =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response &&
          error.response.data &&
          typeof error.response.data === 'object' &&
          'error' in error.response.data
            ? String(error.response.data.error)
            : 'Ocorreu um erro inesperado. Tente novamente.';
        toast({
          title: 'Erro ao enviar aplicação',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, navigate, toast, resumeFile, portfolioFiles, convertFileToBase64, clearSavedData]
  );

  const handleNewApplication = useCallback(() => {
    setIsSubmitSuccess(false);
    setCurrentStep(1);
    setResumeFile(null);
    setPortfolioFiles([]);
    clearSavedData();
    reset();
  }, [reset, clearSavedData]);

  if (isSubmitSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="p-8 shadow-medium animate-scale-in">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4">Aplicação Recebida!</h1>

              <p className="text-muted-foreground mb-4 leading-relaxed">
                Agradecemos seu interesse em fazer parte da nossa equipe! Avaliaremos cuidadosamente
                seu perfil e experiência. Nossa equipe entrará em contato em breve com mais
                informações sobre o processo seletivo.
              </p>

              {applicationId && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium mb-1">Código de acompanhamento:</p>
                  <p className="text-lg font-mono font-bold text-primary">{applicationId}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Guarde este código para acompanhar o status da sua aplicação.
                  </p>
                </div>
              )}

              <Button onClick={handleNewApplication} variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                Enviar nova aplicação
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Seja Colaborador</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Faça parte da nossa equipe de profissionais qualificados e contribua para a educação de
            qualidade.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-medium animate-slide-up">
              <CardHeader>
                <CardTitle className="text-2xl">Formulário de Aplicação</CardTitle>
                <CardDescription>
                  Preencha o formulário abaixo com suas informações profissionais. Todas as
                  informações são confidenciais.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Auto-save indicator */}
                <div className="mb-4 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    Rascunho salvo automaticamente
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Etapa {currentStep} de {totalSteps}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {currentStep === 1 && 'Informações Pessoais'}
                      {currentStep === 2 && 'Experiência Profissional'}
                      {currentStep === 3 && 'Documentos e Confirmação'}
                    </span>
                  </div>
                  <Progress value={getStepProgress(currentStep, totalSteps)} className="h-2" />
                </div>

                <form onSubmit={handleSubmit(_handleFormSubmit, (errors) => {
                  console.error('Form validation errors:', errors);

                  // Verificar em qual etapa estão os erros
                  const step1Fields = ['fullName', 'email', 'phone', 'linkedin'];
                  const step2Fields = ['area', 'availability', 'experience', 'education', 'portfolioUrl'];

                  const hasStep1Errors = Object.keys(errors).some(key => step1Fields.includes(key));
                  const hasStep2Errors = Object.keys(errors).some(key => step2Fields.includes(key));

                  // Voltar para a etapa com erro
                  if (hasStep1Errors) {
                    setCurrentStep(1);
                  } else if (hasStep2Errors) {
                    setCurrentStep(2);
                  }

                  // Criar mensagem de erro detalhada
                  const errorMessages = Object.keys(errors).map(key => {
                    const error = errors[key as keyof typeof errors];
                    return `${key}: ${error?.message || 'campo inválido'}`;
                  });

                  toast({
                    title: 'Erro de validação',
                    description: errorMessages.length > 0
                      ? `Por favor, corrija: ${errorMessages.join(', ')}`
                      : 'Verifique se todos os campos obrigatórios estão preenchidos corretamente.',
                    variant: 'destructive',
                  });
                })} className="space-y-6">
                  {currentStep === 1 && (
                    <PersonalInfoStep
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      watchedValues={watchedValues}
                    />
                  )}

                  {currentStep === 2 && (
                    <ProfessionalExperienceStep
                      register={register}
                      errors={errors}
                      watchedValues={watchedValues}
                      setValue={setValue}
                      control={control}
                    />
                  )}

                  {currentStep === 3 && (
                    <DocumentsStep
                      errors={errors}
                      watchedValues={watchedValues}
                      setValue={setValue}
                      resumeFile={resumeFile}
                      setResumeFile={setResumeFile}
                      portfolioFiles={portfolioFiles}
                      handleFileUpload={handleFileUpload}
                      handlePortfolioUpload={handlePortfolioUpload}
                      removePortfolioFile={removePortfolioFile}
                      fileInputRef={fileInputRef}
                      portfolioInputRef={portfolioInputRef}
                    />
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={_handlePrevStep}
                        className="flex-1"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                    )}

                    {currentStep < totalSteps ? (
                      <Button type="button" onClick={_handleNextStep} className="flex-1">
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPreview(true)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !watchedValues.acceptTerms}
                          className="flex-1 bg-primary hover:bg-primary-hover gap-2"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {isSubmitting ? 'Enviando...' : 'Enviar Aplicação'}
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Aviso Importante */}
            <Card className="shadow-soft animate-slide-up border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                    ⚠️ Importante: Seleção por Demanda
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  As contratações são realizadas conforme a demanda de projetos. Manteremos seu
                  perfil em nossa base para futuras oportunidades.
                </p>
              </CardContent>
            </Card>

            {/* Benefícios */}
            <Card className="shadow-soft animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-accent" />
                  <CardTitle className="text-lg">Benefícios de Colaborar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'Flexibilidade de Horários',
                    'Pagamento por Demanda',
                    'Equipe Acolhedora',
                    'Destaque Profissional',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Requisitos */}
            <Card className="shadow-soft animate-slide-up">
              <CardHeader>
                <CardTitle className="text-lg">Requisitos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Formação superior completa ou em andamento</li>
                  <li>• Experiência na área de interesse</li>
                  <li>• Conhecimento de normas acadêmicas (ABNT)</li>
                  <li>• Boa redação e capacidade analítica</li>
                  <li>• Compromisso com prazos e qualidade</li>
                  <li>• Acesso à internet e ferramentas básicas (Word, etc.)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        <PreviewModal
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          watchedValues={watchedValues}
          resumeFile={resumeFile}
          portfolioFiles={portfolioFiles}
          handleSubmit={handleSubmit}
          onSubmit={_handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
