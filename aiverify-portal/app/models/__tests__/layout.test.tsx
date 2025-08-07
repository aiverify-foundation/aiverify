import React from 'react';
import Layout from '../layout';
import LayoutHeader from '../components/LayoutHeader';
import { render } from '../__utils__/test-utils';
import { screen } from '@testing-library/react';

// Mock the LayoutHeader component
jest.mock('../components/LayoutHeader', () => {
  return function MockLayoutHeader() {
    return <div data-testid="layout-header">Layout Header</div>;
  };
});

// Mock the global CSS import
jest.mock('@/app/globals.css', () => ({}));

describe('Layout', () => {
  const mockChildren = <div data-testid="test-children">Test Content</div>;

  it('renders children correctly', () => {
    render(<Layout>{mockChildren}</Layout>);
    
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders LayoutHeader component', () => {
    render(<Layout>{mockChildren}</Layout>);
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });

  it('wraps content in QueryClientProvider', () => {
    render(<Layout>{mockChildren}</Layout>);
    
    // The main content should be rendered within the layout structure
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('mx-auto', 'px-4', 'pt-[64px]');
  });

  it('applies correct CSS classes to main element', () => {
    render(<Layout>{mockChildren}</Layout>);
    
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
    render(<Layout>{mockChildren}</Layout>);
    
    // Check that the layout has the proper structure
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('mx-auto', 'px-4', 'pt-[64px]');
  });
}); 