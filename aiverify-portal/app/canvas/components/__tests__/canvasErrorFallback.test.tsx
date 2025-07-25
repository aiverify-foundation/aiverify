import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorFallback } from '../canvasErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');

  beforeEach(() => {
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders error message correctly', () => {
    render(<ErrorFallback error={mockError} />);
    
    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<ErrorFallback error={mockError} />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<ErrorFallback error={mockError} />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('rounded', 'bg-red-100', 'p-4', 'text-red-700');
  });

  it('renders error message in pre tag with correct styling', () => {
    render(<ErrorFallback error={mockError} />);
    
    const preElement = screen.getByText('Test error message');
    expect(preElement.tagName).toBe('PRE');
    expect(preElement).toHaveClass('mt-2', 'text-sm');
  });

  it('handles different error messages', () => {
    const customError = new Error('Custom error message with special characters: !@#$%');
    render(<ErrorFallback error={customError} />);
    
    expect(screen.getByText('Custom error message with special characters: !@#$%')).toBeInTheDocument();
  });

  it('handles empty error message', () => {
    const emptyError = new Error('');
    const { container } = render(<ErrorFallback error={emptyError} />);
    
    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
    
    // Check for empty pre element specifically
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.textContent).toBe('');
  });

  it('handles very long error messages', () => {
    const longError = new Error('A'.repeat(1000));
    render(<ErrorFallback error={longError} />);
    
    expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
  });

  it('renders with different error types', () => {
    const typeError = new TypeError('Type error occurred');
    render(<ErrorFallback error={typeError} />);
    
    expect(screen.getByText('Type error occurred')).toBeInTheDocument();
  });

  it('maintains proper DOM structure', () => {
    const { container } = render(<ErrorFallback error={mockError} />);
    
    const alertDiv = container.querySelector('[role="alert"]');
    expect(alertDiv).toBeInTheDocument();
    
    const paragraph = alertDiv?.querySelector('p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph?.textContent).toBe('Something went wrong:');
    
    const preElement = alertDiv?.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.textContent).toBe('Test error message');
  });
}); 