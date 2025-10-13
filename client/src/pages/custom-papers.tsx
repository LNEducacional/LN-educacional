import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ACADEMIC_AREAS, PAPER_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { customPapersService } from '@/services/custom-papers.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { CalendarIcon, CheckCircle2, Info, Upload, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const requestSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(50, 'Descrição deve ter pelo menos 50 caracteres'),
  paperType: z.enum([
    'article',
    'review',
    'thesis',
    'dissertation',
    'project',
    'essay',
    'summary',
    'monography',
    'case_study',
  ] as const),
  academicArea: z.enum([
    'administration',
    'law',
    'education',
    'engineering',
    'psychology',
    'health',
    'accounting',
    'arts',
    'economics',
    'social_sciences',
    'other',
    'exact_sciences',
    'biological_sciences',
    'health_sciences',
    'applied_social_sciences',
    'humanities',
    'languages',
    'agricultural_sciences',
    'multidisciplinary',
  ] as const),
  pageCount: z.number().min(1).max(500),
  deadline: z.date().min(addDays(new Date(), 1), 'Prazo deve ser pelo menos 1 dia no futuro'),
  urgency: z.enum(['NORMAL', 'URGENT', 'VERY_URGENT']),
  requirements: z.string().min(20, 'Requisitos devem ter pelo menos 20 caracteres'),
  keywords: z.string().optional(),
  references: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function CustomPapersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      urgency: 'NORMAL',
      pageCount: 10,
      deadline: addDays(new Date(), 7),
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: RequestFormData) => {
      const payload = {
        ...data,
        deadline: data.deadline.toISOString(),
        requirementFiles: uploadedFiles,
      };
      return customPapersService.createRequest(payload);
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi recebida. Você receberá um orçamento em breve.',
      });
      navigate('/student?tab=custom-papers');
    },
    onError: () => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: RequestFormData) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para solicitar um trabalho personalizado.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    createRequestMutation.mutate(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement file upload logic
    // This would upload to your storage service and return URLs
    const files = Array.from(e.target.files || []);
    // Simulated upload - replace with actual upload logic
    const fileUrls = files.map((f) => `https://storage.example.com/${f.name}`);
    setUploadedFiles((prev) => [...prev, ...fileUrls]);
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const urgencyPricing = {
    NORMAL: 'Preço padrão',
    URGENT: '+30% no valor',
    VERY_URGENT: '+50% no valor',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Solicitar Trabalho Personalizado</h1>
        <p className="text-muted-foreground">
          Precisa de um trabalho acadêmico específico? Preencha o formulário abaixo e receba um
          orçamento personalizado.
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona:</strong>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>Você envia sua solicitação com todos os requisitos</li>
            <li>Nossa equipe analisa e envia um orçamento</li>
            <li>Após aprovação, iniciamos o trabalho</li>
            <li>Você recebe o trabalho completo no prazo acordado</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Detalhes principais sobre o trabalho desejado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Trabalho</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Análise do Impacto da IA na Educação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Detalhada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o que você precisa, objetivos, metodologia desejada..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Quanto mais detalhes, melhor será nosso orçamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paperType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Trabalho</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PAPER_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="academicArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área Acadêmica</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ACADEMIC_AREAS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requisitos e Especificações</CardTitle>
              <CardDescription>Informações técnicas e requisitos específicos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Páginas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Entrega</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-2 shadow-lg rounded-lg" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < addDays(new Date(), 1)}
                            initialFocus
                            className="rounded-lg"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NORMAL">Normal (7+ dias)</SelectItem>
                          <SelectItem value="URGENT">Urgente (3-6 dias)</SelectItem>
                          <SelectItem value="VERY_URGENT">Muito Urgente (1-2 dias)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {urgencyPricing[field.value as keyof typeof urgencyPricing]}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos Específicos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Normas ABNT, citações específicas, estrutura desejada, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavras-chave</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Separe por vírgulas: inovação, tecnologia, educação"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="references"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referências Obrigatórias</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste autores, livros ou artigos que devem ser citados"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Arquivos de Apoio</FormLabel>
                <div className="mt-2">
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Clique para enviar arquivos de referência
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX até 10MB cada</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">Arquivos enviados:</p>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md group hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm truncate">{file.split('/').pop()}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover arquivo</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Após enviar sua solicitação, você receberá um orçamento em até 24 horas. O
                    pagamento será solicitado apenas após sua aprovação do orçamento.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
                  {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
