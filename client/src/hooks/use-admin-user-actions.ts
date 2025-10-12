import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { format } from 'date-fns';
import { useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export function useAdminUserActions(
  fetchUsers: () => void,
  resetForm: () => void,
  setSelectedUser: (user: User | null) => void
) {
  const { toast } = useToast();

  const handleCreate = useCallback(
    async (formData: FormData) => {
      try {
        await api.post('/admin/users', formData);
        toast({
          title: 'Usuário criado com sucesso',
          description: 'O usuário foi adicionado ao sistema',
        });
        resetForm();
        fetchUsers();
        return true;
      } catch (error: unknown) {
        toast({
          title: 'Erro ao criar usuário',
          description: error.response?.data?.message || 'Não foi possível criar o usuário',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchUsers, resetForm]
  );

  const handleUpdate = useCallback(
    async (selectedUser: User, formData: FormData) => {
      if (!selectedUser) return false;

      try {
        const updateData: Partial<FormData> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await api.put(`/admin/users/${selectedUser.id}`, updateData);

        toast({
          title: 'Usuário atualizado com sucesso',
          description: 'As alterações foram salvas',
        });

        resetForm();
        fetchUsers();
        return true;
      } catch (_error) {
        toast({
          title: 'Erro ao atualizar usuário',
          description: 'Não foi possível atualizar o usuário',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchUsers, resetForm]
  );

  const handleDelete = useCallback(
    async (selectedUser: User) => {
      if (!selectedUser) return false;

      try {
        await api.delete(`/admin/users/${selectedUser.id}`);

        toast({
          title: 'Usuário removido',
          description: 'O usuário foi removido com sucesso',
        });

        setSelectedUser(null);
        fetchUsers();
        return true;
      } catch (_error) {
        toast({
          title: 'Erro ao remover usuário',
          description: 'Não foi possível remover o usuário',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchUsers, setSelectedUser]
  );

  const handleExportUsers = useCallback(
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
        return true;
      } catch (_error) {
        toast({
          title: 'Erro ao exportar',
          description: 'Não foi possível exportar os usuários',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleExportUsers,
  };
}
