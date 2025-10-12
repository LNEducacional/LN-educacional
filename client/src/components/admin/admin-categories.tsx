import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  coursesCount: number;
  createdAt: string;
}

const categoriesData = [
  {
    id: 1,
    name: 'Programação',
    description:
      'Cursos de desenvolvimento de software, linguagens de programação e tecnologias web',
    coursesCount: 45,
    color: '#3B82F6',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: 'Design',
    description: 'Cursos de design gráfico, UI/UX, ilustração e ferramentas de design',
    coursesCount: 28,
    color: '#10B981',
    createdAt: '2024-01-20',
  },
  {
    id: 3,
    name: 'Marketing',
    description: 'Cursos de marketing digital, estratégia de marca e vendas online',
    coursesCount: 15,
    color: '#F59E0B',
    createdAt: '2024-02-10',
  },
  {
    id: 4,
    name: 'Negócios',
    description: 'Cursos de empreendedorismo, gestão empresarial e finanças',
    coursesCount: 12,
    color: '#8B5CF6',
    createdAt: '2024-02-15',
  },
  {
    id: 5,
    name: 'Línguas',
    description: 'Cursos de idiomas estrangeiros e comunicação',
    coursesCount: 8,
    color: '#EF4444',
    createdAt: '2024-03-01',
  },
];

export function AdminCategories() {
  const nameId = useId();
  const descriptionId = useId();
  const colorId = useId();

  const [categories, setCategories] = useState(categoriesData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const handleCreateCategory = () => {
    const newCategory = {
      id: Date.now(),
      ...formData,
      coursesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCategories([...categories, newCategory]);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setIsDialogOpen(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    setCategories(
      categories.map((cat) => (cat.id === editingCategory.id ? { ...cat, ...formData } : cat))
    );
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Categorias</h1>
          <p className="text-muted-foreground">
            Organize os cursos em categorias para facilitar a navegação
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-hero" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Atualize as informações da categoria'
                  : 'Crie uma nova categoria para organizar os cursos'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor={nameId}>Nome da Categoria</Label>
                <Input
                  id={nameId}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Programação"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={descriptionId}>Descrição</Label>
                <Textarea
                  id={descriptionId}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o que esta categoria abrange..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={colorId}>Cor da Categoria</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={colorId}
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 p-1 border-border"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Total de Categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.coursesCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total de Cursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {Math.round(
                categories.reduce((sum, cat) => sum + cat.coursesCount, 0) / categories.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">Média de Cursos por Categoria</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Categorias */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {category.coursesCount} cursos
                </Badge>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Criada em {new Date(category.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira categoria para começar a organizar os cursos.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Categoria
          </Button>
        </Card>
      )}
    </div>
  );
}
