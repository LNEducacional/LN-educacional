import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Edit, Eye, FileText, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Paper {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  pages: number;
  price: number;
  fileUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function AdminReadyPapers() {
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    pages: 0,
    price: 0,
    isActive: true,
  });

  const { data: categories } = useApi<Category[]>('/categories');

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/papers', {
        params: { search: searchQuery },
      });
      setPapers(response.data);
    } catch (_error) {
      toast({
        title: 'Erro ao carregar papers',
        description: 'Não foi possível carregar a lista de papers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleCreate = async () => {
    try {
      const formDataToSend = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        formDataToSend.append(key, value.toString());
      }

      if (file) {
        formDataToSend.append('file', file);
      }
      if (previewFile) {
        formDataToSend.append('preview', previewFile);
      }
      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      await api.post('/admin/papers', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Paper criado com sucesso',
        description: 'O paper foi adicionado à biblioteca',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPapers();
    } catch (_error) {
      toast({
        title: 'Erro ao criar paper',
        description: 'Não foi possível criar o paper',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedPaper) return;

    try {
      const formDataToSend = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        formDataToSend.append(key, value.toString());
      }

      if (file) {
        formDataToSend.append('file', file);
      }
      if (previewFile) {
        formDataToSend.append('preview', previewFile);
      }
      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      await api.put(`/admin/papers/${selectedPaper.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Paper atualizado com sucesso',
        description: 'As alterações foram salvas',
      });

      setIsEditDialogOpen(false);
      resetForm();
      fetchPapers();
    } catch (_error) {
      toast({
        title: 'Erro ao atualizar paper',
        description: 'Não foi possível atualizar o paper',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPaper) return;

    try {
      await api.delete(`/admin/papers/${selectedPaper.id}`);

      toast({
        title: 'Paper removido',
        description: 'O paper foi removido com sucesso',
      });

      setIsDeleteDialogOpen(false);
      setSelectedPaper(null);
      fetchPapers();
    } catch (_error) {
      toast({
        title: 'Erro ao remover paper',
        description: 'Não foi possível remover o paper',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (paper: Paper) => {
    try {
      await api.patch(`/admin/papers/${paper.id}/toggle-active`);
      fetchPapers();
      toast({
        title: paper.isActive ? 'Paper desativado' : 'Paper ativado',
        description: `O paper foi ${paper.isActive ? 'desativado' : 'ativado'} com sucesso`,
      });
    } catch (_error) {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do paper',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      category: '',
      pages: 0,
      price: 0,
      isActive: true,
    });
    setFile(null);
    setPreviewFile(null);
    setThumbnailFile(null);
    setSelectedPaper(null);
  };

  const openEditDialog = (paper: Paper) => {
    setSelectedPaper(paper);
    setFormData({
      title: paper.title,
      description: paper.description,
      subject: paper.subject,
      category: paper.category,
      pages: paper.pages,
      price: paper.price / 100,
      isActive: paper.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Papers Prontos</h1>
          <p className="text-muted-foreground">
            Gerencie os papers prontos disponíveis na plataforma
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Paper
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum paper encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando um novo paper pronto.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {papers.map((paper) => (
                <div key={paper.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{paper.title}</h3>
                        <Badge variant={paper.isActive ? 'default' : 'secondary'}>
                          {paper.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{paper.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Disciplina: <span className="text-foreground">{paper.subject}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Categoria: <span className="text-foreground">{paper.category}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Páginas: <span className="text-foreground">{paper.pages}</span>
                        </span>
                        <span className="font-medium text-primary">{formatPrice(paper.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={paper.isActive}
                        onCheckedChange={() => handleToggleActive(paper)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(paper.previewUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(paper)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPaper(paper);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Paper</DialogTitle>
            <DialogDescription>Adicione um novo paper pronto à biblioteca</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título do paper"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o conteúdo do paper"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Matemática"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pages">Número de Páginas</Label>
                <Input
                  id="pages"
                  type="number"
                  value={formData.pages}
                  onChange={(e) =>
                    setFormData({ ...formData, pages: Number.parseInt(e.target.value, 10) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number.parseFloat(e.target.value) })
                  }
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Arquivo PDF</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preview">Arquivo de Preview (PDF)</Label>
              <Input
                id="preview"
                type="file"
                accept=".pdf"
                onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Imagem de Capa</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Paper</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Paper</DialogTitle>
            <DialogDescription>Atualize as informações do paper</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título do paper"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o conteúdo do paper"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-subject">Disciplina</Label>
                <Input
                  id="edit-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Matemática"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-pages">Número de Páginas</Label>
                <Input
                  id="edit-pages"
                  type="number"
                  value={formData.pages}
                  onChange={(e) =>
                    setFormData({ ...formData, pages: Number.parseInt(e.target.value, 10) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Preço (R$)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number.parseFloat(e.target.value) })
                  }
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-file">Arquivo PDF (deixe vazio para manter o atual)</Label>
              <Input
                id="edit-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-preview">
                Arquivo de Preview (deixe vazio para manter o atual)
              </Label>
              <Input
                id="edit-preview"
                type="file"
                accept=".pdf"
                onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-thumbnail">
                Imagem de Capa (deixe vazio para manter a atual)
              </Label>
              <Input
                id="edit-thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o paper "{selectedPaper?.title}"? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir Paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
