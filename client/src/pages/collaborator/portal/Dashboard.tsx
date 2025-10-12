import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User, Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useCollaboratorProfile, useStageProgress, useStatusVariant, useRelativeDate } from '@/hooks/useCollaborator';
import { DocumentCard } from '@/components/collaborator/DocumentCard';
import { PortalLayout } from '@/components/collaborator/PortalLayout';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const StatsCard = ({ title, value, icon, variant = "default" }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "destructive":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <Card className={getVariantClasses()}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white shadow-sm">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InterviewCard = ({ interview }: { interview: any }) => {
  const getStatusIcon = () => {
    switch (interview.status) {
      case 'SCHEDULED':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = () => {
    switch (interview.status) {
      case 'SCHEDULED':
        return 'default';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h4 className="font-medium">{interview.type}</h4>
              <Badge variant={getStatusVariant()}>
                {interview.status}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {formatDate(interview.scheduledAt)}
            </p>

            <div className="text-xs text-muted-foreground">
              Duração: {interview.duration} minutos
              {interview.location && ` • Local: ${interview.location}`}
            </div>
          </div>

          {interview.meetingUrl && interview.status === 'SCHEDULED' && (
            <Button
              size="sm"
              onClick={() => window.open(interview.meetingUrl, '_blank')}
            >
              Entrar na Reunião
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function CollaboratorDashboard() {
  const { data: profile, isLoading, error } = useCollaboratorProfile();
  const stageProgress = useStageProgress(profile?.stage || '');
  const statusVariant = useStatusVariant(profile?.status || '');

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao carregar dados
            </h2>
            <p className="text-red-600">
              Não foi possível carregar seus dados. Verifique se você tem uma aplicação enviada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Nenhuma aplicação encontrada
            </h2>
            <p className="text-muted-foreground mb-4">
              Você ainda não enviou uma aplicação como colaborador.
            </p>
            <Button onClick={() => window.location.href = '/seja-colaborador'}>
              Aplicar como Colaborador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documents = [
    ...(profile.resumeUrl ? [{
      id: 'resume',
      title: 'Currículo',
      url: profile.resumeUrl,
      type: 'resume' as const,
      uploadedAt: profile.createdAt
    }] : []),
    ...(profile.portfolioUrls || []).map((url, index) => ({
      id: `portfolio-${index}`,
      title: `Portfolio ${index + 1}`,
      url,
      type: 'portfolio' as const,
      uploadedAt: profile.createdAt
    }))
  ];

  return (
    <PortalLayout>
      <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Portal do Colaborador</h1>
        <p className="text-muted-foreground">
          Acompanhe o status da sua aplicação e gerencie seus documentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Status da Aplicação"
          value={profile.status}
          icon={<User className="h-5 w-5" />}
          variant={profile.status === 'APPROVED' ? 'success' :
                  profile.status === 'REJECTED' ? 'destructive' : 'default'}
        />

        <StatsCard
          title="Etapa Atual"
          value={stageProgress.label}
          icon={<Briefcase className="h-5 w-5" />}
        />

        <StatsCard
          title="Score de Avaliação"
          value={profile.score ? `${profile.score}/10` : 'Pendente'}
          icon={<CheckCircle className="h-5 w-5" />}
          variant={profile.score && profile.score >= 7 ? 'success' : 'default'}
        />

        <StatsCard
          title="Aplicado há"
          value={useRelativeDate(profile.createdAt)}
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status da Aplicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progresso</span>
                  <span className="text-sm text-muted-foreground">
                    {stageProgress.progress}%
                  </span>
                </div>
                <Progress value={stageProgress.progress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {stageProgress.label}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Status Atual</p>
                  <Badge variant={statusVariant} className="mt-1">
                    {profile.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Área de Interesse</p>
                  <p className="font-medium mt-1">{profile.area}</p>
                </div>
              </div>

              {profile.evaluations && profile.evaluations.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Últimas Avaliações</p>
                  <div className="space-y-2">
                    {profile.evaluations.slice(0, 3).map((evaluation) => (
                      <div key={evaluation.id} className="flex justify-between items-center text-sm">
                        <span>Score: {evaluation.totalScore}/10</span>
                        <span className="text-muted-foreground">
                          {new Date(evaluation.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Resumo do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{profile.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Área</p>
                <p className="font-medium">{profile.area}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponibilidade</p>
                <p className="font-medium">{profile.availability}</p>
              </div>
              {profile.linkedin && (
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Ver perfil
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interviews */}
        {profile.interviews && profile.interviews.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Entrevistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.interviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    title={doc.title}
                    url={doc.url}
                    type={doc.type}
                    uploadedAt={doc.uploadedAt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento encontrado</p>
                <p className="text-sm">
                  Adicione documentos à sua aplicação para que sejam exibidos aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </PortalLayout>
  );
}