/**
 * Optimized Collaborator List Component
 * Features: Virtual scrolling, memoization, lazy loading, and performance monitoring
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Eye,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase
} from 'lucide-react';
import {
  debounce,
  useVirtualScroll,
  useIntersectionObserver,
  useCachedFetch,
  performanceMonitor,
  withPerformanceTracking
} from '@/utils/performance';

interface CollaboratorApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  experience: string;
  status: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED';
  stage: string;
  score?: number;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface CollaboratorListProps {
  onViewDetails: (application: CollaboratorApplication) => void;
  onUpdateStatus: (id: string, status: string) => void;
  filters?: {
    search: string;
    status: string;
    area: string;
    sortBy: string;
  };
}

// Memoized collaborator card component
const CollaboratorCard = React.memo(({
  application,
  onView,
  onUpdateStatus
}: {
  application: CollaboratorApplication;
  onView: () => void;
  onUpdateStatus: (status: string) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });

  // Lazy render card content only when visible
  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className="h-32 border rounded-lg bg-muted/5"
        style={{ minHeight: '128px' }}
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEWING': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'INTERVIEWING': return 'Em Entrevista';
      case 'APPROVED': return 'Aprovado';
      case 'REJECTED': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <Card ref={cardRef} className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={application.user?.avatar} alt={application.fullName} />
              <AvatarFallback>
                {application.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{application.fullName}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {application.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {application.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(application.status)}>
              {getStatusLabel(application.status)}
            </Badge>
            {application.score && (
              <Badge variant="secondary">
                Score: {application.score}/10
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span className="font-medium">Área:</span>
              {application.area}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Aplicado:</span>
              {new Date(application.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {application.experience}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onView}
                className="h-8"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver Detalhes
              </Button>
            </div>

            <Select onValueChange={onUpdateStatus} defaultValue={application.status}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="INTERVIEWING">Em Entrevista</SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="REJECTED">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CollaboratorCard.displayName = 'CollaboratorCard';

// Main optimized list component
const OptimizedCollaboratorList: React.FC<CollaboratorListProps> = ({
  onViewDetails,
  onUpdateStatus,
  filters = { search: '', status: '', area: '', sortBy: 'date' }
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [areaFilter, setAreaFilter] = useState(filters.area);
  const [sortBy, setSortBy] = useState(filters.sortBy);
  const containerRef = useRef<HTMLDivElement>(null);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.start('collaborator_list_render');
    return () => {
      performanceMonitor.end('collaborator_list_render');
    };
  }, []);

  // Cached fetch for collaborator data
  const { data: applications, loading, error } = useCachedFetch<CollaboratorApplication[]>(
    '/api/admin/collaborators',
    undefined,
    'collaborator_applications',
    2 * 60 * 1000 // 2 minutes cache
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Memoized filtered and sorted applications
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    let filtered = applications.filter(app => {
      const matchesSearch = !searchTerm ||
        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.area.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || statusFilter === 'all' || app.status === statusFilter;
      const matchesArea = !areaFilter || areaFilter === 'all' || app.area === areaFilter;

      return matchesSearch && matchesStatus && matchesArea;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, areaFilter, sortBy]);

  // Virtual scrolling for performance
  const ITEM_HEIGHT = 200; // Approximate height of each card
  const CONTAINER_HEIGHT = 600; // Visible container height

  const {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  } = useVirtualScroll(filteredApplications, ITEM_HEIGHT, CONTAINER_HEIGHT);

  // Optimized handlers
  const handleView = useCallback((application: CollaboratorApplication) => {
    performanceMonitor.start('view_application_details');
    onViewDetails(application);
    performanceMonitor.end('view_application_details');
  }, [onViewDetails]);

  const handleStatusUpdate = useCallback((id: string, status: string) => {
    performanceMonitor.start('update_application_status');
    onUpdateStatus(id, status);
    performanceMonitor.end('update_application_status');
  }, [onUpdateStatus]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, [setScrollTop]);

  // Get unique areas for filter
  const availableAreas = useMemo(() => {
    if (!applications) return [];
    return Array.from(new Set(applications.map(app => app.area)));
  }, [applications]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Erro ao carregar aplicações: {error.message}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Tentar Novamente
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou área..."
              className="pl-10"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="INTERVIEWING">Em Entrevista</SelectItem>
              <SelectItem value="APPROVED">Aprovado</SelectItem>
              <SelectItem value="REJECTED">Rejeitado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {availableAreas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data (mais recente)</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="score">Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredApplications.length} aplicação(ões) encontrada(s)
        </p>
        <div className="text-xs text-muted-foreground">
          {process.env.NODE_ENV === 'development' && (
            <span>Renderizando {visibleItems.length} de {filteredApplications.length} itens</span>
          )}
        </div>
      </div>

      {/* Virtual scrolled list */}
      <div
        ref={containerRef}
        className="relative overflow-auto border rounded-lg"
        style={{ height: CONTAINER_HEIGHT }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            <div className="space-y-4 p-4">
              {visibleItems.map((application) => (
                <CollaboratorCard
                  key={application.id}
                  application={application}
                  onView={() => handleView(application)}
                  onUpdateStatus={(status) => handleStatusUpdate(application.id, status)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredApplications.length === 0 && (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma aplicação encontrada</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou verificar se há novas aplicações.
          </p>
        </Card>
      )}
    </div>
  );
};

// Export with performance tracking
export default withPerformanceTracking(OptimizedCollaboratorList, 'OptimizedCollaboratorList');