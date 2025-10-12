import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { format } from 'date-fns';
import { useCallback, useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  verified: boolean;
  emailVerified?: boolean; // Mantido para compatibilidade
  createdAt: string;
  lastLoginAt?: string;
  enrollments?: number;
  purchasesTotal?: number;
  _count?: {
    orders: number;
    certificates: number;
  };
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

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  admins: number;
  students: number;
  newThisMonth: number;
  activeToday: number;
}

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(
    async (searchQuery: string, roleFilter: string, statusFilter: string) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (searchQuery) params.search = searchQuery;
        if (roleFilter !== 'all') params.role = roleFilter;
        if (statusFilter !== 'all') params.status = statusFilter;

        console.log('Fetching users with params:', params);

        const usersResponse = await api.get('/admin/users', { params });

        console.log('Users response:', usersResponse);
        console.log('Users response data:', usersResponse.data);
        console.log('Users array:', usersResponse.data?.users);

        // A API retorna { users: [...], total: number }
        // Mapear os dados da API para o formato esperado
        const usersArray = usersResponse.data?.users || [];
        console.log('Users array length:', usersArray.length);

        const mappedUsers = usersArray.map((user: any) => ({
          ...user,
          status: user.status || 'ACTIVE', // Adicionar status padrão se não existir
          emailVerified: user.verified || user.emailVerified || false, // Mapear verified para emailVerified
        }));

        console.log('Mapped users:', mappedUsers);
        console.log('Setting users to state...');
        setUsers(mappedUsers);

        // Calcular stats localmente já que a rota não existe
        const calculatedStats: UserStats = {
          total: mappedUsers.length,
          active: mappedUsers.filter((u: User) => u.status === 'ACTIVE').length,
          inactive: mappedUsers.filter((u: User) => u.status === 'INACTIVE').length,
          suspended: mappedUsers.filter((u: User) => u.status === 'SUSPENDED').length,
          admins: mappedUsers.filter((u: User) => u.role === 'ADMIN').length,
          students: mappedUsers.filter((u: User) => u.role === 'STUDENT').length,
          newThisMonth: 0, // Não podemos calcular sem data atual
          activeToday: 0, // Não podemos calcular sem lastLoginAt
        };

        console.log('Calculated stats:', calculatedStats);
        setStats(calculatedStats);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        console.error('Error response:', error?.response);
        console.error('Error data:', error?.response?.data);
        toast({
          title: 'Erro ao carregar usuários',
          description: error?.response?.data?.error || error?.response?.data?.message || 'Não foi possível carregar a lista de usuários',
          variant: 'destructive',
        });
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    },
    [toast]
  );

  const toggleUserStatus = useCallback(
    async (user: User) => {
      try {
        const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });

        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));

        toast({
          title: 'Status atualizado',
          description: `O usuário foi ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'} com sucesso`,
        });
      } catch {
        toast({
          title: 'Erro ao alterar status',
          description: 'Não foi possível alterar o status do usuário',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const suspendUser = useCallback(
    async (userId: string) => {
      try {
        await api.patch(`/admin/users/${userId}/suspend`);

        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'SUSPENDED' } : u)));

        toast({
          title: 'Usuário suspenso',
          description: 'O usuário foi suspenso com sucesso',
        });
      } catch {
        toast({
          title: 'Erro ao suspender usuário',
          description: 'Não foi possível suspender o usuário',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const resetPassword = useCallback(
    async (userId: string) => {
      try {
        const response = await api.post(`/admin/users/${userId}/reset-password`);

        toast({
          title: 'Senha resetada',
          description: `Nova senha temporária: ${response.data.temporaryPassword}`,
        });
      } catch {
        toast({
          title: 'Erro ao resetar senha',
          description: 'Não foi possível resetar a senha do usuário',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const exportUsers = useCallback(
    async (roleFilter: string, statusFilter: string) => {
      try {
        const response = await api.get('/admin/users/export', {
          responseType: 'blob',
          params: {
            role: roleFilter !== 'all' ? roleFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          },
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `usuarios-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast({
          title: 'Exportação concluída',
          description: 'Os usuários foram exportados com sucesso',
        });
      } catch {
        toast({
          title: 'Erro ao exportar',
          description: 'Não foi possível exportar os usuários',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const createUser = useCallback(
    async (userData: {
      name: string;
      email: string;
      password: string;
      role: 'ADMIN' | 'STUDENT';
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    }) => {
      try {
        await api.post('/admin/users', userData);

        toast({
          title: 'Usuário criado com sucesso',
          description: 'O usuário foi adicionado ao sistema',
        });

        return true;
      } catch (error: unknown) {
        const errorMessage =
          typeof error === 'object' &&
          error &&
          'response' in error &&
          typeof error.response === 'object' &&
          error.response &&
          'data' in error.response &&
          typeof error.response.data === 'object' &&
          error.response.data &&
          'message' in error.response.data
            ? String(error.response.data.message)
            : 'Não foi possível criar o usuário';

        toast({
          title: 'Erro ao criar usuário',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      userData: {
        name?: string;
        email?: string;
        role?: 'ADMIN' | 'STUDENT';
        status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
        password?: string;
      }
    ) => {
      try {
        console.log('Updating user:', userId, userData);

        // Remover campos que não devem ser enviados
        const { status, password, ...dataToSend } = userData;

        const response = await api.put(`/admin/users/${userId}`, dataToSend);
        console.log('Update response:', response.data);

        // Atualizar lista local
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  ...response.data,
                  status: response.data.status || u.status || 'ACTIVE',
                  emailVerified: response.data.verified || response.data.emailVerified || u.emailVerified,
                }
              : u
          )
        );

        toast({
          title: 'Usuário atualizado com sucesso',
          description: 'As alterações foram salvas',
        });

        return true;
      } catch (error: any) {
        console.error('Error updating user:', error);
        toast({
          title: 'Erro ao atualizar usuário',
          description: error?.response?.data?.error || 'Não foi possível atualizar o usuário',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        console.log('Deleting user:', userId);
        await api.delete(`/admin/users/${userId}`);

        // Remover da lista local
        setUsers((prev) => prev.filter((u) => u.id !== userId));

        // Atualizar stats
        if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1,
          });
        }

        toast({
          title: 'Usuário removido',
          description: 'O usuário foi removido com sucesso',
        });

        return true;
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast({
          title: 'Erro ao remover usuário',
          description: error?.response?.data?.error || 'Não foi possível remover o usuário',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, stats]
  );

  const getUserDetails = useCallback(
    async (userId: string) => {
      try {
        console.log('Fetching user details for:', userId);
        const response = await api.get(`/admin/users/${userId}`);
        console.log('User details response:', response.data);

        // Mapear os dados
        const user = {
          ...response.data,
          status: response.data.status || 'ACTIVE',
          emailVerified: response.data.verified || response.data.emailVerified || false,
        };

        console.log('Mapped user details:', user);
        return user;
      } catch (error: any) {
        console.error('Error fetching user details:', error);
        toast({
          title: 'Erro ao carregar detalhes',
          description: error?.response?.data?.error || 'Não foi possível carregar os detalhes do usuário',
          variant: 'destructive',
        });
        return null;
      }
    },
    [toast]
  );

  return {
    users,
    stats,
    loading,
    fetchUsers,
    toggleUserStatus,
    suspendUser,
    resetPassword,
    exportUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserDetails,
  };
};
