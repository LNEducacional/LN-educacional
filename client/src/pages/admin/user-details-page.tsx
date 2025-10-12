import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAdminUsers } from '@/hooks/use-admin-users';
import type { User } from '@/hooks/use-admin-users';
import { format } from 'date-fns';
import {
  Loader2,
  Mail,
  Shield,
  User as UserIcon,
  MapPin,
  Activity,
  ShoppingCart,
  Award,
  GraduationCap,
  DollarSign,
  Clock,
  Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRoleBadge = (role: string) => {
  return (
    <Badge variant={role === 'ADMIN' ? 'default' : 'outline'}>
      {role === 'ADMIN' ? (
        <>
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </>
      ) : (
        'Aluno'
      )}
    </Badge>
  );
};

const getStatusBadge = (status: string) => {
  const variants = {
    ACTIVE: { variant: 'default' as const, label: 'Ativo' },
    INACTIVE: { variant: 'secondary' as const, label: 'Inativo' },
    SUSPENDED: { variant: 'destructive' as const, label: 'Suspenso' },
  };

  const config = variants[status as keyof typeof variants] || variants.ACTIVE;

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const adminUsers = useAdminUsers();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        navigate('/admin/usuarios');
        return;
      }

      try {
        setIsLoading(true);
        const userData = await adminUsers.getUserDetails(id);
        if (userData) {
          setUser(userData);
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
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id, navigate, toast]);

  const handleResetPassword = async () => {
    if (!user) return;
    await adminUsers.resetPassword(user.id);
  };

  const handleSuspendUser = async () => {
    if (!user) return;
    await adminUsers.suspendUser(user.id);
    // Recarregar dados
    const userData = await adminUsers.getUserDetails(user.id);
    if (userData) setUser(userData);
  };

  const handleEditUser = () => {
    navigate(`/admin/usuarios/${id}/editar`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="animate-fade-in">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !user ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Usuário não encontrado</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">Detalhes do Usuário</h1>
                        <p className="text-muted-foreground">Informações completas sobre o usuário</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default" onClick={handleEditUser}>
                        Editar Usuário
                      </Button>
                      <Button variant="outline" onClick={handleResetPassword}>
                        Resetar Senha
                      </Button>
                      {user.status !== 'SUSPENDED' && (
                        <Button variant="outline" onClick={handleSuspendUser}>
                          Suspender Usuário
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* User Profile Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-2xl">{user.name}</CardTitle>
                          <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.status || 'ACTIVE')}
                            {user.emailVerified && (
                              <Badge variant="outline" className="gap-1">
                                <Mail className="h-3 w-3" />
                                Verificado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            Email Verificado
                          </p>
                          <p>{user.emailVerified || user.verified ? 'Sim' : 'Não'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Data de Cadastro
                          </p>
                          <p>{format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Último Acesso
                          </p>
                          <p>
                            {user.lastLoginAt
                              ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm')
                              : 'Nunca'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados Pessoais */}
                  {user.profile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          Dados Pessoais
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {user.profile.phone && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                              <p>{user.profile.phone}</p>
                            </div>
                          )}
                          {user.profile.document && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Documento</p>
                              <p>{user.profile.document}</p>
                            </div>
                          )}
                          {user.profile.birthDate && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">
                                Data de Nascimento
                              </p>
                              <p>{format(new Date(user.profile.birthDate), 'dd/MM/yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Endereço */}
                  {user.profile?.address && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Endereço
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {user.profile.address.street && <p>{user.profile.address.street}</p>}
                          <p>
                            {user.profile.address.city && user.profile.address.city}
                            {user.profile.address.state && `, ${user.profile.address.state}`}
                          </p>
                          {user.profile.address.postalCode && (
                            <p className="text-sm text-muted-foreground">
                              CEP: {user.profile.address.postalCode}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Atividade */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Atividade
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4" />
                            Pedidos
                          </p>
                          <p className="text-2xl font-bold">{user._count?.orders || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Certificados
                          </p>
                          <p className="text-2xl font-bold">{user._count?.certificates || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            Cursos Matriculados
                          </p>
                          <p className="text-2xl font-bold">{user.enrollments || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Total em Compras
                          </p>
                          <p className="text-2xl font-bold">
                            R$ {((user.purchasesTotal || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default UserDetailsPage;
