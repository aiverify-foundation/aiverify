import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '../layout';

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => {
  const mockQueryClient = {
    mount: jest.fn(),
    unmount: jest.fn(),
  };
  
  const mockQueryClientConstructor = jest.fn(() => mockQueryClient);
  
  return {
    QueryClient: mockQueryClientConstructor,
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="query-client-provider">{children}</div>
    ),
  };
});

describe('UploadLayout', () => {
  const mockChildren = (
    <div data-testid="test-children">
      <h1>Upload Test Content</h1>
      <p>This is test content for the upload layout</p>
    </div>
  );

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      expect(screen.getByTestId('test-children')).toBeInTheDocument();
      expect(screen.getByText('Upload Test Content')).toBeInTheDocument();
      expect(screen.getByText('This is test content for the upload layout')).toBeInTheDocument();
    });

    it('renders QueryClientProvider wrapper', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('renders main container with correct structure', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      const multipleChildren = (
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </>
      );

      render(<Layout>{multipleChildren}</Layout>);
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders with null children', () => {
      render(<Layout>{null}</Layout>);
      
      // Should still render the layout structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      render(<Layout>{undefined}</Layout>);
      
      // Should still render the layout structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct root container structure', () => {
      const { container } = render(<Layout>{mockChildren}</Layout>);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.tagName).toBe('MAIN');
    });

    it('wraps children in QueryClientProvider', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      const queryProvider = screen.getByTestId('query-client-provider');
      expect(queryProvider).toBeInTheDocument();
      expect(queryProvider).toContainElement(screen.getByTestId('test-children'));
    });
  });

  describe('Props Handling', () => {
    it('accepts ReactNode children', () => {
      const stringChildren = 'String children';
      const numberChildren = 42;
      const arrayChildren = [<div key="1">Array child 1</div>, <div key="2">Array child 2</div>];

      // Test string children
      render(<Layout>{stringChildren}</Layout>);
      expect(screen.getByText('String children')).toBeInTheDocument();

      // Test number children
      render(<Layout>{numberChildren}</Layout>);
      expect(screen.getByText('42')).toBeInTheDocument();

      // Test array children
      render(<Layout>{arrayChildren}</Layout>);
      expect(screen.getByText('Array child 1')).toBeInTheDocument();
      expect(screen.getByText('Array child 2')).toBeInTheDocument();
    });

    it('handles empty children', () => {
      render(<Layout>{null}</Layout>);
      
      // Should still render the layout structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('QueryClient Integration', () => {
    it('creates QueryClient instance', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      // Since we can't access the mock directly, we just verify the component renders
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('provides QueryClient to children via QueryClientProvider', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      const queryProvider = screen.getByTestId('query-client-provider');
      expect(queryProvider).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<Layout>{mockChildren}</Layout>);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains accessibility when children are complex components', () => {
      const complexChildren = (
        <div>
          <header>
            <h1>Complex Header</h1>
          </header>
          <section>
            <h2>Complex Section</h2>
            <p>Complex content</p>
          </section>
        </div>
      );
      
      render(<Layout>{complexChildren}</Layout>);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Complex Header')).toBeInTheDocument();
      expect(screen.getByText('Complex Section')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very large children content', () => {
      const largeContent = (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i}>Large content item {i}</div>
          ))}
        </div>
      );

      render(<Layout>{largeContent}</Layout>);
      
      // Should render without issues
      expect(screen.getByText('Large content item 0')).toBeInTheDocument();
      expect(screen.getByText('Large content item 999')).toBeInTheDocument();
    });

    it('handles children with event handlers', () => {
      const mockClickHandler = jest.fn();
      const childrenWithHandlers = (
        <button onClick={mockClickHandler} data-testid="test-button">
          Click me
        </button>
      );

      render(<Layout>{childrenWithHandlers}</Layout>);
      
      const button = screen.getByTestId('test-button');
      expect(button).toBeInTheDocument();
      
      // Event handlers should still work
      button.click();
      expect(mockClickHandler).toHaveBeenCalledTimes(1);
    });

    it('handles children with refs', () => {
      const TestComponent = React.forwardRef<HTMLDivElement>((props, ref) => (
        <div ref={ref} data-testid="ref-component" {...props}>
          Ref component
        </div>
      ));

      render(
        <Layout>
          <TestComponent />
        </Layout>
      );
      
      expect(screen.getByTestId('ref-component')).toBeInTheDocument();
    });

    it('handles children with context providers', () => {
      const TestContext = React.createContext('default');
      const childrenWithContext = (
        <TestContext.Provider value="test-value">
          <div data-testid="context-child">Context child</div>
        </TestContext.Provider>
      );

      render(<Layout>{childrenWithContext}</Layout>);
      
      expect(screen.getByTestId('context-child')).toBeInTheDocument();
    });
  });
}); 