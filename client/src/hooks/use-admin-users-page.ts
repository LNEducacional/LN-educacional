import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { useCallback, useEffect, useRef, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  enrollments?: number;
  purchasesTotal?: number;
  profile?: {
    phone?: string;
    document?: string;
    birthDate?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
  };
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  admins: number;
  students: number;
  newThisMonth: number;
  activeToday: number;
}

export function useAdminUsersPage() {
  const isMountedRef = useRef(false);
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const [usersResponse, statsResponse] = await Promise.all([
        api.get('/admin/users', { params }),
        api.get('/admin/users/stats'),
      ]);

      if (!isMountedRef.current) return;

      setUsers(usersResponse.data);
      setStats(statsResponse.data);
    } catch (_error) {
      if (!isMountedRef.current) return;

      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [searchQuery, roleFilter, statusFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = useCallback(
    async (user: User) => {
      try {
        const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });

        fetchUsers();
        toast({
          title: 'Status atualizado',
          description: `O usuário foi ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'} com sucesso`,
        });
      } catch (_error) {
        toast({
          title: 'Erro ao alterar status',
          description: 'Não foi possível alterar o status do usuário',
          variant: 'destructive',
        });
      }
    },
    [fetchUsers, toast]
  );

  const handleSuspendUser = useCallback(
    async (userId: string) => {
      try {
        await api.patch(`/admin/users/${userId}/suspend`);

        fetchUsers();
        toast({
          title: 'Usuário suspenso',
          description: 'O usuário foi suspenso com sucesso',
        });
      } catch (_error) {
        toast({
          title: 'Erro ao suspender usuário',
          description: 'Não foi possível suspender o usuário',
          variant: 'destructive',
        });
      }
    },
    [fetchUsers, toast]
  );

  const handleResetPassword = useCallback(
    async (userId: string) => {
      try {
        const response = await api.post(`/admin/users/${userId}/reset-password`);

        toast({
          title: 'Senha resetada',
          description: `Nova senha temporária: ${response.data.temporaryPassword}`,
        });
      } catch (_error) {
        toast({
          title: 'Erro ao resetar senha',
          description: 'Não foi possível resetar a senha do usuário',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const openDetailsDialog = useCallback(
    async (user: User) => {
      try {
        const response = await api.get(`/admin/users/${user.id}`);

        if (isMountedRef.current) {
          setSelectedUser(response.data);
        }
      } catch (_error) {
        if (isMountedRef.current) {
          toast({
            title: 'Erro ao carregar detalhes',
            description: 'Não foi possível carregar os detalhes do usuário',
            variant: 'destructive',
          });
        }
      }
    },
    [toast]
  );

  return {
    users,
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    selectedUser,
    setSelectedUser,
    fetchUsers,
    handleToggleStatus,
    handleSuspendUser,
    handleResetPassword,
    openDetailsDialog,
  };
}
