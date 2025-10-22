import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2, Upload, FileText, ChevronDown, Save, Loader2 } from 'lucide-react';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

export interface CourseLesson {
  id?: string;
  _tempId?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isEnabled?: boolean;
  attachments?: string[];
}

interface LessonAccordionItemProps {
  lesson: CourseLesson;
  lessonIndex: number;
  moduleIndex: number;
  onUpdate: (data: Partial<CourseLesson>) => void;
  onDelete: () => void;
}

export function LessonAccordionItem({
  lesson,
  lessonIndex,
  moduleIndex,
  onUpdate,
  onDelete,
}: LessonAccordionItemProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [initialData, setInitialData] = useState<CourseLesson>(lesson);
  const [showValidation, setShowValidation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lesson.id || lesson._tempId || `lesson-${moduleIndex}-${lessonIndex}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const lessonId = `module-${moduleIndex}-lesson-${lessonIndex}`;

  // Extrai ID do vídeo do YouTube
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getYouTubeVideoId(lesson.videoUrl || '');

  // Detectar mudanças na aula
  useEffect(() => {
    const hasChanges = JSON.stringify(lesson) !== JSON.stringify(initialData);
    setIsModified(hasChanges);
  }, [lesson, initialData]);

  // Função para salvar aula individual
  const handleSaveLesson = async () => {
    // Ativar validação visual
    setShowValidation(true);

    if (!lesson.title.trim() || !lesson.videoUrl.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e a URL do vídeo antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Se a aula já tem ID, atualiza; senão, cria nova
      if (lesson.id) {
        await api.put(`/courses/lessons/${lesson.id}`, lesson);
        toast({
          title: 'Aula salva!',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        // Para aulas novas, precisa do ID do curso e módulo
        // Vamos salvar localmente apenas e mostrar mensagem
        toast({
          title: 'Aula será salva',
          description: 'Esta aula será salva quando você salvar o curso completo.',
        });
      }

      // Atualizar dados iniciais após salvar
      setInitialData(lesson);
      setIsModified(false);
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a aula. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedFiles: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/lesson-attachment', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Erro ao fazer upload');

        const data = await response.json();
        uploadedFiles.push(data.url);
      }

      onUpdate({
        attachments: [...(lesson.attachments || []), ...uploadedFiles],
      });

      toast({
        title: 'Arquivos enviados!',
        description: `${uploadedFiles.length} arquivo(s) adicionado(s).`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar arquivos',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    onUpdate({
      attachments: (lesson.attachments || []).filter((_, i) => i !== index),
    });
  };

  const getFileName = (url: string) => url.split('/').pop() || url;

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={lessonId} className="border rounded-lg mb-2">
        <div className="flex items-center gap-3 pr-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing pl-3"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Accordion Trigger - Parte clicável que expande */}
          <AccordionTrigger
            className="flex-1 hover:no-underline py-3 [&>svg]:hidden min-w-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3 w-full min-w-0">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Aula {lessonIndex + 1}
              </span>
              <span className="font-semibold truncate">
                {lesson.title || 'Sem título'}
              </span>
              {lesson.duration && lesson.duration > 0 && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ({lesson.duration} min)
                </span>
              )}
              {isModified && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300 whitespace-nowrap">
                  Não salvo
                </Badge>
              )}
            </div>
          </AccordionTrigger>

          {/* Actions Container - Fixo no canto direito */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Setinha de expandir/colapsar */}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />

            {/* Toggle Ativar/Desativar */}
            <div className="flex items-center gap-2 border-l pl-3">
              <Label
                htmlFor={`lesson-enabled-${lessonId}`}
                className="text-xs cursor-pointer whitespace-nowrap"
              >
                {lesson.isEnabled !== false ? 'Ativa' : 'Inativa'}
              </Label>
              <Switch
                id={`lesson-enabled-${lessonId}`}
                checked={lesson.isEnabled !== false}
                onCheckedChange={(checked) => onUpdate({ isEnabled: checked })}
              />
            </div>

            {/* Botão Excluir */}
            <div className="border-l pl-3">
              <DeleteConfirmDialog
                title="Excluir Aula"
                description="Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita."
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
          </div>
        </div>

        {/* Accordion Content */}
        <AccordionContent className="px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Coluna Esquerda - Formulário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`lesson-title-${lessonId}`} className="text-sm font-medium">
                  Título da Aula *
                </Label>
                <Input
                  id={`lesson-title-${lessonId}`}
                  value={lesson.title}
                  onChange={(e) => {
                    onUpdate({ title: e.target.value });
                    if (showValidation && e.target.value.trim()) {
                      setShowValidation(false);
                    }
                  }}
                  placeholder="Ex: Introdução ao Módulo"
                  className={showValidation && !lesson.title.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {showValidation && !lesson.title.trim() && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> Campo obrigatório
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`lesson-video-${lessonId}`} className="text-sm font-medium">
                  URL do Vídeo (YouTube) *
                </Label>
                <Input
                  id={`lesson-video-${lessonId}`}
                  value={lesson.videoUrl || ''}
                  onChange={(e) => {
                    onUpdate({ videoUrl: e.target.value });
                    if (showValidation && e.target.value.trim()) {
                      setShowValidation(false);
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={showValidation && !lesson.videoUrl?.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {showValidation && !lesson.videoUrl?.trim() ? (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> Campo obrigatório
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Cole o link completo do vídeo do YouTube
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`lesson-duration-${lessonId}`}>
                  Duração (minutos)
                </Label>
                <Input
                  id={`lesson-duration-${lessonId}`}
                  type="number"
                  value={lesson.duration || ''}
                  onChange={(e) =>
                    onUpdate({ duration: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Ex: 45"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`lesson-description-${lessonId}`}>
                  Descrição da Aula
                </Label>
                <Textarea
                  id={`lesson-description-${lessonId}`}
                  value={lesson.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Descreva o conteúdo desta aula..."
                  rows={4}
                  className="resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivos Anexos (PDF, Word, etc.)</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                      multiple
                      disabled={uploading}
                      className="hidden"
                      id={`lesson-files-${lessonId}`}
                    />
                    <Label
                      htmlFor={`lesson-files-${lessonId}`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Enviando...' : 'Adicionar Arquivos'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      PDF, Word, PowerPoint, Excel, ZIP
                    </p>
                  </div>

                  {lesson.attachments && lesson.attachments.length > 0 && (
                    <div className="space-y-2">
                      {lesson.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">
                              {getFileName(file)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita - Preview do Vídeo */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preview do Vídeo</Label>
                {videoId ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-full bg-muted rounded-lg flex items-center justify-center"
                    style={{ paddingBottom: '56.25%' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-6">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Cole a URL do YouTube para ver o preview
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {videoId && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">
                    Informações do Vídeo
                  </h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">ID do Vídeo:</dt>
                      <dd className="font-mono text-xs">{videoId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="text-green-600 font-medium">URL Válida</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Botão Salvar Aula */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              type="button"
              onClick={handleSaveLesson}
              disabled={!isModified || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Aula
                </>
              )}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
