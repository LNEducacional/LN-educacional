import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import api from '@/services/api';
import type { Course } from '@/types/course';
import {
  formatAcademicArea,
  formatCourseStatus,
  formatDuration,
  formatPrice,
} from '@/utils/course-formatters';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Edit, Loader2, Play } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const CourseDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Buscar curso da API
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data as Course;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Carregando curso...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !course) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-destructive mb-2">
                {error ? 'Erro ao carregar curso' : 'Curso não encontrado'}
              </p>
              <Button onClick={() => navigate('/admin/cursos')}>Voltar para lista</Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detalhes do Curso</h1>
                    <p className="text-muted-foreground">
                      Visualize e gerencie as informações do curso
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/admin/cursos/editar/${course.id}`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar Curso
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Informações Principais */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">{course.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={course.status === 'ativo' ? 'default' : 'secondary'}>
                              {formatCourseStatus(course.status)}
                            </Badge>
                            <Badge variant="outline">
                              {formatAcademicArea(course.academicArea)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                    </CardContent>
                  </Card>

                  {/* Informações do Instrutor */}
                  {(course.instructorName || course.instructorBio) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Instrutor</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {course.instructorName && (
                          <div>
                            <h4 className="font-medium">{course.instructorName}</h4>
                          </div>
                        )}
                        {course.instructorBio && (
                          <p className="text-muted-foreground text-sm">{course.instructorBio}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Arquivos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Arquivos</CardTitle>
                      <CardDescription>Arquivos associados ao curso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {course.thumbnailUrl && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Thumbnail</Label>
                            <img
                              src={course.thumbnailUrl}
                              alt="Thumbnail do curso"
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Baixar Thumbnail
                            </Button>
                          </div>
                        )}

                        {course.videoUrl && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Vídeo</Label>
                            <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                              <Play className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Baixar Vídeo
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar com informações complementares */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Visão Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Preço</span>
                          <span className="font-medium">{formatPrice(course.price)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Duração</span>
                          <span className="font-medium">{formatDuration(course.duration)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={course.status === 'ativo' ? 'default' : 'secondary'}>
                            {formatCourseStatus(course.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estatísticas</CardTitle>
                      <CardDescription>Dados de performance do curso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Matrículas</span>
                          <span className="font-medium">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avaliações</span>
                          <span className="font-medium">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Conclusões</span>
                          <span className="font-medium">0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Metadados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">ID</span>
                          <span className="font-medium">#{course.id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Criado em</span>
                          <span className="font-medium">
                            {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {course.updatedAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Atualizado em</span>
                            <span className="font-medium">
                              {new Date(course.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export default CourseDetailsPage;
