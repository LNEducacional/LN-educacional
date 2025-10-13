import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import type { AcademicArea, PaperType } from '@/types/paper';
import type { CustomPaperRequest } from '@/types/custom-paper';
import api from '@/services/api';
import {
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Hash,
  Tag,
  User,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
}

const AddCustomPaperPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formData, setFormData] = useState<CustomPaperRequest & { userId: string }>({
    title: '',
    description: '',
    paperType: 'article' as PaperType,
    academicArea: 'other' as AcademicArea,
    pageCount: 10,
    deadline: '',
    urgency: 'NORMAL',
    requirements: '',
    keywords: '',
    references: '',
    userId: '',
  });

  // Buscar lista de usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        toast.error('Erro ao carregar lista de usuários');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.deadline || !formData.requirements || !formData.userId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Criar o trabalho personalizado
      await api.post('/admin/custom-papers', {
        ...formData,
        academicArea: formData.academicArea.toUpperCase(),
        paperType: formData.paperType.toUpperCase(),
      });

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['admin-custom-papers'] });

      toast.success('Trabalho personalizado criado com sucesso!');
      navigate('/admin/custom-papers');
    } catch (error: any) {
      console.error('Erro ao criar trabalho:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar trabalho personalizado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Adicionar Trabalho Personalizado</h1>
              <p className="text-muted-foreground">Crie um novo trabalho personalizado no sistema</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Trabalho</CardTitle>
                  <CardDescription>
                    Preencha os detalhes do trabalho personalizado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Usuário */}
                  <div className="space-y-2">
                    <Label htmlFor="userId">
                      Usuário <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={formData.userId}
                        onValueChange={(value) => setFormData({ ...formData, userId: value })}
                        disabled={loadingUsers}
                      >
                        <SelectTrigger id="userId" className="pl-10">
                          <SelectValue placeholder={loadingUsers ? "Carregando usuários..." : "Selecione um usuário"} />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Título <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="title"
                        placeholder="Ex: TCC sobre Inteligência Artificial"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Tipo de Trabalho e Área Acadêmica */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="paperType">
                        Tipo de Trabalho <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.paperType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, paperType: value as PaperType })
                          }
                        >
                          <SelectTrigger id="paperType" className="pl-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Artigo</SelectItem>
                            <SelectItem value="review">Resenha</SelectItem>
                            <SelectItem value="thesis">TCC</SelectItem>
                            <SelectItem value="dissertation">Dissertação</SelectItem>
                            <SelectItem value="project">Projeto</SelectItem>
                            <SelectItem value="essay">Redação</SelectItem>
                            <SelectItem value="summary">Resumo</SelectItem>
                            <SelectItem value="monography">Monografia</SelectItem>
                            <SelectItem value="case_study">Estudo de Caso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academicArea">
                        Área Acadêmica <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.academicArea}
                          onValueChange={(value) =>
                            setFormData({ ...formData, academicArea: value as AcademicArea })
                          }
                        >
                          <SelectTrigger id="academicArea" className="pl-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administration">Administração</SelectItem>
                            <SelectItem value="law">Direito</SelectItem>
                            <SelectItem value="education">Educação</SelectItem>
                            <SelectItem value="engineering">Engenharia</SelectItem>
                            <SelectItem value="psychology">Psicologia</SelectItem>
                            <SelectItem value="health">Saúde</SelectItem>
                            <SelectItem value="accounting">Contabilidade</SelectItem>
                            <SelectItem value="arts">Artes</SelectItem>
                            <SelectItem value="economics">Economia</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Descrição <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o trabalho..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Requisitos */}
                  <div className="space-y-2">
                    <Label htmlFor="requirements">
                      Requisitos <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder="Requisitos específicos do trabalho..."
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Número de Páginas, Prazo e Urgência */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="pageCount">
                        Nº de Páginas <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          placeholder="10"
                          value={formData.pageCount}
                          onChange={(e) =>
                            setFormData({ ...formData, pageCount: Number.parseInt(e.target.value) || 10 })
                          }
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">
                        Prazo <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">
                        Urgência <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.urgency}
                          onValueChange={(value) =>
                            setFormData({ ...formData, urgency: value as 'NORMAL' | 'URGENT' | 'VERY_URGENT' })
                          }
                        >
                          <SelectTrigger id="urgency" className="pl-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORMAL">Normal</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                            <SelectItem value="VERY_URGENT">Muito Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Palavras-chave */}
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Palavras-chave (opcional)</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="keywords"
                        placeholder="Ex: IA, Machine Learning, Deep Learning"
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Referências */}
                  <div className="space-y-2">
                    <Label htmlFor="references">Referências (opcional)</Label>
                    <Textarea
                      id="references"
                      placeholder="Referências bibliográficas..."
                      value={formData.references}
                      onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/admin/custom-papers')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Criando...' : 'Criar Trabalho'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AddCustomPaperPage;
