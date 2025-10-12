import { BlogCard } from '@/components/ui/blog-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import api from '@/services/api';
import blogService, { type BlogPost, type Category, type Tag, type AdvancedSearchFilters } from '@/services/blog.service';
import { Loader2, Mail, Search, Filter } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, insira um e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubscribing(true);

    try {
      await api.post('/newsletter/subscribe', { email: newsletterEmail });

      toast({
        title: 'Inscrição realizada com sucesso!',
        description: 'Você receberá nossos melhores conteúdos em breve.',
      });

      setNewsletterEmail('');
    } catch (error: unknown) {
      toast({
        title: 'Erro ao se inscrever',
        description:
          error.response?.data?.message ||
          'Ocorreu um erro ao processar sua inscrição. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadPosts();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Blog Educacional</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Artigos, dicas e conteúdos exclusivos para auxiliar em sua jornada acadêmica.
        </p>
      </div>

      {/* Search Toggle */}
      <div className="flex justify-center mb-6">
        <Button
          variant="outline"
          onClick={toggleSearchMode}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {useAdvancedSearch ? 'Busca Simples' : 'Busca Avançada'}
        </Button>
      </div>

      {/* Search Interface */}
      {useAdvancedSearch ? (
        <div className="mb-8 animate-slide-up">
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            categories={categories}
            tags={tags}
            isLoading={isLoading}
            initialFilters={currentFilters}
          />
        </div>
      ) : (
        /* Simple Filters */
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {!isLoadingCategories && categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({category._count?.posts || 0})
                </SelectItem>
              ))}
              {isLoadingCategories && (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

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
        <div className="mb-6 text-center text-muted-foreground">
          {useAdvancedSearch ? (
            <p>
              Encontrados <strong>{total}</strong> {total === 1 ? 'artigo' : 'artigos'}
              {Object.keys(currentFilters).some(key => currentFilters[key as keyof AdvancedSearchFilters])
                ? ' com os filtros aplicados'
                : ''
              }
            </p>
          ) : (
            <p>
              Mostrando <strong>{posts.length}</strong> {posts.length === 1 ? 'artigo' : 'artigos'}
              {(searchQuery || selectedCategory !== 'all') && ' encontrados'}
            </p>
          )}
        </div>
      )}

      {/* Blog Posts */}
      {!isLoading &&
        !error &&
        (posts.length > 0 ? (
          <div className="animate-scale-in">
            {/* Featured Post */}
            <div className="mb-12">
              <BlogCard post={posts[0]} featured={true} />
            </div>

            {/* Regular Posts Grid */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {posts.slice(1).map((post) => (
                  <BlogCard key={post.id} post={post} featured={false} />
                ))}
              </div>
            )}

            {/* Load More Button - Could be enhanced for pagination */}
            {posts.length > 4 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Ver todos os artigos
                </Button>
              </div>
            )}
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

      {/* Newsletter Section */}
      <Card className="mt-16 shadow-medium animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-accent/10 rounded-full">
              <Mail className="h-6 w-6 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl">Inscreva-se na nossa Newsletter</CardTitle>
          <CardDescription>
            Receba os melhores artigos e novidades diretamente na sua caixa de entrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSubscribing}
              className="bg-primary hover:bg-primary-hover"
            >
              {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Inscrever-se
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
