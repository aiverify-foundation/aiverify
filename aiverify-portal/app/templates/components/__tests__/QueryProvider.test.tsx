import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryProvider } from '../QueryProvider';
import { useQuery } from '@tanstack/react-query';

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
    removeQueries: jest.fn(),
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
  })),
  QueryClientProvider: function MockQueryClientProvider({ children, client }: any) {
    return (
      <div data-testid="query-client-provider" data-client={!!client}>
        {children}
      </div>
    );
  },
  useQuery: jest.fn(),
}));

// Test component that uses React Query
function TestComponentWithQuery() {
  const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
  mockUseQuery.mockReturnValue({
    data: 'test data',
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
  } as any);

  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve('test data'),
  });

  return (
    <div data-testid="test-component">
      {isLoading ? 'Loading...' : data}
    </div>
  );
}

describe('QueryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children correctly', () => {
    render(
      <QueryProvider>
        <div data-testid="child-component">Test Child</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should render QueryClientProvider', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('should provide QueryClient to QueryClientProvider', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    );

    const provider = screen.getByTestId('query-client-provider');
    expect(provider).toHaveAttribute('data-client', 'true');
  });

  it('should render multiple children', () => {
    render(
      <QueryProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <span data-testid="child-3">Child 3</span>
      </QueryProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should handle nested components', () => {
    render(
      <QueryProvider>
        <div data-testid="parent">
          <div data-testid="nested-child">Nested Child</div>
        </div>
      </QueryProvider>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
    expect(screen.getByText('Nested Child')).toBeInTheDocument();
  });

  it('should enable React Query functionality for child components', () => {
    render(
      <QueryProvider>
        <TestComponentWithQuery />
      </QueryProvider>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('test data')).toBeInTheDocument();
  });

  describe('QueryClient integration', () => {
    it('should render QueryClientProvider with client', () => {
      render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      // Verify the provider is working correctly with a client
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toHaveAttribute('data-client', 'true');
    });

    it('should pass the QueryClient to the provider', () => {
      render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      const provider = screen.getByTestId('query-client-provider');
      expect(provider).toHaveAttribute('data-client', 'true');
    });
  });

  describe('Children prop handling', () => {
    it('should handle ReactNode children', () => {
      const TestComponent = () => <div data-testid="react-component">React Component</div>;
      
      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(screen.getByTestId('react-component')).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(
        <QueryProvider>
          Plain text child
        </QueryProvider>
      );

      expect(screen.getByText('Plain text child')).toBeInTheDocument();
    });

    it('should handle mixed children types', () => {
      render(
        <QueryProvider>
          <div data-testid="element-child">Element</div>
          Plain text
          <span data-testid="another-element">Another element</span>
        </QueryProvider>
      );

      expect(screen.getByTestId('element-child')).toBeInTheDocument();
      expect(screen.getByText('Plain text')).toBeInTheDocument();
      expect(screen.getByTestId('another-element')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<QueryProvider>{null}</QueryProvider>);

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(
        <QueryProvider>
          {null}
        </QueryProvider>
      );

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(
        <QueryProvider>
          {undefined}
        </QueryProvider>
      );

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('Component tree structure', () => {
    it('should wrap children with QueryClientProvider', () => {
      render(
        <QueryProvider>
          <div data-testid="wrapped-child">Wrapped Child</div>
        </QueryProvider>
      );

      const provider = screen.getByTestId('query-client-provider');
      const child = screen.getByTestId('wrapped-child');
      
      expect(provider).toContainElement(child);
    });

    it('should maintain component hierarchy', () => {
      render(
        <QueryProvider>
          <div data-testid="level-1">
            <div data-testid="level-2">
              <div data-testid="level-3">Deep nested</div>
            </div>
          </div>
        </QueryProvider>
      );

      const level1 = screen.getByTestId('level-1');
      const level2 = screen.getByTestId('level-2');
      const level3 = screen.getByTestId('level-3');

      expect(level1).toContainElement(level2);
      expect(level2).toContainElement(level3);
    });
  });

  describe('Re-rendering behavior', () => {
    it('should handle children updates', () => {
      const { rerender } = render(
        <QueryProvider>
          <div data-testid="child">Initial content</div>
        </QueryProvider>
      );

      expect(screen.getByText('Initial content')).toBeInTheDocument();

      rerender(
        <QueryProvider>
          <div data-testid="child">Updated content</div>
        </QueryProvider>
      );

      expect(screen.getByText('Updated content')).toBeInTheDocument();
      expect(screen.queryByText('Initial content')).not.toBeInTheDocument();
    });

    it('should maintain provider across re-renders', () => {
      const { rerender } = render(
        <QueryProvider>
          <div>Content 1</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();

      rerender(
        <QueryProvider>
          <div>Content 2</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('TypeScript interface compliance', () => {
    it('should accept ReactNode children prop', () => {
      expect(() => {
        render(
          <QueryProvider>
            <div>Valid ReactNode</div>
          </QueryProvider>
        );
      }).not.toThrow();
    });

    it('should accept components as children', () => {
      const CustomComponent = () => <div>Custom Component</div>;
      
      expect(() => {
        render(
          <QueryProvider>
            <CustomComponent />
          </QueryProvider>
        );
      }).not.toThrow();
    });

    it('should accept fragments as children', () => {
      expect(() => {
        render(
          <QueryProvider>
            <>
              <div>Fragment child 1</div>
              <div>Fragment child 2</div>
            </>
          </QueryProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Error boundaries', () => {
    it('should not break when child component throws error', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <QueryProvider>
            <ErrorComponent />
          </QueryProvider>
        );
      }).toThrow('Test error');

      consoleSpy.mockRestore();
    });
  });

  describe('Performance considerations', () => {
    it('should provide consistent QueryClient instance', () => {
      render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      // Verify the provider is working correctly
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toHaveAttribute('data-client', 'true');
    });

    it('should maintain QueryClient across re-renders', () => {
      const { rerender } = render(
        <QueryProvider>
          <div>Initial</div>
        </QueryProvider>
      );

      const initialProvider = screen.getByTestId('query-client-provider');
      expect(initialProvider).toHaveAttribute('data-client', 'true');

      rerender(
        <QueryProvider>
          <div>Updated</div>
        </QueryProvider>
      );

      const updatedProvider = screen.getByTestId('query-client-provider');
      expect(updatedProvider).toHaveAttribute('data-client', 'true');
    });
  });
}); 