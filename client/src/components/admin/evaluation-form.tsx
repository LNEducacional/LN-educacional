import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { EvaluationRecommendation } from '@/types/collaborator';

interface EvaluationFormProps {
  applicationId: number;
  applicantName: string;
  onComplete: () => void;
  onCancel: () => void;
}

const criteria = [
  {
    id: 'experience',
    label: 'Experiência',
    description: 'Relevância e qualidade da experiência profissional'
  },
  {
    id: 'skills',
    label: 'Habilidades',
    description: 'Competências técnicas e soft skills'
  },
  {
    id: 'education',
    label: 'Formação',
    description: 'Background acadêmico e educacional'
  },
  {
    id: 'culturalFit',
    label: 'Fit Cultural',
    description: 'Alinhamento com valores e cultura da empresa'
  }
];

const recommendationOptions = [
  { value: 'STRONG_HIRE', label: 'Contratar com certeza', color: 'text-green-600' },
  { value: 'HIRE', label: 'Contratar', color: 'text-green-500' },
  { value: 'MAYBE', label: 'Talvez', color: 'text-yellow-500' },
  { value: 'NO_HIRE', label: 'Não contratar', color: 'text-red-500' },
  { value: 'STRONG_NO_HIRE', label: 'Definitivamente não contratar', color: 'text-red-600' }
];

export function EvaluationForm({ applicationId, applicantName, onComplete, onCancel }: EvaluationFormProps) {
  const { toast } = useToast();

  const [scores, setScores] = useState({
    experienceScore: 5,
    skillsScore: 5,
    educationScore: 5,
    culturalFitScore: 5
  });

  const [recommendation, setRecommendation] = useState<EvaluationRecommendation>('MAYBE');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [`${criterionId}Score`]: value
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTotalScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const handleSubmit = async () => {
    if (!comments.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, adicione comentários sobre a avaliação.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: 'Avaliação salva',
        description: `Avaliação de ${applicantName} foi salva com sucesso.`,
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar avaliação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Avaliação do Candidato</CardTitle>
        <CardDescription>
          Avalie {applicantName} em cada critério de 0 a 10
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Critérios de Avaliação */}
        {criteria.map((criterion) => {
          const score = scores[`${criterion.id}Score` as keyof typeof scores];
          return (
            <div key={criterion.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-base font-medium">{criterion.label}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {criterion.description}
                  </p>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>

              <Slider
                value={[score]}
                onValueChange={([value]) => handleScoreChange(criterion.id, value)}
                max={10}
                min={0}
                step={0.5}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 - Insatisfatório</span>
                <span>5 - Satisfatório</span>
                <span>10 - Excelente</span>
              </div>
            </div>
          );
        })}

        <Separator />

        {/* Pontuação Total */}
        <div className={`p-4 rounded-lg border-2 ${getTotalScoreColor(totalScore)}`}>
          <div className="text-center">
            <Label className="text-lg font-semibold">Pontuação Total</Label>
            <div className="text-4xl font-bold mt-2">
              {totalScore.toFixed(1)}/10
            </div>
            <p className="text-sm mt-1">
              Média das 4 avaliações
            </p>
          </div>
        </div>

        {/* Recomendação */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Recomendação Final</Label>
          <RadioGroup value={recommendation} onValueChange={(value) => setRecommendation(value as EvaluationRecommendation)}>
            {recommendationOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className={`cursor-pointer ${option.color}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Comentários */}
        <div className="space-y-2">
          <Label htmlFor="comments" className="text-base font-medium">
            Comentários e Observações <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Adicione suas observações sobre o candidato, pontos fortes, áreas de melhoria, e justificativa para sua recomendação..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {comments.length}/500 caracteres
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !comments.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Salvando...' : 'Enviar Avaliação'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}