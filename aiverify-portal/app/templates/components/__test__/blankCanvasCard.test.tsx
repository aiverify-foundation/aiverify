import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlankCanvasCard } from '../blankCanvasCard';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Card component
jest.mock('@/lib/components/card/card', () => {
  const MockCardContent = function ({ children, className, ...props }: any) {
    return (
      <div className={className} data-testid="card-content" {...props}>
        {children}
      </div>
    );
  };

  const MockCard = function ({ children, size, width, className, ...props }: any) {
    return (
      <div
        className={className}
        data-testid="blank-canvas-card"
        data-size={size}
        data-width={width}
        {...props}
      >
        {children}
      </div>
    );
  };

  MockCard.Content = MockCardContent;

  return { Card: MockCard };
});

describe('BlankCanvasCard', () => {
  it('should render the blank canvas card', () => {
    render(<BlankCanvasCard />);

    expect(screen.getByTestId('blank-canvas-card')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('should display correct heading text', () => {
    render(<BlankCanvasCard />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Blank Canvas');
  });

  it('should display correct description text', () => {
    render(<BlankCanvasCard />);

    expect(
      screen.getByText('Design your own report by dragging widgets onto a blank canvas.')
    ).toBeInTheDocument();
  });

  it('should render as a link to /canvas', () => {
    render(<BlankCanvasCard />);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/canvas');
  });

  it('should have proper card size and width props', () => {
    render(<BlankCanvasCard />);

    const card = screen.getByTestId('blank-canvas-card');
    expect(card).toHaveAttribute('data-size', 'md');
    expect(card).toHaveAttribute('data-width', '450');
  });

  it('should have correct CSS classes applied', () => {
    render(<BlankCanvasCard />);

    const card = screen.getByTestId('blank-canvas-card');
    expect(card).toHaveClass(
      'cursor-pointer',
      '!bg-none',
      'text-white',
      'text-shadow-sm',
      'hover:outline',
      'hover:outline-1',
      'hover:outline-primary-400',
      '[&&]:bg-secondary-900'
    );
  });

  it('should have correct content styling', () => {
    render(<BlankCanvasCard />);

    const cardContent = screen.getByTestId('card-content');
    expect(cardContent).toHaveClass('flex', 'flex-col', 'gap-7', 'p-4');
  });

  it('should have properly styled heading', () => {
    render(<BlankCanvasCard />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass(
      'text-mainpurple',
      'text-[1.2rem]',
      'font-bold'
    );
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<BlankCanvasCard />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('should be accessible as a link', () => {
      render(<BlankCanvasCard />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAccessibleName();
    });

    it('should be keyboard navigable', () => {
      render(<BlankCanvasCard />);

      const link = screen.getByRole('link');
      link.focus();
      expect(link).toHaveFocus();
    });
  });

  describe('User interactions', () => {
    it('should be clickable', () => {
      render(<BlankCanvasCard />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      
      fireEvent.click(link);
      // In a real app, this would navigate to /canvas
      expect(link).toHaveAttribute('href', '/canvas');
    });

    it('should handle hover state with CSS classes', () => {
      render(<BlankCanvasCard />);

      const card = screen.getByTestId('blank-canvas-card');
      expect(card).toHaveClass('hover:outline', 'hover:outline-1', 'hover:outline-primary-400');
    });
  });

  describe('Content structure', () => {
    it('should have correct content layout', () => {
      render(<BlankCanvasCard />);

      const cardContent = screen.getByTestId('card-content');
      const heading = screen.getByRole('heading', { level: 3 });
      const description = screen.getByText('Design your own report by dragging widgets onto a blank canvas.');

      expect(cardContent).toContainElement(heading);
      expect(cardContent).toContainElement(description);
    });

    it('should render elements in correct order', () => {
      render(<BlankCanvasCard />);

      const cardContent = screen.getByTestId('card-content');
      const children = Array.from(cardContent.children);
      
      expect(children[0]).toHaveTextContent('Blank Canvas');
      expect(children[1]).toHaveTextContent('Design your own report by dragging widgets onto a blank canvas.');
    });
  });

  describe('Card component integration', () => {
    it('should pass correct props to Card component', () => {
      render(<BlankCanvasCard />);

      const card = screen.getByTestId('blank-canvas-card');
      expect(card).toHaveAttribute('data-size', 'md');
      expect(card).toHaveAttribute('data-width', '450');
    });

    it('should render Card.Content with proper props', () => {
      render(<BlankCanvasCard />);

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('flex', 'flex-col', 'gap-7', 'p-4');
    });
  });

  describe('Link component integration', () => {
    it('should wrap Card with Link component', () => {
      render(<BlankCanvasCard />);

      const link = screen.getByRole('link');
      const card = screen.getByTestId('blank-canvas-card');
      expect(link).toContainElement(card);
    });

    it('should have correct href attribute', () => {
      render(<BlankCanvasCard />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/canvas');
    });
  });
}); 