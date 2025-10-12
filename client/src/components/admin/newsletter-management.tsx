import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Send,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Loader2,
  Search,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  recentSubscribers: number;
  categoryStats: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
    subscriberCount: number;
  }>;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  active: boolean;
  createdAt: string;
  subscriptions: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
}

interface NewsletterNotification {
  id: string;
  subject: string;
  subscriberCount: number;
  sentAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Assunto é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  postId: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  sendToAll: z.boolean().default(false),
});

type SendNewsletterForm = z.infer<typeof sendNewsletterSchema>;

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  description
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  description?: string;
}) => (
  <Card className="card-hover">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

export function NewsletterManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch newsletter stats
  const { data: stats, loading: statsLoading } = useApi<NewsletterStats>(
    '/admin/newsletter/stats'
  );

  // Fetch subscribers
  const { data: subscribersData, loading: subscribersLoading, refetch: refetchSubscribers } = useApi<{
    subscribers: NewsletterSubscriber[];
    pagination: { total: number; skip: number; take: number };
  }>(`/admin/newsletter/subscribers?search=${searchTerm}&active=${statusFilter !== 'all' ? statusFilter : ''}`);

  // Fetch categories
  const { data: categoriesData } = useApi<{ categories: Array<{ id: string; name: string; slug: string }> }>(
    '/categories'
  );

  // Fetch posts for newsletter
  const { data: postsData } = useApi<{ posts: Array<{ id: string; title: string; slug: string }> }>(
    '/blog?take=50'
  );

  // Fetch newsletter history
  const { data: notificationsData } = useApi<{
    notifications: NewsletterNotification[];
    pagination: { total: number; skip: number; take: number };
  }>('/admin/newsletter/notifications');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SendNewsletterForm>({
    resolver: zodResolver(sendNewsletterSchema),
    defaultValues: {
      sendToAll: false,
      categoryIds: [],
    },
  });

  const sendToAll = watch('sendToAll');

  const onSubmit = async (data: SendNewsletterForm) => {
    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          categoryIds: sendToAll ? undefined : selectedCategories,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar newsletter');
      }

      const result = await response.json();

      toast({
        title: 'Newsletter enviada!',
        description: `Newsletter enviada para ${result.subscriberCount} assinantes`,
      });

      setIsDialogOpen(false);
      reset();
      setSelectedCategories([]);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a newsletter',
        variant: 'destructive',
      });
    }
  };

  const loading = statsLoading || subscribersLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
          <p className="text-muted-foreground">
            Gerencie assinantes e envie campanhas de email
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Newsletter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enviar Newsletter</DialogTitle>
              <DialogDescription>
                Crie e envie uma newsletter para seus assinantes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  {...register('subject')}
                  placeholder="Assunto da newsletter"
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postId">Post Relacionado (opcional)</Label>
                <Select onValueChange={(value) => setValue('postId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um post" />
                  </SelectTrigger>
                  <SelectContent>
                    {postsData?.posts?.map((post) => (
                      <SelectItem key={post.id} value={post.id}>
                        {post.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="Conteúdo da newsletter em HTML ou texto"
                  rows={8}
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendToAll"
                    {...register('sendToAll')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sendToAll">Enviar para todos os assinantes</Label>
                </div>

                {!sendToAll && (
                  <div className="space-y-2">
                    <Label>Categorias</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {categoriesData?.categories?.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category.id]);
                              } else {
                                setSelectedCategories(
                                  selectedCategories.filter((id) => id !== category.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Newsletter'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Total de Assinantes"
            value={stats.totalSubscribers.toLocaleString('pt-BR')}
            icon={Users}
            color="text-primary"
          />
          <StatCard
            title="Assinantes Ativos"
            value={stats.activeSubscribers.toLocaleString('pt-BR')}
            icon={UserCheck}
            color="text-green-600"
          />
          <StatCard
            title="Assinantes Inativos"
            value={stats.inactiveSubscribers.toLocaleString('pt-BR')}
            icon={UserX}
            color="text-red-600"
          />
          <StatCard
            title="Novos (30 dias)"
            value={stats.recentSubscribers.toLocaleString('pt-BR')}
            icon={TrendingUp}
            color="text-accent"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscribers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assinantes
            </CardTitle>
            <CardDescription>
              Lista de todos os assinantes da newsletter
            </CardDescription>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscribersData?.subscribers?.map((subscriber) => (
              <div
                key={subscriber.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{subscriber.email}</span>
                    <Badge variant={subscriber.active ? 'default' : 'secondary'}>
                      {subscriber.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {subscriber.name && (
                    <p className="text-sm text-muted-foreground">{subscriber.name}</p>
                  )}
                  {subscriber.subscriptions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {subscriber.subscriptions.map((sub) => (
                        <Badge key={sub.category.id} variant="outline" className="text-xs">
                          {sub.category.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(subscriber.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Newsletter History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Histórico de Newsletters
            </CardTitle>
            <CardDescription>
              Campanhas enviadas recentemente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationsData?.notifications?.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{notification.subject}</h4>
                  {notification.post && (
                    <p className="text-sm text-muted-foreground">
                      Post: {notification.post.title}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{notification.subscriberCount} destinatários</span>
                    <span>{new Date(notification.sentAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Category Stats */}
      {stats?.categoryStats && stats.categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assinantes por Categoria</CardTitle>
            <CardDescription>
              Distribuição de assinantes por categoria de interesse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.categoryStats.map((stat) => (
                <div
                  key={stat.category.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                >
                  <div>
                    <h4 className="font-medium">{stat.category.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.subscriberCount} assinante{stat.subscriberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {stat.subscriberCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}