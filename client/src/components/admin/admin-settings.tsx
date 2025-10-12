import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, Palette, Save, Shield, Upload } from 'lucide-react';
import { useState } from 'react';

export function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    platformName: 'LN Educacional',
    platformDescription: 'Plataforma de cursos online moderna e intuitiva',
    contactEmail: 'contato@lneducacional.com.br',
    supportEmail: 'suporte@lneducacional.com.br',
    primaryColor: '#1e3a8a',
    accentColor: '#eab308',
    allowRegistration: true,
    requireEmailVerification: true,
    enableNotifications: true,
    enableCertificates: true,
    maxFileSize: '10',
    termsOfService: 'Termos de serviço da plataforma...',
    privacyPolicy: 'Política de privacidade da plataforma...',
  });

  const handleSave = () => {
    toast({
      title: 'Configurações salvas',
      description: 'As configurações da plataforma foram atualizadas com sucesso.',
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-muted-foreground">Gerencie as configurações globais da plataforma</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Informações da Plataforma
              </CardTitle>
              <CardDescription>
                Configure as informações básicas exibidas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Nome da Plataforma</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => handleInputChange('platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">E-mail de Contato</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformDescription">Descrição da Plataforma</Label>
                <Textarea
                  id="platformDescription"
                  value={settings.platformDescription}
                  onChange={(e) => handleInputChange('platformDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalização Visual
              </CardTitle>
              <CardDescription>Customize as cores e aparência da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Cor de Destaque</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload de Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Palette className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher Arquivo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recomendado: 200x200px, formato PNG ou SVG
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Políticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Políticas e Termos
              </CardTitle>
              <CardDescription>
                Configure os termos de uso e política de privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="termsOfService">Termos de Uso</Label>
                <Textarea
                  id="termsOfService"
                  value={settings.termsOfService}
                  onChange={(e) => handleInputChange('termsOfService', e.target.value)}
                  rows={6}
                  placeholder="Digite os termos de uso da plataforma..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Política de Privacidade</Label>
                <Textarea
                  id="privacyPolicy"
                  value={settings.privacyPolicy}
                  onChange={(e) => handleInputChange('privacyPolicy', e.target.value)}
                  rows={6}
                  placeholder="Digite a política de privacidade da plataforma..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com configurações */}
        <div className="space-y-8">
          {/* Configurações de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>Configure as opções de segurança da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Cadastro</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários podem se cadastrar autonomamente
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => handleInputChange('allowRegistration', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verificação de E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir verificação de e-mail no cadastro
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    handleInputChange('requireEmailVerification', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Funcionalidades
              </CardTitle>
              <CardDescription>Ative ou desative funcionalidades da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações</Label>
                  <p className="text-sm text-muted-foreground">Enviar notificações por e-mail</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Certificados</Label>
                  <p className="text-sm text-muted-foreground">Gerar certificados automáticos</p>
                </div>
                <Switch
                  checked={settings.enableCertificates}
                  onCheckedChange={(checked) => handleInputChange('enableCertificates', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Tamanho Máximo de Arquivo (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleInputChange('maxFileSize', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão de Salvar */}
          <Card>
            <CardContent className="p-6">
              <Button onClick={handleSave} className="w-full btn-hero">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
