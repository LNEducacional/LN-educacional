import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/hooks/use-admin-users';
import { useAdminUsers } from '@/hooks/use-admin-users';

import { UserStatsCards } from '@/components/admin/user-stats-cards';
import { UsersListContent } from '@/components/admin/users-list-content';
import { UsersPageHeader } from '@/components/admin/users-page-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type AdminUsersHook = ReturnType<typeof useAdminUsers>;
type SortField = 'name' | 'email' | 'role' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function useUserActions() {
  return {
    handleToggleStatus: async (adminUsers: AdminUsersHook, user: User) => {
      await adminUsers.toggleUserStatus(user);
    },
    handleSuspendUser: async (adminUsers: AdminUsersHook, userId: string) => {
      await adminUsers.suspendUser(userId);
    },
    handleResetPassword: async (adminUsers: AdminUsersHook, userId: string) => {
      await adminUsers.resetPassword(userId);
    },
    handleExportUsers: async (
      adminUsers: AdminUsersHook,
      roleFilter: string,
      statusFilter: string
    ) => {
      await adminUsers.exportUsers(roleFilter, statusFilter);
    },
  };
}


export function AdminUsersPage() {
  const navigate = useNavigate();
  const adminUsers = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userActions = useUserActions();

  useEffect(() => {
    adminUsers.fetchUsers(searchQuery, roleFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, statusFilter]);

  // Handler para alternar ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtragem e ordenação
  const filteredAndSortedUsers = useMemo(() => {
    let sorted = [...adminUsers.users];

    sorted.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [adminUsers.users, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, currentPage]);

  // Reset para página 1 quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const openDetailsDialog = async (user: User) => {
    navigate(`/admin/usuarios/${user.id}`);
  };

  const openEditDialog = (user: User) => {
    navigate(`/admin/usuarios/${user.id}/editar`);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    const success = await adminUsers.deleteUser(selectedUser.id);
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="animate-fade-in space-y-8">
              <UsersPageHeader
                onExport={() => userActions.handleExportUsers(adminUsers, roleFilter, statusFilter)}
                onCreateUser={() => navigate('/admin/usuarios/adicionar')}
              />

              <UserStatsCards stats={adminUsers.stats} />

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                  <CardDescription>Use os filtros abaixo para encontrar usuários específicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Funções</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="STUDENT">Aluno</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                        <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Usuários ({adminUsers.stats?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <UsersListContent
                    loading={adminUsers.loading}
                    users={paginatedUsers}
                    onToggleStatus={(user) => userActions.handleToggleStatus(adminUsers, user)}
                    onViewDetails={openDetailsDialog}
                    onEdit={openEditDialog}
                    onDelete={(user) => {
                      setSelectedUser(user);
                      setIsDeleteDialogOpen(true);
                    }}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  {/* Paginação - sempre mostrar */}
                  {!adminUsers.loading && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {filteredAndSortedUsers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a{' '}
                        {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} de{' '}
                        {filteredAndSortedUsers.length} usuário(s)
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="h-8 w-8"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="h-8 w-8"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir o usuário "{selectedUser?.name}"? Esta ação não
                      pode ser desfeita e removerá todos os dados associados.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      Excluir Usuário
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AdminUsersPage;
