import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EbookCard } from './ebook-card';

// Mock the cart context
const mockAddItem = vi.fn();
const mockToast = vi.fn();

// Mock the hooks
vi.mock('@/context/cart-context', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className} data-testid="badge">
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
    asChild,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    asChild?: boolean;
  }) => {
    if (asChild) {
      return <>{children}</>;
    }
    return (
      <button onClick={onClick} className={className} data-variant={variant}>
        {children}
      </button>
    );
  },
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-footer">
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
}));

const defaultProps = {
  id: 1,
  title: 'Test Ebook',
  description: 'This is a test ebook description',
  price: 2990, // R$ 29.90 in cents
  isFree: false,
  pageCount: 150,
  coverUrl: 'https://example.com/cover.jpg',
  academicArea: 'CIENCIAS_EXATAS',
};

const freeEbookProps = {
  ...defaultProps,
  id: 2,
  title: 'Free Test Ebook',
  price: 0,
  isFree: true,
};

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('EbookCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render ebook card with basic information', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      expect(screen.getByText('Test Ebook')).toBeInTheDocument();
      expect(screen.getByText('This is a test ebook description')).toBeInTheDocument();
      expect(screen.getByText('150 páginas')).toBeInTheDocument();
      expect(screen.getByText('CIENCIAS_EXATAS')).toBeInTheDocument();
      expect(screen.getByText('PDF Digital')).toBeInTheDocument();
    });

    it('should display formatted price for paid ebooks', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      expect(screen.getByText('R$ 29,90')).toBeInTheDocument();
      expect(screen.getByText('Comprar e Baixar')).toBeInTheDocument();
    });

    it('should display "Gratuito" for free ebooks', () => {
      renderWithRouter(<EbookCard {...freeEbookProps} />);

      expect(screen.getAllByText('Gratuito')).toHaveLength(2); // Badge + price
      expect(screen.getByText('Download Gratuito')).toBeInTheDocument();
    });

    it('should render ebook cover image with correct alt text', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const image = screen.getByAltText('Test Ebook');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    it('should render details link with correct path', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const detailsLink = screen.getByRole('link');
      expect(detailsLink).toHaveAttribute('href', '/ebooks/1');
      expect(screen.getByText('Detalhes')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should add paid ebook to cart when clicking buy button', async () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const buyButton = screen.getByText('Comprar e Baixar');
      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith({
          id: '1',
          title: 'Test Ebook',
          description: 'This is a test ebook description',
          price: 2990,
          type: 'ebook',
          thumbnailUrl: 'https://example.com/cover.jpg',
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'E-book adicionado ao carrinho',
        description: 'Test Ebook foi adicionado ao seu carrinho.',
      });
    });

    it('should trigger download for free ebook when clicking download button', async () => {
      renderWithRouter(<EbookCard {...freeEbookProps} />);

      const downloadButton = screen.getByText('Download Gratuito');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Download iniciado',
          description: 'Free Test Ebook será baixado em instantes.',
        });
      });

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('should handle image load error by setting placeholder', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const image = screen.getByAltText('Test Ebook');

      // Simulate image load error
      fireEvent.error(image);

      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  describe('Price Formatting', () => {
    it('should format different price values correctly', () => {
      const testCases = [
        { price: 1000, expected: 'R$ 10,00' },
        { price: 2990, expected: 'R$ 29,90' },
        { price: 15500, expected: 'R$ 155,00' },
        { price: 99, expected: 'R$ 0,99' },
      ];

      testCases.forEach(({ price, expected }) => {
        const { unmount } = renderWithRouter(<EbookCard {...defaultProps} price={price} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Badges', () => {
    it('should display "Gratuito" badge for free ebooks', () => {
      renderWithRouter(<EbookCard {...freeEbookProps} />);

      const badges = screen.getAllByTestId('badge');
      const gratuitoBadge = badges.find((badge) => badge.textContent === 'Gratuito');
      expect(gratuitoBadge).toBeInTheDocument();
    });

    it('should not display "Gratuito" badge for paid ebooks', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const badges = screen.getAllByTestId('badge');
      const gratuitoBadge = badges.find((badge) => badge.textContent === 'Gratuito');
      expect(gratuitoBadge).toBeUndefined();
    });

    it('should always display page count and academic area badges', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      expect(screen.getByText('150 páginas')).toBeInTheDocument();
      expect(screen.getByText('CIENCIAS_EXATAS')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing cover URL gracefully', () => {
      renderWithRouter(<EbookCard {...defaultProps} coverUrl="" />);

      const image = screen.getByAltText('Test Ebook');
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });

    it('should handle very long titles and descriptions', () => {
      const longProps = {
        ...defaultProps,
        title:
          'This is a very long ebook title that should be truncated when displayed in the card component',
        description:
          'This is a very long description that should also be truncated when displayed. It contains multiple sentences and should test the line-clamp behavior of the component.',
      };

      renderWithRouter(<EbookCard {...longProps} />);

      expect(screen.getByText(longProps.title)).toBeInTheDocument();
      expect(screen.getByText(longProps.description)).toBeInTheDocument();
    });

    it('should handle zero pages correctly', () => {
      renderWithRouter(<EbookCard {...defaultProps} pageCount={0} />);

      expect(screen.getByText('0 páginas')).toBeInTheDocument();
    });

    it('should handle large page counts', () => {
      renderWithRouter(<EbookCard {...defaultProps} pageCount={9999} />);

      expect(screen.getByText('9999 páginas')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Test Ebook');

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1); // Buy button

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderWithRouter(<EbookCard {...defaultProps} />);

      const buyButton = screen.getByText('Comprar e Baixar');
      const detailsLink = screen.getByRole('link');

      expect(buyButton).toBeInTheDocument();
      expect(detailsLink).toBeInTheDocument();

      // These elements should be focusable
      buyButton.focus();
      expect(document.activeElement).toBe(buyButton);

      detailsLink.focus();
      expect(document.activeElement).toBe(detailsLink);
    });
  });
});
