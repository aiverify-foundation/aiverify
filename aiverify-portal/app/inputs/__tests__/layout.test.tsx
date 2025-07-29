import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsLayout from '../layout';

// Mock the LayoutHeader component
jest.mock('../components/LayoutHeader', () => {
  return function MockLayoutHeader() {
    return <div data-testid="layout-header">Layout Header</div>;
  };
});

describe('ResultsLayout', () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>;

  it('renders the layout header', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
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

  it('renders with proper structure', () => {
    render(<ResultsLayout>{mockChildren}</ResultsLayout>);
    
    // Should have a main wrapper div
    const wrapper = screen.getByTestId('mock-children').parentElement?.parentElement;
    expect(wrapper).toBeInTheDocument();
    
    // Should have main element
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('handles different types of children', () => {
    const textChildren = 'Text content';
    render(<ResultsLayout>{textChildren}</ResultsLayout>);
    
    expect(screen.getByText('Text content')).toBeInTheDocument();
  });

  it('handles multiple children', () => {
    const multipleChildren = (
      <>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </>
    );
    
    render(<ResultsLayout>{multipleChildren}</ResultsLayout>);
    
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });

  it('renders without crashing when children is null', () => {
    render(<ResultsLayout>{null}</ResultsLayout>);
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });

  it('renders without crashing when children is undefined', () => {
    render(<ResultsLayout>{undefined}</ResultsLayout>);
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });
}); 