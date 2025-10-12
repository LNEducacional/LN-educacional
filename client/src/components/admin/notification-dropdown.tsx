import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCheck,
  ExternalLink,
  Settings,
  User,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'course' | 'system' | 'alert';
  timestamp: string;
  isRead: boolean;
  icon?: React.ReactNode;
}

interface NotificationDropdownProps {
  onNotificationUpdate?: (unreadCount: number) => void;
}

export function NotificationDropdown({ onNotificationUpdate }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Novo usuário cadastrado',
      description: 'Maria Silva se registrou na plataforma',
      type: 'user',
      timestamp: '2 min atrás',
      isRead: false,
      icon: <User className="h-4 w-4" />,
    },
    {
      id: '2',
      title: 'Curso publicado',
      description: 'React Avançado foi publicado com sucesso',
      type: 'course',
      timestamp: '15 min atrás',
      isRead: false,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: '3',
      title: 'Falha no sistema de backup',
      description: 'Backup automático falhou às 03:00',
      type: 'alert',
      timestamp: '1 hora atrás',
      isRead: false,
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: '4',
      title: 'Atualização do sistema',
      description: 'Sistema atualizado para versão 2.1.0',
      type: 'system',
      timestamp: '2 horas atrás',
      isRead: true,
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: '5',
      title: 'Relatório mensal disponível',
      description: 'Relatório de novembro está pronto',
      type: 'system',
      timestamp: '3 horas atrás',
      isRead: true,
      icon: <Settings className="h-4 w-4" />,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    onNotificationUpdate?.(unreadCount);
  }, [unreadCount, onNotificationUpdate]);

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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-accent transition-colors">
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs animate-scale-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 max-w-[calc(100vw-2rem)] animate-fade-in"
        align="end"
        sideOffset={10}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-6 px-2">
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-80">
          {recentNotifications.length > 0 ? (
            <div className="p-1">
              {recentNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer rounded-lg m-1 transition-all duration-200 ${
                    !notification.isRead
                      ? 'bg-accent/50 border-l-4 border-l-primary'
                      : 'hover:bg-accent/30'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div
                      className={`p-2 rounded-full ${getTypeBgColor(notification.type)} flex-shrink-0`}
                    >
                      <span className={getTypeColor(notification.type)}>{notification.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium line-clamp-1 ${
                            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>

                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação no momento</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full justify-center text-sm" asChild>
                <Link to="/admin/notifications">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Ver todas as notificações
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
