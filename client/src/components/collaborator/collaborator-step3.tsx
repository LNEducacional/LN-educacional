import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CollaboratorFormData } from '@/types/collaborator';
import { Upload, X } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

interface CollaboratorStep3Props {
  register: UseFormRegister<CollaboratorFormData>;
  errors: FieldErrors<CollaboratorFormData>;
  resumeFile: File | null;
  portfolioFiles: File[];
  onResumeUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPortfolioUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveResumeFile: () => void;
  onRemovePortfolioFile: (index: number) => void;
  resumeInputRef: React.RefObject<HTMLInputElement>;
  portfolioInputRef: React.RefObject<HTMLInputElement>;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function CollaboratorStep3({
  register,
  errors,
  resumeFile,
  portfolioFiles,
  onResumeUpload,
  onPortfolioUpload,
  onRemoveResumeFile,
  onRemovePortfolioFile,
  resumeInputRef,
  portfolioInputRef,
  onPrevious,
  onSubmit,
  isSubmitting,
}: CollaboratorStep3Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos e Portfólio</CardTitle>
        <CardDescription>
          Anexe seu currículo e materiais que demonstrem seu trabalho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="skills">Principais Habilidades</Label>
          <Textarea
            id="skills"
            {...register('skills')}
            placeholder="Liste suas principais habilidades e competências técnicas..."
            className={`resize-none ${errors.skills ? 'border-destructive' : ''}`}
            rows={3}
          />
          {errors.skills && (
            <p className="text-sm text-destructive mt-1">{errors.skills.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="previousWork">Trabalhos Anteriores</Label>
          <Textarea
            id="previousWork"
            {...register('previousWork')}
            placeholder="Descreva seus trabalhos e projetos anteriores relevantes..."
            className={`resize-none ${errors.previousWork ? 'border-destructive' : ''}`}
            rows={4}
          />
          {errors.previousWork && (
            <p className="text-sm text-destructive mt-1">{errors.previousWork.message}</p>
          )}
        </div>

        <div>
          <Label>Currículo (PDF) *</Label>
          <div className="mt-2">
            {resumeFile ? (
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <span className="text-sm font-medium">{resumeFile.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={onRemoveResumeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors w-full border-none bg-transparent"
                onClick={() => resumeInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para enviar seu currículo (PDF, máx. 5MB)
                </p>
              </button>
            )}
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf"
              onChange={onResumeUpload}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <Label>Portfólio (Opcional)</Label>
          <div className="mt-2 space-y-2">
            {portfolioFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between p-3 bg-accent rounded-lg"
              >
                <span className="text-sm font-medium">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePortfolioFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <button
              type="button"
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors w-full border-none bg-transparent"
              onClick={() => portfolioInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Adicionar arquivos do portfólio (PDF, DOC, DOCX, máx. 5MB cada)
              </p>
            </button>
            <input
              ref={portfolioInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={onPortfolioUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Anterior
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting || !resumeFile}>
            {isSubmitting ? 'Enviando...' : 'Enviar Candidatura'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
