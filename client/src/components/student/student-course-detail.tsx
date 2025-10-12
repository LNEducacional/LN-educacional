import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  MessageCircle,
  Play,
  Send,
  Star,
} from 'lucide-react';
import { useState } from 'react';

interface StudentCourseDetailProps {
  courseId: string;
  onBack: () => void;
}

export function StudentCourseDetail({ courseId, onBack }: StudentCourseDetailProps) {
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [newComment, setNewComment] = useState('');

  // Mock data for course details
  const course = {
    id: courseId,
    title: 'React Avançado',
    instructor: 'Carlos Silva',
    description:
      'Domine os conceitos avançados do React e construa aplicações modernas e escaláveis.',
    progress: 85,
    totalLessons: 24,
    completedLessons: 20,
    duration: '12h 30m',
    rating: 4.9,
    students: 1234,
    image: '/src/assets/course-programming.jpg',
  };

  const lessons = [
    { id: 1, title: 'Introdução ao React Avançado', duration: '15min', completed: true },
    { id: 2, title: 'Hooks Customizados', duration: '25min', completed: true },
    { id: 3, title: 'Context API e Zustand', duration: '30min', completed: true },
    {
      id: 4,
      title: 'Performance e Otimização',
      duration: '35min',
      completed: false,
      current: true,
    },
    { id: 5, title: 'Testing com Jest e RTL', duration: '40min', completed: false },
    { id: 6, title: 'Deployment e CI/CD', duration: '20min', completed: false },
  ];

  const comments = [
    {
      id: 1,
      user: 'Maria Santos',
      avatar: 'MS',
      content: 'Excelente explicação sobre hooks customizados! Muito claro e prático.',
      timestamp: '2 horas atrás',
      replies: 3,
    },
    {
      id: 2,
      user: 'João Silva',
      avatar: 'JS',
      content:
        'Alguém pode me ajudar com o exercício da aula 3? Estou tendo dificuldades com o Context.',
      timestamp: '1 dia atrás',
      replies: 7,
    },
  ];

  const handleMarkCompleted = (_lessonId: number) => {
    // Mock function to mark lesson as completed
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      // Mock function to submit comment
      setNewComment('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">por {course.instructor}</p>
        </div>
      </div>

      {/* Course Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-amber-400" />
                  <span>{course.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.students} alunos</span>
                </div>
              </div>
              <p className="text-muted-foreground">{course.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Seu Progresso</h3>
                <Progress value={course.progress} className="h-3" />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">
                    {course.completedLessons}/{course.totalLessons} aulas
                  </span>
                  <span className="font-medium text-primary">{course.progress}%</span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Baixar Materiais
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Aulas do Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lessons.map((lesson, index) => (
                <button
                  type="button"
                  key={lesson.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer w-full text-left ${
                    selectedLesson === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedLesson(index)}
                  aria-label={`Selecionar aula: ${lesson.title}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          lesson.completed
                            ? 'bg-emerald-100 dark:bg-emerald-500/20'
                            : lesson.current
                              ? 'bg-primary/20'
                              : 'bg-muted'
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Play
                            className={`h-4 w-4 ${lesson.current ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                        )}
                      </div>
                      <div>
                        <h4 className={`font-medium ${lesson.current ? 'text-primary' : ''}`}>
                          {lesson.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{lesson.duration}</p>
                      </div>
                    </div>

                    {lesson.current && (
                      <Badge className="bg-primary/10 text-primary">Em Andamento</Badge>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Video Player Placeholder */}
          <Card className="mt-6">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{lessons[selectedLesson]?.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    Player de vídeo seria implementado aqui
                  </p>
                  <Button
                    onClick={() => handleMarkCompleted(lessons[selectedLesson]?.id)}
                    disabled={lessons[selectedLesson]?.completed}
                  >
                    {lessons[selectedLesson]?.completed
                      ? 'Aula Concluída'
                      : 'Marcar como Concluída'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Discussões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Compartilhe suas dúvidas ou comentários..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Comentar
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 pt-4 border-t">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{comment.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{comment.user}</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                        <Button variant="ghost" size="sm" className="text-xs h-6 mt-1">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {comment.replies} respostas
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
