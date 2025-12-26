import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Bell,
  BookOpen,
  Download,
  FileText,
  Folder,
  LayoutDashboard,
  Library,
  Link2,
  LogOut,
  Mail,
  Menu,
  Palette,
  PenTool,
  Settings,
  ShoppingCart,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface AdminSidebarProps {}

// Helper function to get user initials
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const menuItems = [
  {
    path: '/admin',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/admin/cursos',
    title: 'Cursos',
    icon: BookOpen,
  },
  {
    path: '/admin/ready-papers',
    title: 'Trabalhos Prontos',
    icon: FileText,
  },
  {
    path: '/admin/free-papers',
    title: 'Trabalhos Gratuitos',
    icon: Download,
  },
  {
    path: '/admin/custom-papers',
    title: 'Trabalhos Personalizados',
    icon: Palette,
  },
  {
    path: '/admin/ebooks',
    title: 'E-books',
    icon: Library,
  },
  {
    path: '/admin/blog-posts',
    title: 'Posts do Blog',
    icon: PenTool,
  },
  {
    path: '/admin/pedidos',
    title: 'Pedidos',
    icon: ShoppingCart,
  },
  {
    path: '/admin/colaboradores',
    title: 'Colaboradores',
    icon: UserPlus,
  },
  {
    path: '/admin/usuarios',
    title: 'Usuários',
    icon: Users,
  },
  {
    path: '/admin/downloads',
    title: 'Downloads',
    icon: Download,
  },
  {
    path: '/admin/newsletter',
    title: 'Newsletter',
    icon: Mail,
  },
  {
    path: '/admin/integracoes',
    title: 'Integrações',
    icon: Link2,
  },
];

export function AdminSidebar({}: AdminSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar
      className={`${collapsed ? 'w-14' : 'w-64'} transition-all duration-300`}
      collapsible="icon"
    >
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" title="Ir para página inicial">
              <img
                src="/logo.png"
                alt="LN Educacional"
                className={`object-contain cursor-pointer transition-all duration-300 hover:opacity-80 ${
                  collapsed ? 'w-12 h-12' : 'w-8 h-8'
                }`}
              />
            </Link>
            {!collapsed && <h2 className="font-bold text-sm text-sidebar-foreground">Painel Administrativo</h2>}
          </div>
          {!collapsed && <SidebarTrigger />}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            {!collapsed && 'Menu Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                      ${
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground font-medium shadow-md'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-10 w-10 shrink-0">
              {user.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 shrink-0 text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {collapsed && user && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
