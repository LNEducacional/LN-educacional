import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Star,
  Clipboard,
  MessageSquare,
  FileText,
  Phone,
  Video,
  Award
} from 'lucide-react';
import { useCollaboratorProfile, useStageProgress, useStatusVariant } from '@/hooks/useCollaborator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PortalLayout } from '@/components/collaborator/PortalLayout';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const StageCard = ({ stage, isActive, isCompleted, icon, title, description }: {
  stage: string;
  isActive: boolean;
  isCompleted: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  const getCardClasses = () => {
    if (isCompleted) return "border-green-500 bg-green-50";
    if (isActive) return "border-blue-500 bg-blue-50";
    return "border-gray-200 bg-gray-50";
  };

  const getIconClasses = () => {
    if (isCompleted) return "text-green-600";
    if (isActive) return "text-blue-600";
    return "text-gray-400";
  };

  return (
    <Card className={`transition-all duration-200 ${getCardClasses()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getIconClasses()}`}>
            {isCompleted ? <CheckCircle className="h-5 w-5" /> : icon}
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {isActive && (
              <Badge variant="default" className="mt-2">Em andamento</Badge>
            )}
            {isCompleted && (
              <Badge variant="default" className="mt-2 bg-green-600">Concluído</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusTimeline = ({ application }: { application: any }) => {
  const timelineItems = [
    {
      date: application.createdAt,
      title: "Aplicação Enviada",
      description: "Sua aplicação foi recebida com sucesso",
      icon: <FileText className="h-4 w-4" />,
      type: "completed"
    },
    {
      date: application.reviewedAt,
      title: "Triagem Iniciada",
      description: "Sua aplicação está sendo analisada",
      icon: <Clipboard className="h-4 w-4" />,
      type: application.stage === 'RECEIVED' ? 'pending' : 'completed'
    },
    ...(application.interviews?.map((interview: any) => ({
      date: interview.scheduledAt,
      title: `Entrevista ${interview.type}`,
      description: `Entrevista agendada - ${interview.status}`,
      icon: interview.type === 'PHONE_SCREENING' ? <Phone className="h-4 w-4" /> : <Video className="h-4 w-4" />,
      type: interview.status === 'COMPLETED' ? 'completed' :
            interview.status === 'SCHEDULED' ? 'upcoming' : 'pending'
    })) || []),
    ...(application.evaluations?.map((evaluation: any) => ({
      date: evaluation.createdAt,
      title: "Avaliação Realizada",
      description: `Score: ${evaluation.totalScore}/10 - ${evaluation.recommendation}`,
      icon: <Star className="h-4 w-4" />,
      type: 'completed'
    })) || [])
  ].filter(item => item.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-4">
      {timelineItems.map((item, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full border-2
            ${item.type === 'completed' ? 'bg-green-100 border-green-500 text-green-600' :
              item.type === 'upcoming' ? 'bg-blue-100 border-blue-500 text-blue-600' :
              'bg-gray-100 border-gray-300 text-gray-400'}
          `}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{item.title}</h4>
              <span className="text-xs text-muted-foreground">
                {format(new Date(item.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export function CollaboratorStatus() {
  const { data: profile, isLoading, error } = useCollaboratorProfile();
  const stageProgress = useStageProgress(profile?.stage || '');
  const statusVariant = useStatusVariant(profile?.status || '');

  if (isLoading) return <LoadingSpinner />;

  if (error || !profile) {
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

  const stages = [
    {
      id: 'RECEIVED',
      title: 'Aplicação Recebida',
      description: 'Sua aplicação foi enviada e recebida pela nossa equipe',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'SCREENING',
      title: 'Triagem',
      description: 'Análise inicial do seu perfil e qualificações',
      icon: <User className="h-5 w-5" />
    },
    {
      id: 'INTERVIEW',
      title: 'Entrevistas',
      description: 'Entrevistas técnicas e comportamentais',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      id: 'TECHNICAL_TEST',
      title: 'Teste Técnico',
      description: 'Avaliação prática das suas habilidades',
      icon: <Clipboard className="h-5 w-5" />
    },
    {
      id: 'FINAL_REVIEW',
      title: 'Revisão Final',
      description: 'Análise final e tomada de decisão',
      icon: <Star className="h-5 w-5" />
    },
    {
      id: 'OFFER',
      title: 'Proposta',
      description: 'Elaboração e envio da proposta de colaboração',
      icon: <Award className="h-5 w-5" />
    },
    {
      id: 'HIRED',
      title: 'Contratado',
      description: 'Bem-vindo à equipe de colaboradores!',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === profile.stage);
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <PortalLayout>
      <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Status da Aplicação</h1>
        <p className="text-muted-foreground">
          Acompanhe o progresso da sua aplicação em tempo real
        </p>
      </div>

      {/* Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progresso Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{stageProgress.label}</h3>
                <p className="text-sm text-muted-foreground">Etapa atual do processo</p>
              </div>
              <Badge variant={statusVariant}>
                {profile.status}
              </Badge>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{stageProgress.progress}%</span>
              </div>
              <Progress value={stageProgress.progress} className="h-3" />
            </div>

            {profile.score && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Score de Avaliação</span>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{profile.score}/10</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Stages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Etapas do Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage.id}
                isActive={index === currentStageIndex}
                isCompleted={index < currentStageIndex}
                icon={stage.icon}
                title={stage.title}
                description={stage.description}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline application={profile} />
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.status === 'PENDING' && (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Aguardando Análise</h4>
                  <p className="text-sm text-blue-700">
                    Sua aplicação está na fila de análise. Nossa equipe entrará em contato em breve.
                  </p>
                </div>
              )}

              {profile.status === 'INTERVIEWING' && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Processo de Entrevista</h4>
                  <p className="text-sm text-yellow-700">
                    Você está no processo de entrevistas. Mantenha-se atento ao seu email para agendamentos.
                  </p>
                </div>
              )}

              {profile.status === 'APPROVED' && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Parabéns!</h4>
                  <p className="text-sm text-green-700">
                    Sua aplicação foi aprovada! Nossa equipe entrará em contato com os próximos passos.
                  </p>
                </div>
              )}

              {profile.status === 'REJECTED' && (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Aplicação Não Aprovada</h4>
                  <p className="text-sm text-red-700">
                    Infelizmente sua aplicação não foi aprovada desta vez. Você pode tentar novamente no futuro.
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Precisa de Ajuda?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Entre em contato conosco se tiver dúvidas sobre o processo.
                </p>
                <Button variant="outline" size="sm">
                  Entrar em Contato
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </PortalLayout>
  );
}