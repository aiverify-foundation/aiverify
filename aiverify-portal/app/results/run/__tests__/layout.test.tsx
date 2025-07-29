import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RunTestLayout from '../layout';

// Mock Next.js hooks
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock the components
jest.mock('@/app/results/run/components/LayoutHeader', () => {
  return function MockLayoutHeader({ projectId, onBack }: any) {
    return (
      <div data-testid="layout-header" data-project-id={projectId}>
        <button onClick={onBack} data-testid="back-button">
          Back
        </button>
      </div>
    );
  };
});

jest.mock('../components/QueryProvider', () => ({
  QueryProvider: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="query-provider" className={className}>{children}</div>
  ),
}));

describe('RunTestLayout', () => {
  const mockChildren = <div data-testid="test-children">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('renders without crashing', () => {
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render LayoutHeader when not in project flow', () => {
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.queryByTestId('layout-header')).not.toBeInTheDocument();
  });

  it('renders LayoutHeader when in project flow', () => {
    mockGet
      .mockReturnValueOnce('test-project') // projectId
      .mockReturnValueOnce('test-flow'); // flow
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
    expect(screen.getByTestId('layout-header')).toHaveAttribute('data-project-id', 'test-project');
  });

  it('applies correct styling when in project flow', () => {
    mockGet
      .mockReturnValueOnce('test-project') // projectId
      .mockReturnValueOnce('test-flow'); // flow
    render(
      <RunTestLayout>
        <div data-testid="test-children">Test Content</div>
      </RunTestLayout>
    );
    const mainContainer = screen.getByTestId('test-children').parentElement;
    expect(mainContainer).toHaveClass('mt-16', 'h-full');
  });

  it('applies correct styling when not in project flow', () => {
    mockGet.mockReturnValue(null);
    render(
      <RunTestLayout>
        <div data-testid="test-children">Test Content</div>
      </RunTestLayout>
    );
    const mainContainer = screen.getByTestId('test-children').parentElement;
    expect(mainContainer).toHaveClass('w-full', 'h-full');
    expect(mainContainer).not.toHaveClass('mt-16');
  });

  it('handles back navigation for project flow', () => {
    mockGet
      .mockReturnValueOnce('test-project') // projectId
      .mockReturnValueOnce('test-flow'); // flow
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith('/project/select_data?projectId=test-project&flow=test-flow');
  });

  it('passes correct props to LayoutHeader', () => {
    mockGet
      .mockReturnValueOnce('test-project') // projectId
      .mockReturnValueOnce('test-flow'); // flow
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    const header = screen.getByTestId('layout-header');
    expect(header).toHaveAttribute('data-project-id', 'test-project');
  });

  it('handles missing search parameters gracefully', () => {
    mockGet.mockReturnValue(null);
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.queryByTestId('layout-header')).not.toBeInTheDocument();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('handles partial project flow parameters', () => {
    mockGet
      .mockReturnValueOnce('test-project') // projectId
      .mockReturnValueOnce(null); // flow
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.queryByTestId('layout-header')).not.toBeInTheDocument();
  });

  it('handles complex children content', () => {
    const complexChildren = (
      <div>
        <h1>Complex Title</h1>
        <p>Complex paragraph content</p>
        <button>Click me</button>
      </div>
    );

    render(<RunTestLayout>{complexChildren}</RunTestLayout>);
    
    expect(screen.getByText('Complex Title')).toBeInTheDocument();
    expect(screen.getByText('Complex paragraph content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles multiple children elements', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );

    render(<RunTestLayout>{multipleChildren}</RunTestLayout>);
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('handles empty children without crashing', () => {
    render(<RunTestLayout>{null}</RunTestLayout>);
    
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
  });

  it('handles undefined children without crashing', () => {
    render(<RunTestLayout>{undefined}</RunTestLayout>);
    
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    const container = screen.getByTestId('test-children').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('maintains layout structure with different content types', () => {
    const textContent = 'Simple text content';
    render(<RunTestLayout>{textContent}</RunTestLayout>);
    
    expect(screen.getByText(textContent)).toBeInTheDocument();
  });

  it('handles rapid back button clicks', () => {
    mockGet
      .mockReturnValueOnce('test-project') // projectId
      .mockReturnValueOnce('test-flow'); // flow
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    const backButton = screen.getByTestId('back-button');
    
    // Multiple rapid clicks
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledTimes(3);
  });

  it('handles different project IDs correctly', () => {
    mockGet
      .mockReturnValueOnce('different-project') // projectId
      .mockReturnValueOnce('different-flow'); // flow
    
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    const header = screen.getByTestId('layout-header');
    expect(header).toHaveAttribute('data-project-id', 'different-project');
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith('/project/select_data?projectId=different-project&flow=different-flow');
  });

  it('wraps children in QueryProvider', () => {
    render(<RunTestLayout>{mockChildren}</RunTestLayout>);
    
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('query-provider')).toContainElement(screen.getByTestId('test-children'));
  });
}); 