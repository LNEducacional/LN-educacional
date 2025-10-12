import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/services/api';
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

interface SearchResult {
  papers: PaperResult[];
  courses: CourseResult[];
  ebooks: EbookResult[];
  total: number;
}

interface PaperResult {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  type: 'READY' | 'FREE';
}

interface CourseResult {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  duration: number;
  level: string;
}

interface EbookResult {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  pageCount: number;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Debounced search function
  const handleSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/search', {
        params: {
          q: searchQuery,
          limit: 10,
        },
      });
      setResults(response.data);
      saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Handle search input change
  const onSearchChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      handleSearch(value);
    } else {
      setResults(null);
    }
  };

  // Handle result click
  const handleResultClick = (type: string, id: string) => {
    setOpen(false);
    setQuery('');
    setResults(null);

    switch (type) {
      case 'paper':
        navigate(`/papers/${id}`);
        break;
      case 'course':
        navigate(`/courses/${id}`);
        break;
      case 'ebook':
        navigate(`/ebooks/${id}`);
        break;
    }
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  // Highlight search term in text
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={`highlight-${part.slice(0, 20)}-${Math.random()}`}
          className="bg-yellow-200 dark:bg-yellow-800 font-medium"
        >
          {part}
        </mark>
      ) : (
        <span key={`text-${index}-${Math.random()}`}>{part}</span>
      )
    );
  };

  // Filter results by type
  const getFilteredResults = () => {
    if (!results) return { papers: [], courses: [], ebooks: [] };

    switch (activeTab) {
      case 'papers':
        return { papers: results.papers, courses: [], ebooks: [] };
      case 'courses':
        return { papers: [], courses: results.courses, ebooks: [] };
      case 'ebooks':
        return { papers: [], courses: [], ebooks: results.ebooks };
      default:
        return results;
    }
  };

  const filteredResults = getFilteredResults();
  const hasResults =
    results &&
    (results.papers.length > 0 || results.courses.length > 0 || results.ebooks.length > 0);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar...</span>
        </div>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar cursos, trabalhos, e-books..."
                className="pl-10 pr-10 h-12 text-base"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="border-t">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* Results */}
            {!loading && hasResults && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="all"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    Todos ({results.total})
                  </TabsTrigger>
                  {results.papers.length > 0 && (
                    <TabsTrigger
                      value="papers"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      Trabalhos ({results.papers.length})
                    </TabsTrigger>
                  )}
                  {results.courses.length > 0 && (
                    <TabsTrigger
                      value="courses"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      Cursos ({results.courses.length})
                    </TabsTrigger>
                  )}
                  {results.ebooks.length > 0 && (
                    <TabsTrigger
                      value="ebooks"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      E-books ({results.ebooks.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {/* Papers Results */}
                    {filteredResults.papers.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Trabalhos Acadêmicos
                        </div>
                        {filteredResults.papers.map((paper) => (
                          <button
                            type="button"
                            key={paper.id}
                            onClick={() => handleResultClick('paper', paper.id)}
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted transition-colors"
                          >
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <div className="font-medium text-sm">
                                {highlightText(paper.title, query)}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {highlightText(paper.description, query)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {paper.subject}
                                </Badge>
                                <span className="text-xs font-medium text-primary">
                                  {formatPrice(paper.price)}
                                </span>
                                {paper.type === 'FREE' && (
                                  <Badge className="text-xs bg-green-500 text-white">
                                    Gratuito
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Courses Results */}
                    {filteredResults.courses.length > 0 && (
                      <div className="space-y-1 mt-4">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Cursos Online
                        </div>
                        {filteredResults.courses.map((course) => (
                          <button
                            type="button"
                            key={course.id}
                            onClick={() => handleResultClick('course', course.id)}
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted transition-colors"
                          >
                            <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <div className="font-medium text-sm">
                                {highlightText(course.title, query)}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {highlightText(course.description, query)}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {course.instructor}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {course.level}
                                </Badge>
                                <span className="text-xs font-medium text-primary">
                                  {formatPrice(course.price)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Ebooks Results */}
                    {filteredResults.ebooks.length > 0 && (
                      <div className="space-y-1 mt-4">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          E-books e Apostilas
                        </div>
                        {filteredResults.ebooks.map((ebook) => (
                          <button
                            type="button"
                            key={ebook.id}
                            onClick={() => handleResultClick('ebook', ebook.id)}
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted transition-colors"
                          >
                            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <div className="font-medium text-sm">
                                {highlightText(ebook.title, query)}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {highlightText(ebook.description, query)}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {ebook.pageCount} páginas
                                </span>
                                <span className="text-xs font-medium text-primary">
                                  {formatPrice(ebook.price)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Tabs>
            )}

            {/* No Results */}
            {!loading && query && !hasResults && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum resultado encontrado para "{query}"</p>
              </div>
            )}

            {/* Recent Searches */}
            {!loading && !query && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Buscas recentes
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search) => (
                    <button
                      type="button"
                      key={search}
                      onClick={() => {
                        setQuery(search);
                        onSearchChange(search);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !query && recentSearches.length === 0 && (
              <div className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Busque por cursos, trabalhos acadêmicos e e-books
                </p>
                <p className="text-xs text-muted-foreground">
                  Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd> para abrir a
                  busca rapidamente
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
