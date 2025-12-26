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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import {
  Mail,
  Send,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Loader2,
  Search,
  Settings,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
  post?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface EmailConfig {
  provider: string;
  fromEmail: string;
  apiKey: string;
  configured: boolean;
}

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Assunto é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  postId: z.string().optional(),
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
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [excludedEmails, setExcludedEmails] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const { toast } = useToast();

  // Email config state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'sendgrid',
    fromEmail: 'noreply@lneducacional.com.br',
    apiKey: '',
    configured: false,
  });

  // Fetch newsletter stats
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi<NewsletterStats>(
    '/admin/newsletter/stats'
  );

  // Fetch subscribers
  const { data: subscribersData, loading: subscribersLoading, refetch: refetchSubscribers } = useApi<{
    subscribers: NewsletterSubscriber[];
    pagination: { total: number; skip: number; take: number };
  }>(`/admin/newsletter/subscribers?search=${searchTerm}&active=${statusFilter !== 'all' ? statusFilter : ''}&take=100`);

  // Fetch posts for newsletter
  const { data: postsData } = useApi<{ posts: Array<{ id: string; title: string; slug: string }> }>(
    '/blog?take=50'
  );

  // Fetch newsletter history
  const { data: notificationsData } = useApi<{
    notifications: NewsletterNotification[];
    pagination: { total: number; skip: number; take: number };
  }>('/admin/newsletter/notifications');

  // Fetch email config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/admin/settings/email');
        if (response.data) {
          setEmailConfig({
            provider: response.data.provider || 'sendgrid',
            fromEmail: response.data.fromEmail || 'noreply@lneducacional.com.br',
            apiKey: response.data.apiKey || '',
            configured: response.data.configured || false,
          });
        }
      } catch (error) {
        console.log('Email config not found, using defaults');
      }
    };
    fetchConfig();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SendNewsletterForm>({
    resolver: zodResolver(sendNewsletterSchema),
  });

  // Get active subscribers for sending
  const activeSubscribers = subscribersData?.subscribers?.filter(s => s.active) || [];

  // Calculate recipients (all selected minus excluded)
  const getRecipients = () => {
    if (selectAll) {
      return activeSubscribers.filter(s => !excludedEmails.has(s.id));
    }
    return activeSubscribers.filter(s => selectedEmails.has(s.id));
  };

  const recipients = getRecipients();

  const handleToggleEmail = (id: string) => {
    if (selectAll) {
      // In "select all" mode, toggle exclusion
      const newExcluded = new Set(excludedEmails);
      if (newExcluded.has(id)) {
        newExcluded.delete(id);
      } else {
        newExcluded.add(id);
      }
      setExcludedEmails(newExcluded);
    } else {
      // In manual selection mode, toggle selection
      const newSelected = new Set(selectedEmails);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedEmails(newSelected);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      // Switching to manual mode - start with none selected
      setSelectAll(false);
      setSelectedEmails(new Set());
      setExcludedEmails(new Set());
    } else {
      // Switching to select all mode
      setSelectAll(true);
      setSelectedEmails(new Set());
      setExcludedEmails(new Set());
    }
  };

  const isEmailSelected = (id: string) => {
    if (selectAll) {
      return !excludedEmails.has(id);
    }
    return selectedEmails.has(id);
  };

  const onSubmit = async (data: SendNewsletterForm) => {
    if (recipients.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um destinatário',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post('/admin/newsletter/send', {
        ...data,
        subscriberIds: recipients.map(r => r.id),
      });

      toast({
        title: 'Newsletter enviada!',
        description: `Newsletter enviada para ${response.data.subscriberCount} assinantes`,
      });

      setIsDialogOpen(false);
      reset();
      setSelectedEmails(new Set());
      setExcludedEmails(new Set());
      setSelectAll(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a newsletter',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.post('/admin/settings/email', {
        provider: emailConfig.provider,
        fromEmail: emailConfig.fromEmail,
        apiKey: emailConfig.apiKey,
      });

      toast({
        title: 'Configurações salvas!',
        description: 'As configurações de email foram atualizadas com sucesso.',
      });

      setEmailConfig(prev => ({ ...prev, configured: true }));
      setIsConfigOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    } finally {
      setSavingConfig(false);
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
        <div className="flex gap-2">
          {/* Config Button */}
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar Email
                {emailConfig.configured ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações de Email</DialogTitle>
                <DialogDescription>
                  Configure o SendGrid para enviar emails reais
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor</Label>
                  <Select
                    value={emailConfig.provider}
                    onValueChange={(value) => setEmailConfig(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="resend">Resend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Remetente</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailConfig.fromEmail}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="noreply@seudominio.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">Chave API ({emailConfig.provider === 'sendgrid' ? 'SendGrid' : 'Resend'})</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={emailConfig.apiKey}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={emailConfig.provider === 'sendgrid' ? 'SG.xxxxxxxx...' : 're_xxxxxxxx...'}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {emailConfig.provider === 'sendgrid'
                      ? 'Obtenha sua chave em: https://app.sendgrid.com/settings/api_keys'
                      : 'Obtenha sua chave em: https://resend.com/api-keys'
                    }
                  </p>
                </div>

                {emailConfig.configured && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Email configurado e pronto para envio
                    </span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig} disabled={savingConfig}>
                  {savingConfig ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send Newsletter Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Enviar Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enviar Newsletter</DialogTitle>
                <DialogDescription>
                  Selecione os destinatários e crie sua newsletter
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Recipients Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Destinatários</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="selectAll"
                          checked={selectAll}
                          onCheckedChange={handleSelectAllToggle}
                        />
                        <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                          Selecionar todos
                        </Label>
                      </div>
                      <Badge variant="secondary">
                        {recipients.length} de {activeSubscribers.length} selecionados
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {activeSubscribers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Nenhum assinante ativo encontrado
                      </div>
                    ) : (
                      <div className="divide-y">
                        {activeSubscribers.map((subscriber) => (
                          <div
                            key={subscriber.id}
                            className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                              !isEmailSelected(subscriber.id) ? 'opacity-50' : ''
                            }`}
                            onClick={() => handleToggleEmail(subscriber.id)}
                          >
                            <Checkbox
                              checked={isEmailSelected(subscriber.id)}
                              onCheckedChange={() => handleToggleEmail(subscriber.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{subscriber.email}</p>
                              {subscriber.name && (
                                <p className="text-xs text-muted-foreground truncate">{subscriber.name}</p>
                              )}
                            </div>
                            {isEmailSelected(subscriber.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectAll && excludedEmails.size > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {excludedEmails.size} email(s) excluído(s) do envio
                    </p>
                  )}
                </div>

                <Separator />

                {/* Email Content Section */}
                <div className="space-y-4">
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
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || recipients.length === 0}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar para {recipients.length} destinatário(s)
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
              Lista de Emails
            </CardTitle>
            <CardDescription>
              Todos os emails cadastrados na newsletter
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
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {subscribersData?.subscribers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum email cadastrado</p>
              </div>
            ) : (
              subscribersData?.subscribers?.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{subscriber.email}</span>
                      <Badge variant={subscriber.active ? 'default' : 'secondary'} className="flex-shrink-0">
                        {subscriber.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {subscriber.name && (
                      <p className="text-sm text-muted-foreground truncate">{subscriber.name}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {new Date(subscriber.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Newsletter History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Histórico de Envios
            </CardTitle>
            <CardDescription>
              Campanhas enviadas recentemente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {notificationsData?.notifications?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma newsletter enviada ainda</p>
              </div>
            ) : (
              notificationsData?.notifications?.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{notification.subject}</h4>
                    {notification.post && (
                      <p className="text-sm text-muted-foreground truncate">
                        Post: {notification.post.title}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{notification.subscriberCount} destinatários</span>
                      <span>{new Date(notification.sentAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
