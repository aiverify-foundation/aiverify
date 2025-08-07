import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Create mock QueryClient before any imports
const mockQueryClient = jest.fn().mockImplementation(() => ({
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
}));

// Mock React Query module
jest.mock('@tanstack/react-query', () => ({
  QueryClient: mockQueryClient,
  QueryClientProvider: ({ children }: any) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

// Mock global CSS import
jest.mock('@/app/globals.css', () => ({}));

describe('Upload Layout', () => {
  // Import Layout inside describe block after mocks are set up
  let Layout: any;
  
  beforeAll(async () => {
    // Dynamic import after mocks are established
    Layout = (await import('../layout')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockChildren = <div data-testid="child-content">Child Content</div>;

  it('should render the layout with children', () => {
    render(<Layout>{mockChildren}</Layout>);

    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should render children inside main element', () => {
    render(<Layout>{mockChildren}</Layout>);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('child-content'));
  });

  it('should wrap content in QueryClientProvider', () => {
    render(<Layout>{mockChildren}</Layout>);

    const provider = screen.getByTestId('query-client-provider');
    expect(provider).toBeInTheDocument();
    expect(provider).toContainElement(screen.getByTestId('child-content'));
  });

  it('should handle multiple children', () => {
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

  it('should handle empty children', () => {
    render(<Layout>{null}</Layout>);

    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should handle string children', () => {
    render(<Layout>String content</Layout>);

    expect(screen.getByRole('main')).toHaveTextContent('String content');
  });

  describe('Structure', () => {
    it('should have proper outer div container', () => {
      const { container } = render(<Layout>{mockChildren}</Layout>);

      expect(container.firstChild).toHaveProperty('tagName', 'DIV');
    });

    it('should have main element inside provider', () => {
      render(<Layout>{mockChildren}</Layout>);

      const provider = screen.getByTestId('query-client-provider');
      const main = screen.getByRole('main');
      
      expect(provider).toContainElement(main);
    });
  });

  describe('Accessibility', () => {
    it('should have proper main landmark', () => {
      render(<Layout>{mockChildren}</Layout>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should maintain proper heading hierarchy', () => {
      const contentWithHeading = <h1>Upload Page Title</h1>;
      render(<Layout>{contentWithHeading}</Layout>);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('React Query integration', () => {
    it('should create and provide QueryClient', () => {
      render(<Layout>{mockChildren}</Layout>);

      // Test behavior instead of implementation - verify QueryClientProvider is working
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      
      // Verify the provider contains the main content
      const provider = screen.getByTestId('query-client-provider');
      const main = screen.getByRole('main');
      expect(provider).toContainElement(main);
    });
  });

  describe('CSS imports', () => {
    it('should import global CSS', () => {
      // This test ensures the CSS import doesn't break the component
      expect(() => {
        render(<Layout>{mockChildren}</Layout>);
      }).not.toThrow();
    });
  });

  describe('Component types', () => {
    it('should accept ReactNode children', () => {
      const variousChildren = [
        <div key="1">Div child</div>,
        'String child',
        123,
        null,
        undefined,
      ];

      expect(() => {
        variousChildren.forEach((child, index) => {
          render(<Layout key={index}>{child}</Layout>);
        });
      }).not.toThrow();
    });
  });

  describe('Error boundaries', () => {
    it('should handle children that throw errors gracefully', () => {
      function ErrorComponent(): React.ReactElement {
        throw new Error('Test error');
      }

      // Mock console.error to prevent test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <Layout>
            <ErrorComponent />
          </Layout>
        );
      }).toThrow('Test error');

      consoleSpy.mockRestore();
    });
  });
}); 