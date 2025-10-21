import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApi } from '@/hooks/use-api';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Plus,
  Power,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface ApiIntegration {
  id: string;
  name: string;
  displayName: string;
  environment: 'production' | 'sandbox';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  apiKey?: string;
  apiSecret?: string;
  metadata?: any;
}

interface IntegrationTemplate {
  name: string;
  displayName: string;
  description: string;
  icon: any;
  color: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'textarea';
    placeholder?: string;
    required: boolean;
    options?: { value: string; label: string }[];
    helper?: string;
  }[];
}

const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  {
    name: 'asaas',
    displayName: 'Asaas',
    description: 'Gateway de pagamento para cobranças, PIX e boletos',
    icon: CreditCard,
    color: 'bg-blue-500',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Cole aqui sua API Key do Asaas',
        required: true,
        helper: 'Você pode gerar sua API Key em: Configurações > Integrações no painel Asaas',
      },
      {
        name: 'environment',
        label: 'Ambiente',
        type: 'select',
        required: true,
        options: [
          { value: 'production', label: 'Produção' },
          { value: 'sandbox', label: 'Sandbox (Testes)' },
        ],
        helper: 'Use Sandbox para testes. As API Keys de Sandbox são diferentes das de Produção.',
      },
      {
        name: 'webhookUrl',
        label: 'URL do Webhook (opcional)',
        type: 'text',
        placeholder: 'https://seusite.com.br/api/webhooks/asaas',
        required: false,
        helper: 'URL para receber notificações de eventos de pagamento',
      },
    ],
  },
  {
    name: 'sendgrid',
    displayName: 'SendGrid',
    description: 'Serviço de envio de e-mails transacionais',
    icon: Mail,
    color: 'bg-sky-500',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helper: 'Gere sua API Key em: Settings > API Keys no painel SendGrid. A chave tem 69 caracteres.',
      },
      {
        name: 'senderEmail',
        label: 'E-mail do Remetente',
        type: 'text',
        placeholder: 'noreply@seudominio.com.br',
        required: false,
        helper: 'E-mail padrão usado como remetente dos e-mails',
      },
      {
        name: 'senderName',
        label: 'Nome do Remetente',
        type: 'text',
        placeholder: 'LN Educacional',
        required: false,
        helper: 'Nome que aparecerá como remetente dos e-mails',
      },
    ],
  },
];

export function AdminIntegrations() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<ApiIntegration | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const [formData, setFormData] = useState<Record<string, any>>({
    environment: 'production',
  });

  const {
    data: integrationsData,
    loading,
    error,
    refetch,
  } = useApi<{ integrations: ApiIntegration[]; total: number }>('/admin/integrations');

  const integrations = integrationsData?.integrations || [];

  const handleSelectTemplate = (template: IntegrationTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateSelectOpen(false);

    // Pre-fill form with template defaults
    const defaultValues: Record<string, any> = {
      name: template.name,
      displayName: template.displayName,
      environment: 'production',
    };

    template.fields.forEach((field) => {
      if (field.type === 'select' && field.options && field.options.length > 0) {
        defaultValues[field.name] = field.options[0].value;
      }
    });

    setFormData(defaultValues);
    setIsDialogOpen(true);
  };

  const handleOpenDialog = (integration?: ApiIntegration) => {
    if (integration) {
      setEditingIntegration(integration);

      // Find the template for this integration
      const template = INTEGRATION_TEMPLATES.find(t => t.name === integration.name);
      setSelectedTemplate(template || null);

      setFormData({
        name: integration.name,
        displayName: integration.displayName,
        apiKey: integration.apiKey || '',
        apiSecret: integration.apiSecret || '',
        environment: integration.environment,
        ...(integration.metadata || {}),
      });
      setIsDialogOpen(true);
    } else {
      // Show template selection
      setIsTemplateSelectOpen(true);
    }
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsTemplateSelectOpen(false);
    setEditingIntegration(null);
    setSelectedTemplate(null);
    setFormData({ environment: 'production' });
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Separate metadata fields from standard fields
      const standardFields = ['name', 'displayName', 'apiKey', 'apiSecret', 'environment'];
      const metadata: Record<string, any> = {};

      Object.keys(formData).forEach(key => {
        if (!standardFields.includes(key) && formData[key]) {
          metadata[key] = formData[key];
        }
      });

      const payload = {
        name: formData.name,
        displayName: formData.displayName,
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
        environment: formData.environment,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      const url = editingIntegration
        ? `/admin/integrations/${editingIntegration.id}`
        : '/admin/integrations';

      const method = editingIntegration ? 'PUT' : 'POST';

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3333'}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save integration');
      }

      toast({
        title: 'Sucesso!',
        description: editingIntegration
          ? 'Integração atualizada com sucesso!'
          : 'Integração criada com sucesso!',
      });

      handleCloseDialog();
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar integração',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/admin/integrations/${id}/toggle`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle integration status');
      }

      toast({
        title: 'Sucesso!',
        description: 'Status da integração alterado com sucesso!',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alterar status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta integração?')) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/admin/integrations/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete integration');
      }

      toast({
        title: 'Sucesso!',
        description: 'Integração excluída com sucesso!',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir integração',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold">Erro ao carregar integrações</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Configure as integrações com serviços externos como pagamentos e e-mail
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrações Configuradas</CardTitle>
          <CardDescription>
            Lista de todas as integrações ativas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma integração configurada</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Integração
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell className="font-medium">{integration.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={integration.environment === 'production' ? 'default' : 'secondary'}>
                        {integration.environment === 'production' ? 'Produção' : 'Sandbox'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {integration.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(integration.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(integration.id)}
                          title={integration.isActive ? 'Desativar' : 'Ativar'}
                        >
                          <Power className={`h-4 w-4 ${integration.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(integration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(integration.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Selection Dialog */}
      <Dialog open={isTemplateSelectOpen} onOpenChange={setIsTemplateSelectOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Escolha uma Integração</DialogTitle>
            <DialogDescription>
              Selecione o serviço que deseja integrar ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {INTEGRATION_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${template.color} p-3 rounded-lg text-white`}>
                      <template.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.displayName}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {/* Custom Integration Option */}
            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
              onClick={() => {
                setSelectedTemplate(null);
                setIsTemplateSelectOpen(false);
                setFormData({ environment: 'production' });
                setIsDialogOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-500 p-3 rounded-lg text-white">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Customizada</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Configure uma integração personalizada
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration
                ? `Editar ${selectedTemplate?.displayName || 'Integração'}`
                : `Configurar ${selectedTemplate?.displayName || 'Integração'}`}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? `Preencha os campos abaixo para configurar a integração com ${selectedTemplate.displayName}`
                : 'Configure uma integração personalizada'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {selectedTemplate ? (
                // Render fields from template
                selectedTemplate.fields.map((field) => (
                  <div key={field.name} className="grid gap-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {field.type === 'select' ? (
                      <Select
                        value={formData[field.name] || ''}
                        onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                      />
                    ) : field.type === 'password' ? (
                      <div className="relative">
                        <Input
                          id={field.name}
                          type={
                            (field.name === 'apiKey' && showApiKey) ||
                            (field.name === 'apiSecret' && showApiSecret)
                              ? 'text'
                              : 'password'
                          }
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => {
                            if (field.name === 'apiKey') setShowApiKey(!showApiKey);
                            if (field.name === 'apiSecret') setShowApiSecret(!showApiSecret);
                          }}
                        >
                          {((field.name === 'apiKey' && showApiKey) ||
                            (field.name === 'apiSecret' && showApiSecret)) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}

                    {field.helper && (
                      <p className="text-xs text-muted-foreground">{field.helper}</p>
                    )}
                  </div>
                ))
              ) : (
                // Custom integration fields
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome da Integração (identificador único)
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: mercadopago, pagarme"
                      disabled={!!editingIntegration}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayName">
                      Nome de Exibição
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      value={formData.displayName || ''}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Ex: Mercado Pago"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">
                      Chave da API
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.apiKey || ''}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="Cole aqui a chave da API"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="apiSecret">API Secret (opcional)</Label>
                    <div className="relative">
                      <Input
                        id="apiSecret"
                        type={showApiSecret ? 'text' : 'password'}
                        value={formData.apiSecret || ''}
                        onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                        placeholder="Cole aqui o secret da API (se houver)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                      >
                        {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="environment">Ambiente</Label>
                    <Select
                      value={formData.environment || 'production'}
                      onValueChange={(value: 'production' | 'sandbox') =>
                        setFormData({ ...formData, environment: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Produção</SelectItem>
                        <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingIntegration ? 'Atualizar' : 'Criar'} Integração
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
