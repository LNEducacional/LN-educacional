import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { User } from '@/hooks/use-admin-users';
import { format } from 'date-fns';
import { Ban, CheckCircle, Edit, Eye, Mail, Shield, Trash2 } from 'lucide-react';

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

interface UserListItemProps {
  user: User;
  onToggleStatus: (user: User) => void;
  onViewDetails: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserListItem({
  user,
  onToggleStatus,
  onViewDetails,
  onEdit,
  onDelete,
}: UserListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.name}</p>
            {getRoleBadge(user.role)}
            {getStatusBadge(user.status)}
            {user.emailVerified && (
              <Badge variant="outline" className="gap-1">
                <Mail className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Cadastro: {format(new Date(user.createdAt), 'dd/MM/yyyy')}</span>
            {user.lastLoginAt && (
              <span>Último acesso: {format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm')}</span>
            )}
            {user.enrollments !== undefined && <span>{user.enrollments} cursos</span>}
            {user.purchasesTotal !== undefined && (
              <span>Total: R$ {(user.purchasesTotal / 100).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={user.status === 'ACTIVE'}
          onCheckedChange={() => onToggleStatus(user)}
          disabled={user.status === 'SUSPENDED'}
        />
        <Button variant="ghost" size="icon" onClick={() => onViewDetails(user)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(user)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
