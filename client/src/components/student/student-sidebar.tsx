import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface StudentSidebarProps {
  activeSection: string;
  onSectionChange?: (section: string) => void;
}

// Helper function to get user initials
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentSidebar({ activeSection, onSectionChange }: StudentSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'courses', label: 'Meus Cursos', icon: BookOpen, path: '/student/courses' },
    { id: 'orders', label: 'Meus Pedidos', icon: ShoppingBag, path: '/student/orders' },
    { id: 'library', label: 'Biblioteca', icon: FileText, path: '/student/library' },
    { id: 'custom-papers', label: 'Trabalhos Personalizados', icon: GraduationCap, path: '/student/custom-papers' },
    { id: 'certificates', label: 'Certificados', icon: Award, path: '/student/certificates' },
    { id: 'profile', label: 'Perfil', icon: User, path: '/student/profile' },
    { id: 'downloads', label: 'Downloads', icon: Download, path: '/student/downloads' },
  ];

  const handleSectionChange = (section: string, path: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      {/* Mobile Dropdown Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw-2rem)] max-h-[50vh] overflow-y-auto ml-4 mt-2"
            align="start"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleSectionChange(item.id, item.path)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                    isActive ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex-col max-h-screen">
        {/* Header - Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link to="/" title="Ir para página inicial">
              <img
                src="/logo.png"
                alt="LN Educacional"
                className="w-8 h-8 object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
            <h2 className="font-bold text-sm text-foreground">Painel do Aluno</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-12 transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => handleSectionChange(item.id, item.path)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Footer - User Info */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 shrink-0 text-foreground hover:text-destructive hover:bg-accent"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
