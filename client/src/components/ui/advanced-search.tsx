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
import { Badge } from '@/components/ui/badge';
import type { AdvancedSearchFilters, Category, Tag } from '@/services/blog.service';
import { CalendarIcon, SearchIcon, FilterIcon, XIcon, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void;
  categories: Category[];
  tags: Tag[];
  authors?: { id: string; name: string }[];
  isLoading?: boolean;
  showAdminOptions?: boolean;
  initialFilters?: AdvancedSearchFilters;
}

const sortOptions = [
  { value: 'date', label: 'Data de publicação', icon: CalendarIcon },
  { value: 'popularity', label: 'Popularidade', icon: TrendingUp },
  { value: 'relevance', label: 'Relevância', icon: SearchIcon },
  { value: 'views', label: 'Visualizações', icon: Users },
];

const sortOrderOptions = [
  { value: 'desc', label: 'Decrescente (Mais recente primeiro)' },
  { value: 'asc', label: 'Crescente (Mais antigo primeiro)' },
];

export function AdvancedSearch({
  onSearch,
  categories,
  tags,
  authors = [],
  isLoading = false,
  showAdminOptions = false,
  initialFilters = {},
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters.tagIds || []);

  // Debounce search input to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search || '', 300);

  // Effect to trigger search when debounced search changes
  useEffect(() => {
    if (filters.search !== debouncedSearch) {
      const newFilters = { ...filters, search: debouncedSearch };
      setFilters(newFilters);
      onSearch(newFilters);
    }
  }, [debouncedSearch, filters, onSearch]);

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: string | string[] | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Don't trigger search immediately for search text (handled by debounce)
    if (key !== 'search') {
      onSearch(newFilters);
    }
  };

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(newSelectedTags);
    handleFilterChange('tagIds', newSelectedTags);
  };

  const clearAllFilters = () => {
    const clearedFilters: AdvancedSearchFilters = {};
    setFilters(clearedFilters);
    setSelectedTags([]);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key =>
    filters[key as keyof AdvancedSearchFilters] !== undefined &&
    filters[key as keyof AdvancedSearchFilters] !== ''
  );

  const getSelectedTagsNames = () => {
    return selectedTags.map(tagId => {
      const tag = tags.find(t => t.id === tagId);
      return tag ? tag.name : tagId;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              Busca Avançada
            </CardTitle>
            <CardDescription>
              Use filtros avançados para encontrar exatamente o que procura
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            {isExpanded ? 'Ocultar filtros' : 'Mais filtros'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Search Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Buscar por palavra-chave</Label>
            <Input
              id="search"
              type="search"
              placeholder="Digite sua busca..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="md:w-48">
            <Label>Categoria</Label>
            <Select
              value={filters.categoryId || 'all'}
              onValueChange={(value) => handleFilterChange('categoryId', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Data inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Data final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Author Filter - Admin only */}
            {showAdminOptions && authors.length > 0 && (
              <div>
                <Label>Autor</Label>
                <Select
                  value={filters.authorId || 'all'}
                  onValueChange={(value) => handleFilterChange('authorId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos os autores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os autores</SelectItem>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Published Filter - Admin only */}
            {showAdminOptions && (
              <div>
                <Label>Status de publicação</Label>
                <Select
                  value={filters.published !== undefined ? filters.published.toString() : 'all'}
                  onValueChange={(value) => {
                    const publishedValue = value === 'all' ? undefined : value === 'true';
                    handleFilterChange('published', publishedValue);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os posts</SelectItem>
                    <SelectItem value="true">Apenas publicados</SelectItem>
                    <SelectItem value="false">Apenas rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ordenar por</Label>
                <Select
                  value={filters.sortBy || 'date'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Select
                  value={filters.sortOrder || 'desc'}
                  onValueChange={(value) => handleFilterChange('sortOrder', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Ordem..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOrderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Tags Selection */}
        {tags.length > 0 && (
          <div>
            <Label>Tags ({selectedTags.length} selecionadas)</Label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                  {tag._count?.posts && ` (${tag._count.posts})`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm font-medium">Filtros ativos:</span>

            {filters.search && (
              <Badge variant="secondary">
                Busca: "{filters.search}"
                <XIcon className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {filters.categoryId && (
              <Badge variant="secondary">
                Categoria: {categories.find(c => c.id === filters.categoryId)?.name}
                <XIcon className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {selectedTags.length > 0 && (
              <Badge variant="secondary">
                Tags: {getSelectedTagsNames().join(', ')}
                <XIcon className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary">
                Período: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
                <XIcon className="h-3 w-3 ml-1" />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              Limpar todos
            </Button>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Buscando...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}