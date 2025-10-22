import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ModuleCard, CourseModule } from './module-card';
import { CourseLesson } from './lesson-accordion-item';

export type { CourseModule, CourseLesson };

interface CourseContentManagerProps {
  modules: CourseModule[];
  onChange: (modules: CourseModule[]) => void;
}

export function CourseContentManager({
  modules,
  onChange,
}: CourseContentManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add new module
  const handleAddModule = () => {
    const newModule: CourseModule = {
      _tempId: `temp-module-${Date.now()}`,
      title: '',
      description: '',
      order: modules.length,
      lessons: [],
    };

    onChange([...modules, newModule]);
  };

  // Update module
  const handleUpdateModule = (
    moduleIndex: number,
    data: Partial<CourseModule>
  ) => {
    const updated = modules.map((module, index) =>
      index === moduleIndex ? { ...module, ...data } : module
    );
    onChange(updated);
  };

  // Delete module
  const handleDeleteModule = (moduleIndex: number) => {
    const updated = modules.filter((_, index) => index !== moduleIndex);
    onChange(updated);
  };

  // Add lesson to module
  const handleAddLesson = (moduleIndex: number) => {
    const newLesson: CourseLesson = {
      _tempId: `temp-lesson-${Date.now()}`,
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      order: modules[moduleIndex].lessons.length,
      isEnabled: true,
      attachments: [],
    };

    const updated = modules.map((module, index) =>
      index === moduleIndex
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    );

    onChange(updated);
  };

  // Update lesson in module
  const handleUpdateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    data: Partial<CourseLesson>
  ) => {
    const updated = modules.map((module, mIndex) =>
      mIndex === moduleIndex
        ? {
            ...module,
            lessons: module.lessons.map((lesson, lIndex) =>
              lIndex === lessonIndex ? { ...lesson, ...data } : lesson
            ),
          }
        : module
    );

    onChange(updated);
  };

  // Delete lesson from module
  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updated = modules.map((module, mIndex) =>
      mIndex === moduleIndex
        ? {
            ...module,
            lessons: module.lessons.filter((_, lIndex) => lIndex !== lessonIndex),
          }
        : module
    );

    onChange(updated);
  };

  // Reorder lessons within module
  const handleReorderLessons = (
    moduleIndex: number,
    startIndex: number,
    endIndex: number
  ) => {
    const updated = modules.map((module, mIndex) =>
      mIndex === moduleIndex
        ? {
            ...module,
            lessons: arrayMove(module.lessons, startIndex, endIndex),
          }
        : module
    );

    onChange(updated);
  };

  // Drag end handler for modules
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex(
      (module) => (module.id || module._tempId) === active.id
    );
    const newIndex = modules.findIndex(
      (module) => (module.id || module._tempId) === over.id
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(modules, oldIndex, newIndex);
      onChange(reordered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conteúdo do Curso</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize os módulos e aulas do seu curso
          </p>
        </div>
      </div>

      {/* Modules List */}
      {modules.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((module) => module.id || module._tempId || '')}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <ModuleCard
                  key={module.id || module._tempId || `module-${moduleIndex}`}
                  module={module}
                  moduleIndex={moduleIndex}
                  onUpdate={(data) => handleUpdateModule(moduleIndex, data)}
                  onDelete={() => handleDeleteModule(moduleIndex)}
                  onAddLesson={() => handleAddLesson(moduleIndex)}
                  onUpdateLesson={(lessonIndex, data) =>
                    handleUpdateLesson(moduleIndex, lessonIndex, data)
                  }
                  onDeleteLesson={(lessonIndex) =>
                    handleDeleteLesson(moduleIndex, lessonIndex)
                  }
                  onReorderLessons={(startIndex, endIndex) =>
                    handleReorderLessons(moduleIndex, startIndex, endIndex)
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Module Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddModule}
        className="w-full border-dashed border-2 hover:bg-primary/5 py-6"
      >
        <Plus className="h-5 w-5 mr-2" />
        Adicionar Módulo
      </Button>

      {modules.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Nenhum módulo adicionado ainda. Clique no botão acima para começar.
          </p>
        </div>
      )}
    </div>
  );
}
