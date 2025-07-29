import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadLayout from '../layout';

// Mock QueryClient to avoid React Query provider issues
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

describe('Upload Layout Component', () => {
  const mockChildren = <div data-testid="mock-children">Upload Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<UploadLayout>{mockChildren}</UploadLayout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders QueryClientProvider wrapper', () => {
    render(<UploadLayout>{mockChildren}</UploadLayout>);
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<UploadLayout>{mockChildren}</UploadLayout>);
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    expect(screen.getByText('Upload Content')).toBeInTheDocument();
  });

  it('maintains proper DOM structure', () => {
    render(<UploadLayout>{mockChildren}</UploadLayout>);
    const main = screen.getByRole('main');
    const provider = screen.getByTestId('query-client-provider');
    const children = screen.getByTestId('mock-children');

    expect(main).toContainElement(provider);
    expect(provider).toContainElement(children);
  });

  it('renders multiple children correctly', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );

    render(<UploadLayout>{multipleChildren}</UploadLayout>);
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles empty children gracefully', () => {
    render(<UploadLayout>{null}</UploadLayout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  describe('Layout Consistency', () => {
    it('maintains consistent layout structure', () => {
      render(<UploadLayout>{mockChildren}</UploadLayout>);
      
      const main = screen.getByRole('main');
      const provider = screen.getByTestId('query-client-provider');
      
      expect(main).toContainElement(provider);
    });

    it('preserves semantic HTML structure', () => {
      render(<UploadLayout>{mockChildren}</UploadLayout>);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles complex nested children', () => {
      const complexChildren = (
        <div data-testid="complex-parent">
          <div data-testid="nested-child-1">
            <span>Deeply nested content</span>
          </div>
          <div data-testid="nested-child-2">
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
          </div>
        </div>
      );

      render(<UploadLayout>{complexChildren}</UploadLayout>);
      
      expect(screen.getByTestId('complex-parent')).toBeInTheDocument();
      expect(screen.getByTestId('nested-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('nested-child-2')).toBeInTheDocument();
      expect(screen.getByText('Deeply nested content')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
    });

    it('renders consistently on multiple renders', () => {
      const { rerender } = render(<UploadLayout>{mockChildren}</UploadLayout>);
      
      expect(screen.getByTestId('mock-children')).toBeInTheDocument();
      
      rerender(<UploadLayout>{mockChildren}</UploadLayout>);
      
      expect(screen.getByTestId('mock-children')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML elements', () => {
      render(<UploadLayout>{mockChildren}</UploadLayout>);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains proper document structure', () => {
      render(<UploadLayout>{mockChildren}</UploadLayout>);
      
      const main = screen.getByRole('main');
      expect(main.tagName.toLowerCase()).toBe('main');
    });
  });
}); 