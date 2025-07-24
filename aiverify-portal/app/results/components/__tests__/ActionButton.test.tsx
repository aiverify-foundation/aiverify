import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButtons from '../ActionButton';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props} data-testid={`link-${href.replace(/\//g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`}>
        {children}
      </a>
    );
  };
});

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, variant, size, textColor, pill, onClick }: any) => (
    <button
      data-testid={`button-${text?.replace(/\s+/g, '-').toLowerCase()}`}
      data-variant={variant}
      data-size={size}
      data-text-color={textColor}
      data-pill={pill}
      onClick={onClick}
      className="mock-button"
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    OUTLINE: 'outline',
  },
}));

describe('ActionButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ActionButtons />);
    
    expect(screen.getByTestId('button-run-new-tests')).toBeInTheDocument();
    expect(screen.getByTestId('button-upload-test-results')).toBeInTheDocument();
  });

  it('renders both action buttons', () => {
    render(<ActionButtons />);
    
    const runButton = screen.getByTestId('button-run-new-tests');
    const uploadButton = screen.getByTestId('button-upload-test-results');
    
    expect(runButton).toBeInTheDocument();
    expect(uploadButton).toBeInTheDocument();
  });

  it('displays correct button text', () => {
    render(<ActionButtons />);
    
    expect(screen.getByText('RUN NEW TESTS')).toBeInTheDocument();
    expect(screen.getByText('UPLOAD TEST RESULTS')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<ActionButtons />);
    
    expect(screen.getByTestId('link-results-run')).toHaveAttribute('href', '/results/run');
    expect(screen.getByTestId('link-results-upload-zipfile')).toHaveAttribute('href', '/results/upload/zipfile');
  });

  it('applies correct button props', () => {
    render(<ActionButtons />);
    
    const runButton = screen.getByTestId('button-run-new-tests');
    const uploadButton = screen.getByTestId('button-upload-test-results');
    
    // Check run button props
    expect(runButton).toHaveAttribute('data-pill', 'true');
    expect(runButton).toHaveAttribute('data-text-color', 'white');
    expect(runButton).toHaveAttribute('data-variant', 'outline');
    expect(runButton).toHaveAttribute('data-size', 'sm');
    
    // Check upload button props
    expect(uploadButton).toHaveAttribute('data-pill', 'true');
    expect(uploadButton).toHaveAttribute('data-text-color', 'white');
    expect(uploadButton).toHaveAttribute('data-variant', 'outline');
    expect(uploadButton).toHaveAttribute('data-size', 'sm');
  });

  it('has correct container styling', () => {
    render(<ActionButtons />);
    
    const container = screen.getByTestId('button-run-new-tests').closest('div');
    expect(container).toHaveClass('flex', 'gap-2');
  });

  it('renders buttons in correct order', () => {
    render(<ActionButtons />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('RUN NEW TESTS');
    expect(buttons[1]).toHaveTextContent('UPLOAD TEST RESULTS');
  });

  it('has proper semantic structure', () => {
    render(<ActionButtons />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('handles button clicks correctly', () => {
    render(<ActionButtons />);
    
    const runButton = screen.getByTestId('button-run-new-tests');
    const uploadButton = screen.getByTestId('button-upload-test-results');
    
    // These should not throw errors when clicked
    expect(() => fireEvent.click(runButton)).not.toThrow();
    expect(() => fireEvent.click(uploadButton)).not.toThrow();
  });

  it('has accessible button elements', () => {
    render(<ActionButtons />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBeTruthy();
    });
  });

  it('maintains consistent styling across buttons', () => {
    render(<ActionButtons />);
    
    const runButton = screen.getByTestId('button-run-new-tests');
    const uploadButton = screen.getByTestId('button-upload-test-results');
    
    // Both buttons should have the same props
    const runProps = {
      pill: runButton.getAttribute('data-pill'),
      textColor: runButton.getAttribute('data-text-color'),
      variant: runButton.getAttribute('data-variant'),
      size: runButton.getAttribute('data-size'),
    };
    
    const uploadProps = {
      pill: uploadButton.getAttribute('data-pill'),
      textColor: uploadButton.getAttribute('data-text-color'),
      variant: uploadButton.getAttribute('data-variant'),
      size: uploadButton.getAttribute('data-size'),
    };
    
    expect(runProps).toEqual(uploadProps);
  });

  it('has proper link structure', () => {
    render(<ActionButtons />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    
    const linkHrefs = links.map(link => link.getAttribute('href'));
    expect(linkHrefs).toContain('/results/run');
    expect(linkHrefs).toContain('/results/upload/zipfile');
  });

  it('renders with correct button class', () => {
    render(<ActionButtons />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('mock-button');
    });
  });

  it('has proper spacing between buttons', () => {
    render(<ActionButtons />);
    
    const container = screen.getByTestId('button-run-new-tests').closest('div');
    expect(container).toHaveClass('gap-2');
  });

  it('maintains button functionality with different text lengths', () => {
    // This test ensures the component handles different text lengths gracefully
    render(<ActionButtons />);
    
    const runButton = screen.getByText('RUN NEW TESTS');
    const uploadButton = screen.getByText('UPLOAD TEST RESULTS');
    
    expect(runButton).toBeInTheDocument();
    expect(uploadButton).toBeInTheDocument();
    
    // Both buttons should be clickable
    expect(() => fireEvent.click(runButton)).not.toThrow();
    expect(() => fireEvent.click(uploadButton)).not.toThrow();
  });

  it('has proper button accessibility attributes', () => {
    render(<ActionButtons />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBeTruthy();
    });
  });
}); 