import { BlogCard } from '@/components/ui/blog-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdvancedSearch } from '@/components/ui/advanced-search';
import { useToast } from '@/hooks/use-toast';
import blogService, { type BlogPost, type Category, type Tag, type AdvancedSearchFilters } from '@/services/blog.service';
import { Loader2, Search, Filter, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<AdvancedSearchFilters>({});
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await blogService.getCategories();
      setCategories(data.categories);
    } catch (err: unknown) {
      console.error('Error loading categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const loadTags = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const data = await blogService.getTags();
      setTags(data.tags);
    } catch (err: unknown) {
      console.error('Error loading tags:', err);
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data;

      if (useAdvancedSearch) {
        // Use advanced search endpoint
        data = await blogService.searchPosts(currentFilters);
      } else {
        // Use simple search for backward compatibility
        const filters = {
          search: searchQuery || undefined,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        };
        data = await blogService.getPublishedPosts(filters);
      }

      setPosts(data.posts);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      console.error('Error loading blog posts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar posts do blog';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, useAdvancedSearch, currentFilters]);

  const handleAdvancedSearch = useCallback((filters: AdvancedSearchFilters) => {
    setCurrentFilters(filters);
    setUseAdvancedSearch(true);
    // The loadPosts will be triggered by the useEffect when currentFilters changes
  }, []);

  // Load categories, tags and posts
  useEffect(() => {
    loadCategories();
    loadTags();
  }, [loadCategories, loadTags]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentFilters({});
    setUseAdvancedSearch(false);
  };

  const toggleSearchMode = () => {
    if (useAdvancedSearch) {
      // Switch back to simple search
      setUseAdvancedSearch(false);
      setCurrentFilters({});
    } else {
      // Switch to advanced search
      setUseAdvancedSearch(true);
      // Initialize advanced search with current simple filters
      setCurrentFilters({
        search: searchQuery || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    loadPosts();
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Artigos e conteúdos para sua jornada acadêmica
        </p>
      </div>

      {/* Filters Bar */}
      <div className="mb-8 animate-slide-up">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Buscar artigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[280px] bg-background">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {!isLoadingCategories && categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category._count?.posts || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}

            {/* Advanced Search Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSearchMode}
              className="gap-2 lg:w-auto w-full"
            >
              <Filter className="h-4 w-4" />
              {useAdvancedSearch ? 'Simples' : 'Avançada'}
            </Button>
          </div>

          {/* Advanced Search Panel */}
          {useAdvancedSearch && (
            <div className="mt-4 pt-4 border-t border-border">
              <AdvancedSearch
                onSearch={handleAdvancedSearch}
                categories={categories}
                tags={tags}
                isLoading={isLoading}
                initialFilters={currentFilters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="max-w-md mx-auto text-center py-8">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Erro ao carregar posts do blog</p>
            <Button onClick={handleRetry} variant="outline">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {useAdvancedSearch ? (
              <>
                <strong className="text-foreground">{total}</strong> {total === 1 ? 'artigo encontrado' : 'artigos encontrados'}
              </>
            ) : (
              <>
                <strong className="text-foreground">{posts.length}</strong> {posts.length === 1 ? 'artigo' : 'artigos'}
              </>
            )}
          </p>
        </div>
      )}

      {/* Blog Posts */}
      {!isLoading &&
        !error &&
        (posts.length > 0 ? (
          <div className="animate-scale-in space-y-8">
            {/* All Posts Grid - sem featured, todos do mesmo tamanho */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} featured={false} />
              ))}
            </div>
          </div>
        ) : (
          <Card className="max-w-md mx-auto text-center py-8 animate-fade-in">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                {useAdvancedSearch
                  ? 'Nenhum artigo encontrado com os filtros aplicados.'
                  : searchQuery
                  ? `Nenhum artigo encontrado para "${searchQuery}".`
                  : 'Nenhum artigo encontrado nesta categoria.'
                }
              </p>
              {(searchQuery || selectedCategory !== 'all' || useAdvancedSearch) && (
                <Button onClick={handleClearFilters} variant="outline">
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

    </div>
  );
}
