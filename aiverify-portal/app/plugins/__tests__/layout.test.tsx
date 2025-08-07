import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '../layout';

// Mock the LayoutHeader component
jest.mock('../components/LayoutHeader', () => {
  return function MockLayoutHeader() {
    return <div data-testid="layout-header">Layout Header</div>;
  };
});

// Mock QueryClient to avoid React Query provider issues
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

describe('Layout Component', () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Layout>{mockChildren}</Layout>);
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('renders QueryClientProvider wrapper', () => {
    render(<Layout>{mockChildren}</Layout>);
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('renders LayoutHeader component', () => {
    render(<Layout>{mockChildren}</Layout>);
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<Layout>{mockChildren}</Layout>);
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct CSS classes to main container', () => {
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

  it('maintains proper DOM structure', () => {
    render(<Layout>{mockChildren}</Layout>);
    const provider = screen.getByTestId('query-client-provider');
    const header = screen.getByTestId('layout-header');
    const main = screen.getByRole('main');
    const children = screen.getByTestId('mock-children');

    expect(provider).toContainElement(header);
    expect(provider).toContainElement(main);
    expect(main).toContainElement(children);
  });

  it('renders multiple children correctly', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );

    render(<Layout>{multipleChildren}</Layout>);
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles empty children gracefully', () => {
    render(<Layout>{null}</Layout>);
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
}); 