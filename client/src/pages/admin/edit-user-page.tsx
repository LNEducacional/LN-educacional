import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAdminUsers } from '@/hooks/use-admin-users';
import type { User } from '@/hooks/use-admin-users';
import {
  User as UserIcon,
  Mail,
  Shield,
  Loader2,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const adminUsers = useAdminUsers();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'ADMIN' | 'STUDENT',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    phone: '',
    document: '',
    birthDate: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    avatar: null as File | null,
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        navigate('/admin/usuarios');
        return;
      }

      try {
        setIsLoadingUser(true);
        const userData = await adminUsers.getUserDetails(id);
        if (userData) {
          setUser(userData);
          setFormData({
            name: userData.name,
            email: userData.email,
            password: '',
            role: userData.role,
            status: userData.status,
            phone: userData.profile?.phone || '',
            document: userData.profile?.document || '',
            birthDate: userData.profile?.birthDate
              ? new Date(userData.profile.birthDate).toISOString().split('T')[0]
              : '',
            street: userData.profile?.address?.street || '',
            city: userData.profile?.address?.city || '',
            state: userData.profile?.address?.state || '',
            postalCode: userData.profile?.address?.postalCode || '',
            avatar: null,
          });
        } else {
          toast({
            title: 'Usuário não encontrado',
            description: 'O usuário solicitado não existe.',
            variant: 'destructive',
          });
          navigate('/admin/usuarios');
        }
      } catch (error) {
        toast({
          title: 'Erro ao carregar usuário',
          description: 'Não foi possível carregar os detalhes do usuário.',
          variant: 'destructive',
        });
        navigate('/admin/usuarios');
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, [id, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, avatar: file }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBack = () => {
    navigate('/admin/usuarios');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (!id) return;

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        ...(formData.password && { password: formData.password }),
      };

      const success = await adminUsers.updateUser(id, updateData);

      if (success) {
        toast({
          title: 'Usuário atualizado com sucesso',
          description: 'As alterações foram salvas.',
        });
        navigate('/admin/usuarios');
      }
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingUser) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Carregando...</h2>
                <p className="text-muted-foreground">Buscando informações do usuário</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Editar Usuário</h1>
                  <p className="text-muted-foreground">Atualize as informações do usuário</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Foto do Usuário */}
                {user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Foto do Usuário
                      </CardTitle>
                      <CardDescription>Avatar do perfil do usuário</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                          <AvatarImage
                            src={
                              formData.avatar
                                ? URL.createObjectURL(formData.avatar)
                                : `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                            }
                          />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="relative">
                            <input
                              type="file"
                              id="avatar"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 hover:bg-accent/5 transition-colors">
                              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                              {formData.avatar ? (
                                <p className="text-sm text-primary font-medium">
                                  {formData.avatar.name}
                                </p>
                              ) : (
                                <>
                                  <p className="text-sm text-muted-foreground">
                                    Clique para fazer upload de uma nova foto
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG (max 5MB)
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Informações Básicas
                    </CardTitle>
                    <CardDescription>Dados fundamentais do usuário</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Digite o nome completo"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Digite o email"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Nova Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Deixe em branco para manter a senha atual"
                      />
                      <p className="text-xs text-muted-foreground">
                        Preencha apenas se deseja alterar a senha do usuário
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dados Pessoais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Dados Pessoais
                    </CardTitle>
                    <CardDescription>Informações pessoais do usuário</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document">Documento (CPF)</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="document"
                            value={formData.document}
                            onChange={(e) => handleInputChange('document', e.target.value)}
                            placeholder="000.000.000-00"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Endereço */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Endereço
                    </CardTitle>
                    <CardDescription>Endereço de residência do usuário</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Cidade"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postalCode">CEP</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Função e Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Função e Status
                    </CardTitle>
                    <CardDescription>Defina as permissões e estado do usuário</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="role">Função *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: 'ADMIN' | 'STUDENT') =>
                            handleInputChange('role', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STUDENT">Aluno</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(
                            value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
                          ) => handleInputChange('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Ativo</SelectItem>
                            <SelectItem value="INACTIVE">Inativo</SelectItem>
                            <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
