import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionButtons from '../ActionButtons';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return (
      <a href={href} data-testid="next-link">
        {children}
      </a>
    );
  };
});

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ 
    text, 
    variant, 
    size, 
    textColor, 
    pill 
  }: { 
    text: string; 
    variant: string; 
    size: string; 
    textColor: string; 
    pill: boolean; 
  }) => (
    <button 
      data-testid="action-button"
      data-variant={variant}
      data-size={size}
      data-text-color={textColor}
      data-pill={pill}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    OUTLINE: 'outline',
  },
}));

describe('ActionButtons', () => {
  it('renders the upload button with correct text', () => {
    render(<ActionButtons />);
    
    expect(screen.getByText('UPLOAD MODEL')).toBeInTheDocument();
  });

  it('renders the button with correct props', () => {
    render(<ActionButtons />);
    
    const button = screen.getByTestId('action-button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-text-color', 'white');
    expect(button).toHaveAttribute('data-pill', 'true');
  });

  it('renders the Next.js Link with correct href', () => {
    render(<ActionButtons />);
    
    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('href', '/models/upload');
  });

  it('applies correct CSS classes to container', () => {
    render(<ActionButtons />);
    
    const container = screen.getByTestId('next-link').parentElement;
    expect(container).toHaveClass('flex');
  });

  it('renders button inside the link', () => {
    render(<ActionButtons />);
    
    const link = screen.getByTestId('next-link');
    const button = screen.getByTestId('action-button');
    
    expect(link).toContainElement(button);
  });

  it('has accessible button text', () => {
    render(<ActionButtons />);
    
    expect(screen.getByRole('button')).toHaveTextContent('UPLOAD MODEL');
  });
}); 