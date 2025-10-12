import { useDeferredValue, useState, useTransition } from 'react';

interface ConcurrentListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  filterFn?: (item: T, query: string) => boolean;
  searchPlaceholder?: string;
  className?: string;
  searchClassName?: string;
  listClassName?: string;
}

export function ConcurrentList<T>({
  items,
  renderItem,
  filterFn,
  searchPlaceholder = 'Buscar...',
  className = '',
  searchClassName = '',
  listClassName = '',
}: ConcurrentListProps<T>) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredItems = filterFn ? items.filter((item) => filterFn(item, deferredQuery)) : items;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div className={className}>
      {filterFn && (
        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              isPending ? 'opacity-70' : ''
            } ${searchClassName}`}
          />
          {isPending && <div className="mt-2 text-sm text-gray-500">Buscando...</div>}
        </div>
      )}

      <div className={`list-container ${listClassName}`}>
        {filteredItems.map((item, index) => {
          // Generate a unique key based on item content if available
          const key =
            typeof item === 'object' && item !== null && 'id' in item
              ? (item as { id: string }).id
              : `item-${index}`;
          return <div key={key}>{renderItem(item, index)}</div>;
        })}

        {filteredItems.length === 0 && deferredQuery && (
          <div className="text-center text-gray-500 py-8">
            Nenhum resultado encontrado para "{deferredQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

// Versão especializada para papers
export function ConcurrentPapersList({
  papers,
  onPaperSelect,
  className = '',
}: {
  papers: Array<{ id: string; title: string; description: string; area: string }>;
  onPaperSelect?: (paper: { id: string; title: string; description: string; area: string }) => void;
  className?: string;
}) {
  return (
    <ConcurrentList
      items={papers}
      filterFn={(paper, query) => {
        const searchText = query.toLowerCase();
        return (
          paper.title.toLowerCase().includes(searchText) ||
          paper.description.toLowerCase().includes(searchText) ||
          paper.area.toLowerCase().includes(searchText)
        );
      }}
      renderItem={(paper) => (
        <button
          type="button"
          className="w-full p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left"
          onClick={() => onPaperSelect?.(paper)}
          aria-label={`Selecionar trabalho: ${paper.title}`}
        >
          <h3 className="font-semibold text-lg mb-2">{paper.title}</h3>
          <p className="text-gray-600 mb-2">{paper.description}</p>
          <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">{paper.area}</span>
        </button>
      )}
      searchPlaceholder="Buscar por título, descrição ou área..."
      className={className}
      listClassName="space-y-4"
    />
  );
}

// Versão especializada para cursos
export function ConcurrentCoursesList({
  courses,
  onCourseSelect,
  className = '',
}: {
  courses: Array<{
    id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
  }>;
  onCourseSelect?: (course: {
    id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
  }) => void;
  className?: string;
}) {
  return (
    <ConcurrentList
      items={courses}
      filterFn={(course, query) => {
        const searchText = query.toLowerCase();
        return (
          course.title.toLowerCase().includes(searchText) ||
          course.description.toLowerCase().includes(searchText) ||
          course.instructor.toLowerCase().includes(searchText)
        );
      }}
      renderItem={(course) => (
        <button
          type="button"
          className="w-full p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left"
          onClick={() => onCourseSelect?.(course)}
          aria-label={`Selecionar curso: ${course.title}`}
        >
          <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
          <p className="text-gray-600 mb-2">{course.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Por: {course.instructor}</span>
            <span className="font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(course.price)}
            </span>
          </div>
        </button>
      )}
      searchPlaceholder="Buscar por título, descrição ou instrutor..."
      className={className}
      listClassName="space-y-4"
    />
  );
}
