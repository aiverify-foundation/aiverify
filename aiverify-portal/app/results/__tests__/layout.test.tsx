import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsLayout from '../layout';

// Mock the ResultsHeader component
jest.mock('../components/ResultsHeader', () => {
  return function MockResultsHeader() {
    return <div data-testid="results-header">Results Header</div>;
  };
});

describe('ResultsLayout', () => {
  const mockChildren = <div data-testid="test-children">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    expect(screen.getByTestId('results-header')).toBeInTheDocument();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('renders the ResultsHeader component', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    const header = screen.getByTestId('results-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Results Header');
  });

  it('renders children content in the main element', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toContainElement(screen.getByTestId('test-children'));
  });

  it('applies correct CSS classes to main element', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass(
      'mx-auto',
      'px-4',
      'pt-[64px]',
      'sm:px-6',
      'lg:max-w-[1520px]',
      'lg:px-8',
      'xl:max-w-[1720px]',
      'xl:px-12'
    );
  });

  it('renders complex children content', () => {
    const complexChildren = (
      <div>
        <h1>Complex Title</h1>
        <p>Complex paragraph content</p>
        <button>Click me</button>
      </div>
    );

    render(<ResultsLayout>{complexChildren}</ResultsLayout>);
    
    expect(screen.getByText('Complex Title')).toBeInTheDocument();
    expect(screen.getByText('Complex paragraph content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders multiple children elements', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );

    render(<ResultsLayout>{multipleChildren}</ResultsLayout>);
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('renders empty children without crashing', () => {
    render(<ResultsLayout>{null}</ResultsLayout>);
    
    expect(screen.getByTestId('results-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders with undefined children without crashing', () => {
    render(<ResultsLayout>{undefined}</ResultsLayout>);
    
    expect(screen.getByTestId('results-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    const mainElement = screen.getByRole('main');
    expect(mainElement.tagName).toBe('MAIN');
  });

  it('maintains layout structure with different content types', () => {
    const textContent = 'Simple text content';
    render(<ResultsLayout>{textContent}</ResultsLayout>);
    
    expect(screen.getByText(textContent)).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(screen.getByText(textContent));
  });
}); 