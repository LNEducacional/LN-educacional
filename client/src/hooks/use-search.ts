import api from '@/services/api';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './use-debounce';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'paper' | 'course' | 'ebook';
  price: number;
  thumbnailUrl?: string;
  url: string;
}

interface SearchPaper {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
}

interface SearchCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
}

interface SearchEbook {
  id: string;
  title: string;
  description: string;
  price: number;
  coverUrl?: string;
}

interface SearchResponse {
  papers: SearchPaper[];
  courses: SearchCourse[];
  ebooks: SearchEbook[];
  total: number;
}

export const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  const formatPapers = useCallback(
    (papers: SearchPaper[]) =>
      papers.map((paper) => ({
        id: paper.id,
        title: paper.title,
        description: paper.description,
        type: 'paper' as const,
        price: paper.price,
        thumbnailUrl: paper.thumbnailUrl,
        url: `/ready-papers/${paper.id}`,
      })),
    []
  );

  const formatCourses = useCallback(
    (courses: SearchCourse[]) =>
      courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        type: 'course' as const,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        url: `/courses/${course.id}`,
      })),
    []
  );

  const formatEbooks = useCallback(
    (ebooks: SearchEbook[]) =>
      ebooks.map((ebook) => ({
        id: ebook.id,
        title: ebook.title,
        description: ebook.description,
        type: 'ebook' as const,
        price: ebook.price,
        thumbnailUrl: ebook.coverUrl,
        url: `/ebooks/${ebook.id}`,
      })),
    []
  );

  const processSearchResults = useCallback(
    (data: SearchResponse): SearchResult[] => [
      ...formatPapers(data.papers || []),
      ...formatCourses(data.courses || []),
      ...formatEbooks(data.ebooks || []),
    ],
    [formatPapers, formatCourses, formatEbooks]
  );

  const handleSearchError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar produtos';
    setError(errorMessage);
    setResults([]);
  }, []);

  const isValidQuery = useCallback((searchQuery: string): boolean => {
    return searchQuery && searchQuery.length >= 2;
  }, []);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!isValidQuery(searchQuery)) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get<SearchResponse>('/search', {
          params: { q: searchQuery },
        });

        const formattedResults = processSearchResults(response.data);
        setResults(formattedResults);
      } catch (err: unknown) {
        handleSearchError(err);
      } finally {
        setLoading(false);
      }
    },
    [processSearchResults, handleSearchError, isValidQuery]
  );

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search,
  };
};
