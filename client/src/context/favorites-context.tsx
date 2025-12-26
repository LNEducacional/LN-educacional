import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const FAVORITES_KEY = 'ln-educacional-favorites';

interface FavoritesState {
  courses: string[];
  ebooks: string[];
  papers: string[];
}

interface FavoritesContextType {
  favorites: FavoritesState;
  isFavorite: (id: string, type?: 'courses' | 'ebooks' | 'papers') => boolean;
  addFavorite: (id: string, type?: 'courses' | 'ebooks' | 'papers') => void;
  removeFavorite: (id: string, type?: 'courses' | 'ebooks' | 'papers') => void;
  toggleFavorite: (id: string, type?: 'courses' | 'ebooks' | 'papers') => boolean;
  getFavorites: (type?: 'courses' | 'ebooks' | 'papers') => string[];
  getFavoritesCount: (type?: 'courses' | 'ebooks' | 'papers') => number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const getInitialState = (): FavoritesState => {
  if (typeof window === 'undefined') {
    return { courses: [], ebooks: [], papers: [] };
  }

  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
  }

  return { courses: [], ebooks: [], papers: [] };
};

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritesState>(getInitialState);

  // Sincronizar com localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, [favorites]);

  // Verificar se um item é favorito
  const isFavorite = useCallback((id: string, type: 'courses' | 'ebooks' | 'papers' = 'courses') => {
    return favorites[type].includes(id);
  }, [favorites]);

  // Adicionar aos favoritos
  const addFavorite = useCallback((id: string, type: 'courses' | 'ebooks' | 'papers' = 'courses') => {
    setFavorites(prev => {
      if (prev[type].includes(id)) return prev;
      return {
        ...prev,
        [type]: [...prev[type], id],
      };
    });
  }, []);

  // Remover dos favoritos
  const removeFavorite = useCallback((id: string, type: 'courses' | 'ebooks' | 'papers' = 'courses') => {
    setFavorites(prev => ({
      ...prev,
      [type]: prev[type].filter(itemId => itemId !== id),
    }));
  }, []);

  // Toggle favorito
  const toggleFavorite = useCallback((id: string, type: 'courses' | 'ebooks' | 'papers' = 'courses') => {
    const isCurrentlyFavorite = favorites[type].includes(id);
    if (isCurrentlyFavorite) {
      removeFavorite(id, type);
      return false;
    } else {
      addFavorite(id, type);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Obter todos os favoritos de um tipo
  const getFavorites = useCallback((type: 'courses' | 'ebooks' | 'papers' = 'courses') => {
    return favorites[type];
  }, [favorites]);

  // Contar favoritos
  const getFavoritesCount = useCallback((type: 'courses' | 'ebooks' | 'papers' = 'courses') => {
    return favorites[type].length;
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        getFavorites,
        getFavoritesCount,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
