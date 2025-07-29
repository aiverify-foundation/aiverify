import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButtons from '../ActionButtons';

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

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: function MockButton({ text, variant, size, className, pill, textColor, ...props }: any) {
    return (
      <button
        className={className}
        data-testid="button"
        data-variant={variant}
        data-size={size}
        data-pill={pill}
        data-textcolor={textColor}
        {...props}
      >
        {text}
      </button>
    );
  },
  ButtonVariant: {
    OUTLINE: 'outline',
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
  },
}));

describe('ActionButtons', () => {
  it('should render the action buttons component', () => {
    render(<ActionButtons />);

    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('should render link to upload template page', () => {
    render(<ActionButtons />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/templates/upload');
  });

  it('should render button with correct text', () => {
    render(<ActionButtons />);

    const button = screen.getByTestId('button');
    expect(button).toHaveTextContent('UPLOAD TEMPLATE');
  });

  it('should render button with correct variant', () => {
    render(<ActionButtons />);

    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('data-variant', 'outline');
  });

  it('should render button with correct size', () => {
    render(<ActionButtons />);

    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  it('should have proper accessibility attributes', () => {
    render(<ActionButtons />);

    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'upload template button');

    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('aria-label', 'upload template');
  });

  it('should have proper CSS classes', () => {
    render(<ActionButtons />);

    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex', 'h-full', 'items-center');

    const button = screen.getByTestId('button');
    expect(button).toHaveClass('my-auto');
  });

  it('should render as a functional component', () => {
    expect(typeof ActionButtons).toBe('function');
  });

  describe('Link behavior', () => {
    it('should use Next.js Link component', () => {
      render(<ActionButtons />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should pass href to templates upload page', () => {
      render(<ActionButtons />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/templates/upload');
    });
  });

  describe('Button properties', () => {
    it('should have pill prop', () => {
      render(<ActionButtons />);

      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('data-pill', 'true');
    });

    it('should have white text color', () => {
      render(<ActionButtons />);

      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('data-textcolor', 'white');
    });
  });

  describe('Accessibility', () => {
    it('should have proper role for group', () => {
      render(<ActionButtons />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should have descriptive aria-label for group', () => {
      render(<ActionButtons />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'upload template button');
    });

    it('should have descriptive aria-label for button', () => {
      render(<ActionButtons />);

      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('aria-label', 'upload template');
    });
  });

  describe('Styling', () => {
    it('should have flex layout for container', () => {
      render(<ActionButtons />);

      const container = screen.getByRole('group');
      expect(container).toHaveClass('flex');
    });

    it('should have full height and center items', () => {
      render(<ActionButtons />);

      const container = screen.getByRole('group');
      expect(container).toHaveClass('h-full', 'items-center');
    });

    it('should have auto margin for button', () => {
      render(<ActionButtons />);

      const button = screen.getByTestId('button');
      expect(button).toHaveClass('my-auto');
    });
  });
}); 