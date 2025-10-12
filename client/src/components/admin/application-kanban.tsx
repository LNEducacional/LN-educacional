import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CollaboratorApplication, ApplicationStage } from '@/types/collaborator';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, GripVertical } from 'lucide-react';

interface ApplicationKanbanProps {
  applications: CollaboratorApplication[];
  onApplicationSelect: (application: CollaboratorApplication) => void;
  onStageUpdate: (applicationId: number, newStage: ApplicationStage) => void;
}

const stages = [
  { id: 'RECEIVED', label: 'Recebidas', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'SCREENING', label: 'Triagem', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'INTERVIEW', label: 'Entrevista', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { id: 'TECHNICAL_TEST', label: 'Teste Técnico', color: 'bg-purple-100 dark:bg-purple-900' },
  { id: 'FINAL_REVIEW', label: 'Revisão Final', color: 'bg-orange-100 dark:bg-orange-900' },
  { id: 'OFFER', label: 'Oferta', color: 'bg-green-100 dark:bg-green-900' },
  { id: 'HIRED', label: 'Contratado', color: 'bg-emerald-100 dark:bg-emerald-900' },
] as const;

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  interviewing: { label: 'Em Entrevista', variant: 'default' as const },
  approved: { label: 'Aprovado', variant: 'default' as const },
  rejected: { label: 'Rejeitado', variant: 'destructive' as const },
};

export function ApplicationKanban({ applications, onApplicationSelect, onStageUpdate }: ApplicationKanbanProps) {
  const { toast } = useToast();

  const getApplicationsByStage = (stage: ApplicationStage) => {
    return applications.filter(app => app.stage === stage);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const applicationId = parseInt(draggableId);
    const newStage = destination.droppableId as ApplicationStage;

    // Encontrar a aplicação
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;

    // Se não mudou de stage, não fazer nada
    if (application.stage === newStage) return;

    onStageUpdate(applicationId, newStage);

    toast({
      title: 'Etapa atualizada',
      description: `${application.fullName} movido para ${stages.find(s => s.id === newStage)?.label}`,
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 min-h-[600px]">
        {stages.map((stage) => {
          const stageApplications = getApplicationsByStage(stage.id);

          return (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    min-w-[320px] w-80 ${stage.color} rounded-lg p-4 border-2 transition-colors
                    ${snapshot.isDraggingOver ? 'ring-2 ring-primary border-primary' : 'border-transparent'}
                  `}
                >
                  <h3 className="font-semibold mb-4 flex items-center justify-between">
                    <span>{stage.label}</span>
                    <Badge variant="outline" className="bg-background">
                      {stageApplications.length}
                    </Badge>
                  </h3>

                  <div className="space-y-3">
                    {stageApplications.map((application, index) => (
                      <Draggable
                        key={application.id}
                        draggableId={application.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              cursor-move transition-shadow
                              ${snapshot.isDragging ? 'shadow-lg rotate-3' : 'hover:shadow-md'}
                            `}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm mb-1 line-clamp-1">
                                    {application.fullName}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {application.area}
                                  </p>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={statusMap[application.status].variant} className="text-xs">
                                      {statusMap[application.status].label}
                                    </Badge>
                                    {application.score && (
                                      <Badge variant="secondary" className="text-xs">
                                        {application.score}/10
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onApplicationSelect(application)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(application.createdAt, {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}