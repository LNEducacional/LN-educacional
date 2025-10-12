import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import collaboratorService, {
  CollaboratorResponse,
  CollaboratorsQuery,
  CollaboratorApplication
} from '../services/collaborator.service';
import { useToast } from './use-toast';

// Hook para perfil do colaborador (próprio perfil)
export function useCollaboratorProfile() {
  return useQuery({
    queryKey: ['collaborator-profile'],
    queryFn: collaboratorService.getProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para verificar status de aplicação (público)
export function useApplicationStatus(id: string, email: string) {
  return useQuery({
    queryKey: ['application-status', id, email],
    queryFn: () => collaboratorService.checkStatus(id, email),
    enabled: !!id && !!email,
    retry: 1,
  });
}

// Hook para aplicar como colaborador
export function useApplyAsCollaborator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollaboratorApplication) =>
      collaboratorService.apply(data),
    onSuccess: (data) => {
      toast({
        title: "Aplicação enviada com sucesso!",
        description: "Sua aplicação foi recebida e está sendo analisada.",
      });
      // Invalidar cache do perfil para refletir nova aplicação
      queryClient.invalidateQueries({ queryKey: ['collaborator-profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar aplicação",
        description: error.response?.data?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
}

// Hook para administradores - listar aplicações
export function useCollaboratorApplications(query?: CollaboratorsQuery) {
  return useQuery({
    queryKey: ['collaborator-applications', query],
    queryFn: () => collaboratorService.getApplications(query),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para atualizar status (admin)
export function useUpdateCollaboratorStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: {
      id: string;
      status: 'PENDING' | 'INTERVIEWING' | 'APPROVED' | 'REJECTED'
    }) =>
      collaboratorService.updateStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Status atualizado com sucesso!",
      });
      // Invalidar cache das aplicações
      queryClient.invalidateQueries({ queryKey: ['collaborator-applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.response?.data?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
}

// Hook para obter estatísticas de progresso baseadas no stage
export function useStageProgress(stage: string) {
  const stageProgress = {
    RECEIVED: { progress: 10, label: 'Aplicação Recebida' },
    SCREENING: { progress: 25, label: 'Em Triagem' },
    INTERVIEW: { progress: 50, label: 'Entrevista' },
    TECHNICAL_TEST: { progress: 70, label: 'Teste Técnico' },
    FINAL_REVIEW: { progress: 85, label: 'Revisão Final' },
    OFFER: { progress: 95, label: 'Proposta' },
    HIRED: { progress: 100, label: 'Contratado' }
  };

  return stageProgress[stage as keyof typeof stageProgress] ||
    { progress: 0, label: 'Desconhecido' };
}

// Hook para obter variant do status badge
export function useStatusVariant(status: string) {
  const statusVariants = {
    PENDING: 'default',
    INTERVIEWING: 'secondary',
    APPROVED: 'default',
    REJECTED: 'destructive'
  } as const;

  return statusVariants[status as keyof typeof statusVariants] || 'default';
}

// Hook para formatar datas relativas
export function useRelativeDate(date: string) {
  const [relativeDate, setRelativeDate] = useState('');

  useEffect(() => {
    const formatRelativeDate = () => {
      const now = new Date();
      const targetDate = new Date(date);
      const diffInMs = now.getTime() - targetDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        setRelativeDate('Hoje');
      } else if (diffInDays === 1) {
        setRelativeDate('Ontem');
      } else if (diffInDays < 7) {
        setRelativeDate(`${diffInDays} dias atrás`);
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        setRelativeDate(`${weeks} semana${weeks > 1 ? 's' : ''} atrás`);
      } else {
        setRelativeDate(targetDate.toLocaleDateString('pt-BR'));
      }
    };

    formatRelativeDate();
    // Atualizar a cada minuto
    const interval = setInterval(formatRelativeDate, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return relativeDate;
}