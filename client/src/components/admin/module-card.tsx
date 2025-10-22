import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GripVertical, Trash2, Plus, ChevronDown } from 'lucide-react';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { LessonAccordionItem, CourseLesson } from './lesson-accordion-item';
import { useState } from 'react';

export interface CourseModule {
  id?: string;
  _tempId?: string;
  title: string;
  description?: string;
  order: number;
  lessons: CourseLesson[];
}

interface ModuleCardProps {
  module: CourseModule;
  moduleIndex: number;
  onUpdate: (data: Partial<CourseModule>) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onUpdateLesson: (lessonIndex: number, data: Partial<CourseLesson>) => void;
  onDeleteLesson: (lessonIndex: number) => void;
  onReorderLessons: (startIndex: number, endIndex: number) => void;
}

export function ModuleCard({
  module,
  moduleIndex,
  onUpdate,
  onDelete,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReorderLessons,
}: ModuleCardProps) {
  const [isOpen, setIsOpen] = useState(true); // Novo módulo começa aberto

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: module.id || module._tempId || `module-${moduleIndex}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = module.lessons.findIndex(
      (lesson) => (lesson.id || lesson._tempId) === active.id
    );
    const newIndex = module.lessons.findIndex(
      (lesson) => (lesson.id || lesson._tempId) === over.id
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderLessons(oldIndex, newIndex);
    }
  };

  const moduleId = `module-${moduleIndex}`;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4 shadow-md">
        <Accordion
          type="single"
          collapsible
          value={isOpen ? moduleId : undefined}
          onValueChange={(value) => setIsOpen(value === moduleId)}
        >
          <AccordionItem value={moduleId} className="border-none">
            {/* Module Header */}
            <div className="flex items-center gap-2 px-4 py-3">
              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Accordion Trigger - Setinha à direita */}
              <AccordionTrigger className="flex-1 hover:no-underline py-0 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-sm font-semibold text-primary">
                      Módulo {moduleIndex + 1}
                    </span>
                    <span className="font-semibold truncate">
                      {module.title || 'Sem título'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'})
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                </div>
              </AccordionTrigger>

              {/* Delete Button */}
              <DeleteConfirmDialog
                title="Excluir Módulo"
                description="Tem certeza que deseja excluir este módulo e todas as suas aulas? Esta ação não pode ser desfeita."
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
                onConfirm={onDelete}
              />
            </div>

            {/* Module Content */}
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {/* Module Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`module-title-${moduleIndex}`} className="text-sm">
                      Título do Módulo *
                    </Label>
                    <Input
                      id={`module-title-${moduleIndex}`}
                      value={module.title}
                      onChange={(e) => onUpdate({ title: e.target.value })}
                      placeholder="Ex: Fundamentos de React"
                      className="font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`module-desc-${moduleIndex}`} className="text-sm">
                      Descrição do Módulo
                    </Label>
                    <Textarea
                      id={`module-desc-${moduleIndex}`}
                      value={module.description || ''}
                      onChange={(e) => onUpdate({ description: e.target.value })}
                      placeholder="Descreva o que será aprendido neste módulo..."
                      rows={2}
                      className="resize-y"
                    />
                  </div>
                </div>

                {/* Lessons List */}
                {module.lessons.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Aulas do Módulo</h4>
                    <SortableContext
                      items={module.lessons.map(
                        (lesson) => lesson.id || lesson._tempId || ''
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <Accordion type="single" collapsible className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <LessonAccordionItem
                            key={lesson.id || lesson._tempId || `lesson-${lessonIndex}`}
                            lesson={lesson}
                            lessonIndex={lessonIndex}
                            moduleIndex={moduleIndex}
                            onUpdate={(data) => onUpdateLesson(lessonIndex, data)}
                            onDelete={() => onDeleteLesson(lessonIndex)}
                          />
                        ))}
                      </Accordion>
                    </SortableContext>
                  </div>
                )}

                {/* Add Lesson Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddLesson}
                  className="w-full border-dashed border-2 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Aula
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
