import { NavLink } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Clock,
  FileText,
  User,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useCollaboratorProfile } from '@/hooks/useCollaborator';

const NavigationItem = ({
  to,
  icon,
  title,
  description,
  badge
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) => {
  return (
    <NavLink to={to} className="block">
      {({ isActive }) => (
        <Card className={`
          transition-all duration-200 hover:shadow-md cursor-pointer
          ${isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
        `}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${isActive ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'}
                `}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </NavLink>
  );
};

export function PortalNavigation() {
  const { data: profile } = useCollaboratorProfile();

  const getStatusBadge = () => {
    if (!profile) return undefined;

    switch (profile.status) {
      case 'PENDING':
        return 'Pendente';
      case 'INTERVIEWING':
        return 'Em Entrevista';
      case 'APPROVED':
        return 'Aprovado';
      case 'REJECTED':
        return 'Rejeitado';
      default:
        return undefined;
    }
  };

  const getDocumentsBadge = () => {
    if (!profile) return undefined;

    let count = 0;
    if (profile.resumeUrl) count++;
    if (profile.portfolioUrls && profile.portfolioUrls.length > 0) {
      count += profile.portfolioUrls.length;
    }

    return count > 0 ? `${count} documento${count > 1 ? 's' : ''}` : 'Nenhum';
  };

  return (
    <div className="space-y-3">
      <NavigationItem
        to="/collaborator/portal"
        icon={<LayoutDashboard className="h-4 w-4" />}
        title="Dashboard"
        description="Visão geral da sua aplicação"
      />

      <NavigationItem
        to="/collaborator/portal/status"
        icon={<Clock className="h-4 w-4" />}
        title="Status da Aplicação"
        description="Acompanhe o progresso do seu processo"
        badge={getStatusBadge()}
      />

      <NavigationItem
        to="/collaborator/portal/documents"
        icon={<FileText className="h-4 w-4" />}
        title="Meus Documentos"
        description="Gerencie seus documentos e arquivos"
        badge={getDocumentsBadge()}
      />
    </div>
  );
}

export function PortalSidebar() {
  const { data: profile } = useCollaboratorProfile();

  return (
    <div className="w-80 space-y-6">
      {/* User Info */}
      {profile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{profile.fullName}</h3>
                <p className="text-sm text-muted-foreground truncate">{profile.area}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div>
        <h3 className="font-medium mb-3 px-1">Portal do Colaborador</h3>
        <PortalNavigation />
      </div>
    </div>
  );
}