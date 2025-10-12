import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle,
  Info,
  Loader2,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
}

interface NotificationSettings {
  sound: boolean;
  desktop: boolean;
  email: boolean;
  orderUpdates: boolean;
  courseUpdates: boolean;
  promotions: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [_ws, setWs] = useState<WebSocket | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    sound: true,
    desktop: true,
    email: true,
    orderUpdates: true,
    courseUpdates: true,
    promotions: false,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Update unread count
  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback(
    (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play sound if enabled
      if (settings.sound) {
        playNotificationSound();
      }

      // Show desktop notification if enabled
      if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      }

      // Show toast
      const variant = notification.type === 'error' ? 'destructive' : 'default';
      toast({
        title: notification.title,
        description: notification.message,
        variant,
      });
    },
    [settings.sound, settings.desktop, toast]
  );

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      updateUnreadCount(response.data);
    } catch (error) {
      // Silently fail if notifications endpoint doesn't exist
      console.log('Notifications not available');
    } finally {
      setLoading(false);
    }
  }, [user, updateUnreadCount]);

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;

    // Desabilitar WebSocket temporariamente até implementar no servidor
    return;

    // const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3333';
    // const websocket = new WebSocket(`${wsUrl}/notifications?userId=${user.id}`);

    // websocket.onopen = () => {};

    // websocket.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   handleNewNotification(notification);
    // };

    // websocket.onerror = (error) => {
    //   console.error('WebSocket error:', error);
    // };

    // websocket.onclose = () => {};

    // setWs(websocket);

    // return () => {
    //   websocket.close();
    // };
  }, [user]);

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch((_e) => {});
  };

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        updateUnreadCount(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Request desktop notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá notificações no desktop.',
        });
      }
    }
  };

  // Save settings
  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await api.put('/notifications/settings', newSettings);
      setSettings(newSettings);
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram atualizadas.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadNotifications();

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [loadNotifications]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Get icon by type
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Filter notifications
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notificações</h3>
            <TabsList className="h-8">
              <TabsTrigger value="notifications" className="text-xs">
                Todas
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="m-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    {unreadCount > 0 && `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`}
                  </span>
                  <div className="flex gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-7 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar todas como lidas
                      </Button>
                    )}
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-96">
                  {unreadNotifications.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                        Não lidas
                      </p>
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getIcon}
                        />
                      ))}
                    </div>
                  )}

                  {readNotifications.length > 0 && (
                    <div className="p-2">
                      {unreadNotifications.length > 0 && (
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                          Anteriores
                        </p>
                      )}
                      {readNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getIcon}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Preferências</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound" className="text-sm">
                      Som de notificação
                    </Label>
                    <Switch
                      id="sound"
                      checked={settings.sound}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, sound: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="desktop" className="text-sm">
                      Notificações no desktop
                    </Label>
                    <Switch
                      id="desktop"
                      checked={settings.desktop}
                      onCheckedChange={(checked) => {
                        setSettings((prev) => ({ ...prev, desktop: checked }));
                        if (checked) requestNotificationPermission();
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-sm">
                      Notificações por e-mail
                    </Label>
                    <Switch
                      id="email"
                      checked={settings.email}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, email: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Tipos de notificação</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="orderUpdates" className="text-sm">
                      Atualizações de pedidos
                    </Label>
                    <Switch
                      id="orderUpdates"
                      checked={settings.orderUpdates}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, orderUpdates: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="courseUpdates" className="text-sm">
                      Atualizações de cursos
                    </Label>
                    <Switch
                      id="courseUpdates"
                      checked={settings.courseUpdates}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, courseUpdates: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="promotions" className="text-sm">
                      Promoções e ofertas
                    </Label>
                    <Switch
                      id="promotions"
                      checked={settings.promotions}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, promotions: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" size="sm" onClick={() => saveSettings(settings)}>
                Salvar configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

// Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => JSX.Element;
}

function NotificationItem({ notification, onRead, onDelete, getIcon }: NotificationItemProps) {
  return (
    <button
      type="button"
      className={`
        relative group p-3 rounded-lg mb-1 cursor-pointer transition-colors w-full text-left
        ${notification.read ? 'hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10'}
      `}
      onClick={() => !notification.read && onRead(notification.id)}
      aria-label={`Marcar notificação como lida: ${notification.title}`}
      disabled={notification.read}
    >
      <div className="flex gap-3">
        <div className="mt-0.5">{getIcon(notification.type)}</div>
        <div className="flex-1 space-y-1">
          <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Excluir notificação"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      {!notification.read && (
        <div className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full" />
      )}
    </button>
  );
}
