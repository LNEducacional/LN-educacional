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
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Power,
  Trash2,
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

export function AdminIntegrations() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ApiIntegration | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    apiKey: '',
    apiSecret: '',
    environment: 'production' as 'production' | 'sandbox',
  });

  const {
    data: integrationsData,
    loading,
    error,
    refetch,
  } = useApi<{ integrations: ApiIntegration[]; total: number }>('/admin/integrations');

  const integrations = integrationsData?.integrations || [];

  const handleOpenDialog = (integration?: ApiIntegration) => {
    if (integration) {
      setEditingIntegration(integration);
      setFormData({
        name: integration.name,
        displayName: integration.displayName,
        apiKey: integration.apiKey || '',
        apiSecret: integration.apiSecret || '',
        environment: integration.environment,
      });
    } else {
      setEditingIntegration(null);
      setFormData({
        name: '',
        displayName: '',
        apiKey: '',
        apiSecret: '',
        environment: 'production',
      });
    }
    setIsDialogOpen(true);
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIntegration(null);
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save integration');
      }

      toast({
        title: 'Sucesso',
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
        title: 'Sucesso',
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
        title: 'Sucesso',
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
            Gerencie as chaves de API para integrações com serviços externos
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
            Lista de todas as integrações de API configuradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma integração configurada</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'Editar Integração' : 'Nova Integração'}
            </DialogTitle>
            <DialogDescription>
              {editingIntegration
                ? 'Atualize as informações da integração'
                : 'Adicione uma nova integração de API'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Integração (identificador único)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: asaas, stripe, pagseguro"
                  disabled={!!editingIntegration}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Ex: Asaas Pagamentos"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="apiKey">Chave da API</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
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
                    value={formData.apiSecret}
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
                  value={formData.environment}
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
