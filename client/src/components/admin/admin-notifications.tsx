import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCheck,
  Clock,
  Eye,
  Filter,
  Search,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'course' | 'system' | 'alert';
  timestamp: string;
  fullTimestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function AdminNotifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Novo usuário cadastrado',
      description:
        'Maria Silva (maria.silva@email.com) se registrou na plataforma e está aguardando aprovação do perfil.',
      type: 'user',
      timestamp: '2 min atrás',
      fullTimestamp: '2024-12-06 14:30:15',
      isRead: false,
      priority: 'medium',
    },
    {
      id: '2',
      title: 'Curso publicado com sucesso',
      description:
        'O curso "React Avançado" foi publicado com sucesso e está disponível para matrículas.',
      type: 'course',
      timestamp: '15 min atrás',
      fullTimestamp: '2024-12-06 14:15:22',
      isRead: false,
      priority: 'low',
    },
    {
      id: '3',
      title: 'Falha crítica no sistema de backup',
      description:
        'O backup automático falhou às 03:00. Verifique a configuração do servidor imediatamente.',
      type: 'alert',
      timestamp: '1 hora atrás',
      fullTimestamp: '2024-12-06 13:30:00',
      isRead: false,
      priority: 'high',
    },
    {
      id: '4',
      title: 'Sistema atualizado',
      description:
        'O sistema foi atualizado para a versão 2.1.0 com melhorias de performance e correção de bugs.',
      type: 'system',
      timestamp: '2 horas atrás',
      fullTimestamp: '2024-12-06 12:30:45',
      isRead: true,
      priority: 'medium',
    },
    {
      id: '5',
      title: 'Relatório mensal disponível',
      description:
        'O relatório mensal de novembro está pronto para visualização no painel de analytics.',
      type: 'system',
      timestamp: '3 horas atrás',
      fullTimestamp: '2024-12-06 11:30:12',
      isRead: true,
      priority: 'low',
    },
    {
      id: '6',
      title: 'Instrutor solicitou revisão',
      description:
        'Carlos Silva solicitou revisão do curso "JavaScript ES6+" para correção de conteúdo.',
      type: 'course',
      timestamp: '4 horas atrás',
      fullTimestamp: '2024-12-06 10:45:30',
      isRead: true,
      priority: 'medium',
    },
    {
      id: '7',
      title: 'Limite de usuários atingido',
      description: 'O plano atual atingiu 95% do limite de usuários. Considere fazer upgrade.',
      type: 'alert',
      timestamp: '6 horas atrás',
      fullTimestamp: '2024-12-06 08:15:22',
      isRead: false,
      priority: 'high',
    },
    {
      id: '8',
      title: 'Novo comentário em curso',
      description:
        'Ana Costa comentou no curso "Design System Completo" solicitando material adicional.',
      type: 'course',
      timestamp: '8 horas atrás',
      fullTimestamp: '2024-12-06 06:20:15',
      isRead: true,
      priority: 'low',
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'text-blue-500';
      case 'course':
        return 'text-emerald-500';
      case 'alert':
        return 'text-red-500';
      case 'system':
        return 'text-amber-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 dark:bg-blue-500/20';
      case 'course':
        return 'bg-emerald-100 dark:bg-emerald-500/20';
      case 'alert':
        return 'bg-red-100 dark:bg-red-500/20';
      case 'system':
        return 'bg-amber-100 dark:bg-amber-500/20';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            Alta
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="text-xs">
            Média
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-xs">
            Baixa
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'read' && notification.isRead) ||
      (filterStatus === 'unread' && !notification.isRead);

    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">Gerencie todas as notificações do sistema</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {unreadCount} não lidas
          </Badge>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="course">Cursos</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="alert">Alertas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Eye className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-md ${
                !notification.isRead
                  ? 'bg-accent/30 border-l-4 border-l-primary'
                  : 'hover:bg-accent/20'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-full ${getTypeBgColor(notification.type)} flex-shrink-0`}
                  >
                    <span className={getTypeColor(notification.type)}>
                      {getIcon(notification.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold ${
                              !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{notification.timestamp}</span>
                      <span>•</span>
                      <span>{notification.fullTimestamp}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma notificação encontrada</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros ou termos de busca.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination placeholder */}
      {filteredNotifications.length > 6 && (
        <div className="flex justify-center">
          <Button variant="outline">Carregar mais notificações</Button>
        </div>
      )}
    </div>
  );
}
