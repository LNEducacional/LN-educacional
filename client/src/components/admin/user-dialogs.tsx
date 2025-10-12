import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/hooks/use-admin-users';

type FormData = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
};

type AdminUsersHook = {
  toggleUserStatus: (user: User) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  exportUsers: (roleFilter: string, statusFilter: string) => Promise<void>;
  createUser: (formData: FormData) => Promise<boolean>;
  updateUser: (userId: string, updateData: Partial<FormData>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getUserDetails: (userId: string) => Promise<User | null>;
};
import { Ban, CheckCircle, Mail, Shield } from 'lucide-react';

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
    ACTIVE: { variant: 'success' as const, label: 'Ativo', icon: CheckCircle },
    INACTIVE: { variant: 'secondary' as const, label: 'Inativo', icon: Ban },
    SUSPENDED: { variant: 'destructive' as const, label: 'Suspenso', icon: Ban },
  };

  const config = variants[status as keyof typeof variants] || variants.INACTIVE;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>Adicione um novo usuário ao sistema</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Senha inicial"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as 'ADMIN' | 'STUDENT' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Aluno</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Criar Usuário</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Atualize as informações do usuário</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
            <Input
              id="edit-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Deixe em branco para manter a atual"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as 'ADMIN' | 'STUDENT' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Aluno</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} className="w-full">Salvar Alterações</Button>
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  userActions: {
    handleResetPassword: (adminUsers: AdminUsersHook, userId: string) => void;
    handleSuspendUser: (adminUsers: AdminUsersHook, userId: string) => void;
  };
  adminUsers: AdminUsersHook;
  onEditUser: (user: User) => void;
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
  userActions,
  adminUsers,
  onEditUser,
}: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
          <DialogDescription>Informações completas sobre o usuário</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-2 mt-2">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID do Usuário</p>
                <p className="mt-1 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Verificado</p>
                <p className="mt-1">{user.emailVerified ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                <p className="mt-1">{format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Acesso</p>
                <p className="mt-1">
                  {user.lastLoginAt
                    ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm')
                    : 'Nunca'}
                </p>
              </div>
            </div>

            {user.profile && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Informações Pessoais</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {user.profile.phone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                        <p className="mt-1">{user.profile.phone}</p>
                      </div>
                    )}
                    {user.profile.document && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Documento</p>
                        <p className="mt-1">{user.profile.document}</p>
                      </div>
                    )}
                    {user.profile.birthDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Data de Nascimento
                        </p>
                        <p className="mt-1">
                          {format(new Date(user.profile.birthDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {user.profile.address && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Endereço</h4>
                    <div className="space-y-1 text-sm">
                      {user.profile.address.street && <p>{user.profile.address.street}</p>}
                      <p>
                        {user.profile.address.city && user.profile.address.city}
                        {user.profile.address.state && `, ${user.profile.address.state}`}
                      </p>
                      {user.profile.address.postalCode && (
                        <p>CEP: {user.profile.address.postalCode}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cursos Matriculados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.enrollments || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total em Compras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {((user.purchasesTotal || 0) / 100).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Ações Rápidas</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => userActions.handleResetPassword(adminUsers, user.id)}
                >
                  Resetar Senha
                </Button>
                {user.status !== 'SUSPENDED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => userActions.handleSuspendUser(adminUsers, user.id)}
                  >
                    Suspender Usuário
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditUser(user);
                  }}
                >
                  Editar Usuário
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, user, onConfirm }: DeleteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o usuário "{user?.name}"? Esta ação não pode ser desfeita
            e removerá todos os dados associados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
