import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const subscribeSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
});

type SubscribeForm = z.infer<typeof subscribeSchema>;

interface NewsletterSignupProps {
  variant?: 'default' | 'inline' | 'modal';
  showCategories?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export function NewsletterSignup({
  variant = 'default',
  showCategories = true,
  title = 'Assine nossa Newsletter',
  description = 'Receba as últimas novidades e artigos diretamente no seu email',
  className = '',
}: NewsletterSignupProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch categories
  const { data: categoriesData } = useApi<{ categories: Category[] }>('/categories');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscribeForm>({
    resolver: zodResolver(subscribeSchema),
  });

  const onSubmit = async (data: SubscribeForm) => {
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao realizar inscrição');
      }

      const result = await response.json();

      setIsSubscribed(true);
      reset();
      setSelectedCategories([]);

      toast({
        title: 'Inscrição realizada!',
        description: result.message || 'Você foi inscrito com sucesso na nossa newsletter',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a inscrição. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    }
  };

  // Inline variant for footer or sidebar
  if (variant === 'inline') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {isSubscribed ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Inscrição realizada com sucesso!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Seu email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Seu nome (opcional)"
                {...register('name')}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full" size="sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscrevendo...
                </>
              ) : (
                'Inscrever-se'
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-6 w-6" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Inscrição realizada!</h3>
              <p className="text-sm text-muted-foreground">
                Obrigado por se inscrever. Você receberá nossas novidades em breve.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsSubscribed(false)}
              size="sm"
            >
              Inscrever outro email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                {...register('name')}
              />
            </div>

            {showCategories && categoriesData?.categories && categoriesData.categories.length > 0 && (
              <div className="space-y-3">
                <Label>Categorias de interesse (opcional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoriesData.categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(category.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscrevendo...
                </>
              ) : (
                'Inscrever-se na Newsletter'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Ao se inscrever, você concorda em receber emails promocionais. Você pode cancelar a inscrição a qualquer momento.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}