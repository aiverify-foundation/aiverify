import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButtons from '../ActionButtons';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, passHref }: any) {
    return (
      <a href={href} data-testid="next-link" data-href={href}>
        {children}
      </a>
    );
  };
});

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ 
    pill, 
    textColor, 
    variant, 
    size, 
    text, 
    'aria-label': ariaLabel 
  }: any) => (
    <button
      data-testid="upload-button"
      data-pill={pill}
      data-text-color={textColor}
      data-variant={variant}
      data-size={size}
      aria-label={ariaLabel}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    OUTLINE: 'OUTLINE',
  },
}));

describe('ActionButtons Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ActionButtons />);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('renders with correct accessibility attributes', () => {
    render(<ActionButtons />);
    
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'upload plugin button');
    expect(group).toHaveClass('flex');
  });

  it('renders Next.js Link with correct href', () => {
    render(<ActionButtons />);
    
    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('data-href', '/plugins/upload');
  });

  it('renders Button component with correct props', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('upload-button');
    expect(button).toHaveAttribute('data-pill', 'true');
    expect(button).toHaveAttribute('data-text-color', 'white');
    expect(button).toHaveAttribute('data-variant', 'OUTLINE');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('aria-label', 'upload plugin');
    expect(button).toHaveTextContent('UPLOAD PLUGIN');
  });

  it('has proper DOM structure', () => {
    render(<ActionButtons />);
    
    const group = screen.getByRole('group');
    const link = screen.getByTestId('next-link');
    const button = screen.getByTestId('upload-button');
    
    expect(group).toContainElement(link);
    expect(link).toContainElement(button);
  });

  it('button is clickable and accessible', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('upload-button');
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-label', 'upload plugin');
  });

  it('maintains correct styling classes', () => {
    render(<ActionButtons />);
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex');
  });

  it('renders button text correctly', () => {
    render(<ActionButtons />);
    
    expect(screen.getByText('UPLOAD PLUGIN')).toBeInTheDocument();
  });

  describe('Integration with Next.js routing', () => {
    it('provides correct navigation path', () => {
      render(<ActionButtons />);
      
      const link = screen.getByTestId('next-link');
      expect(link).toHaveAttribute('data-href', '/plugins/upload');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for screen readers', () => {
      render(<ActionButtons />);
      
      const group = screen.getByRole('group');
      const button = screen.getByTestId('upload-button');
      
      expect(group).toHaveAttribute('aria-label', 'upload plugin button');
      expect(button).toHaveAttribute('aria-label', 'upload plugin');
    });

    it('uses semantic HTML structure', () => {
      render(<ActionButtons />);
      
      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders consistently on multiple renders', () => {
      const { rerender } = render(<ActionButtons />);
      
      expect(screen.getByText('UPLOAD PLUGIN')).toBeInTheDocument();
      
      rerender(<ActionButtons />);
      
      expect(screen.getByText('UPLOAD PLUGIN')).toBeInTheDocument();
    });
  });
}); 