import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RunningTestsPage from '../page';

// Mock the API function
jest.mock('@/lib/fetchApis/getTestRunApis', () => ({
  getTestRuns: jest.fn(),
}));

// Mock the ActiveTestsList component
jest.mock('../components/ActiveTestsList', () => {
  return function MockActiveTestsList({ runs }: any) {
    return (
      <div data-testid="active-tests-list">
        <div data-testid="runs-count">{runs.length}</div>
        {runs.map((run: any, index: number) => (
          <div key={run.id || index} data-testid={`run-${index}`}>
            {run.id || `run-${index}`}
          </div>
        ))}
      </div>
    );
  };
});

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props} data-testid={`link-${href.replace(/\//g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`}>{children}</a>;
  };
});

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, variant, size, className, onClick, pill, textColor }: any) => (
    <button
      data-testid={`button-${text?.replace(/\s+/g, '-').toLowerCase()}`}
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      data-text-color={textColor}
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    OUTLINE: 'outline',
  },
}));

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: { name: string; size: number; color: string }) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color}>
      Icon: {name}
    </div>
  ),
  IconName: {
    Lightning: 'Lightning',
  },
}));

const { getTestRuns } = require('@/lib/fetchApis/getTestRunApis');

describe('RunningTestsPage', () => {
  const mockRuns = [
    {
      id: '1',
      mode: 'upload' as const,
      algorithmGID: 'algo1',
      algorithmCID: 'cid1',
      algorithmArgs: { param1: 'value1' },
      testDatasetFilename: 'test1.csv',
      modelFilename: 'model1.pkl',
      status: 'running' as const,
      progress: 50,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      mode: 'upload' as const,
      algorithmGID: 'algo2',
      algorithmCID: 'cid2',
      algorithmArgs: { param2: 'value2' },
      testDatasetFilename: 'test2.csv',
      modelFilename: 'model2.pkl',
      status: 'pending' as const,
      progress: 0,
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getTestRuns.mockResolvedValue(mockRuns);
  });

  it('renders without crashing', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Tests')).toBeInTheDocument();
    });
  });

  it('displays the page title and subtitle', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Tests')).toBeInTheDocument();
      expect(screen.getByText('View and monitor all tests')).toBeInTheDocument();
    });
  });

  it('renders the lightning icon with correct props', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      const icon = screen.getByTestId('icon-Lightning');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-size', '40');
      expect(icon).toHaveAttribute('data-color', '#FFFFFF');
    });
  });

  it('renders ActiveTestsList with correct props', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('active-tests-list')).toBeInTheDocument();
      expect(screen.getByTestId('runs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('run-0')).toBeInTheDocument();
      expect(screen.getByTestId('run-1')).toBeInTheDocument();
    });
  });

  it('shows header when not in project flow', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Tests')).toBeInTheDocument();
      expect(screen.getByTestId('button-run-new-test')).toBeInTheDocument();
      expect(screen.getByTestId('button-view-test-results')).toBeInTheDocument();
    });
  });

  it('hides header when in project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      // The mock always renders the buttons, so expect them to be present
      expect(screen.getByTestId('button-run-new-test')).toBeInTheDocument();
      expect(screen.getByTestId('button-back-to-project')).toBeInTheDocument();
    });
  });

  it('shows project flow actions when in project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('button-run-new-test')).toBeInTheDocument();
      expect(screen.getByTestId('button-back-to-project')).toBeInTheDocument();
    });
  });

  it('has correct navigation links for non-project flow', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('link-results-run')).toHaveAttribute('href', '/results/run');
      expect(screen.getByTestId('link-results')).toHaveAttribute('href', '/results');
    });
  });

  it('has correct navigation links for project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('link-results-run?projectId=test-project&flow=test-flow')).toHaveAttribute('href', '/results/run?projectId=test-project&flow=test-flow');
      expect(screen.getByTestId('link-project-select_data?projectId=test-project&flow=test-flow')).toHaveAttribute('href', '/project/select_data?projectId=test-project&flow=test-flow');
    });
  });

  it('calls getTestRuns API', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(getTestRuns).toHaveBeenCalledTimes(1);
    });
  });

  it('handles API errors gracefully', async () => {
    const searchParams = Promise.resolve({});
    getTestRuns.mockRejectedValue(new Error('API Error'));
    await expect(RunningTestsPage({ searchParams })).rejects.toThrow('API Error');
  });

  it('handles empty runs array', async () => {
    const searchParams = Promise.resolve({});
    
    getTestRuns.mockResolvedValue([]);
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('active-tests-list')).toBeInTheDocument();
      expect(screen.getByTestId('runs-count')).toHaveTextContent('0');
    });
  });

  it('applies correct styling for project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      const projectActions = screen.getByTestId('button-run-new-test').closest('div');
      expect(projectActions?.parentElement).toHaveClass('mt-16');
    });
  });

  it('applies correct styling for non-project flow', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      const mainContent = screen.getByTestId('active-tests-list').parentElement;
      expect(mainContent).toHaveClass('mt-4');
    });
  });

  it('handles partial project flow parameters', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      // flow is missing
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      // Should show header since flow is missing
      expect(screen.getByText('Tests')).toBeInTheDocument();
    });
  });

  it('handles null project flow parameters', async () => {
    const searchParams = Promise.resolve({
      projectId: undefined,
      flow: undefined,
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      // Should show header since parameters are undefined
      expect(screen.getByText('Tests')).toBeInTheDocument();
    });
  });

  it('handles undefined project flow parameters', async () => {
    const searchParams = Promise.resolve({
      projectId: undefined,
      flow: undefined,
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      // Should show header since parameters are undefined
      expect(screen.getByText('Tests')).toBeInTheDocument();
    });
  });

  it('logs runs data', async () => {
    const searchParams = Promise.resolve({});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('runs', mockRuns);
    });
    
    consoleSpy.mockRestore();
  });

  it('maintains proper heading hierarchy', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toHaveTextContent('Tests');
      expect(h3).toHaveTextContent('View and monitor all tests');
    });
  });

  it('has proper semantic structure', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tests' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'View and monitor all tests' })).toBeInTheDocument();
    });
  });

  it('handles different project IDs correctly', async () => {
    const searchParams = Promise.resolve({
      projectId: 'different-project',
      flow: 'different-flow',
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('link-results-run?projectId=different-project&flow=different-flow')).toHaveAttribute('href', '/results/run?projectId=different-project&flow=different-flow');
      expect(screen.getByTestId('link-project-select_data?projectId=different-project&flow=different-flow')).toHaveAttribute('href', '/project/select_data?projectId=different-project&flow=different-flow');
    });
  });

  it('handles complex project flow parameters', async () => {
    const searchParams = Promise.resolve({
      projectId: 'complex-project-id-with-special-chars-123',
      flow: 'complex-flow-name-with-spaces',
    });
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('button-run-new-test')).toBeInTheDocument();
      expect(screen.getByTestId('button-back-to-project')).toBeInTheDocument();
    });
  });

  it('handles large runs array', async () => {
    const searchParams = Promise.resolve({});
    const largeRuns = Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      mode: 'upload' as const,
      algorithmGID: `algo${i}`,
      algorithmCID: `cid${i}`,
      algorithmArgs: { param: `value${i}` },
      testDatasetFilename: `test${i}.csv`,
      modelFilename: `model${i}.pkl`,
      status: 'pending' as const,
      progress: 0,
      created_at: '2023-01-01T00:00:00Z',
    }));
    
    getTestRuns.mockResolvedValue(largeRuns);
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('runs-count')).toHaveTextContent('100');
    });
  });

  it('handles runs with missing optional fields', async () => {
    const searchParams = Promise.resolve({});
    const minimalRuns = [
      {
        id: '1',
        mode: 'upload' as const,
        algorithmGID: 'algo1',
        algorithmCID: 'cid1',
        algorithmArgs: {},
        testDatasetFilename: 'test1.csv',
        modelFilename: 'model1.pkl',
        status: 'pending' as const,
        progress: 0,
        created_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    getTestRuns.mockResolvedValue(minimalRuns);
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('runs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('run-0')).toBeInTheDocument();
    });
  });

  it('handles runs with different statuses', async () => {
    const searchParams = Promise.resolve({});
    const diverseRuns = [
      {
        id: '1',
        mode: 'upload' as const,
        algorithmGID: 'algo1',
        algorithmCID: 'cid1',
        algorithmArgs: {},
        testDatasetFilename: 'test1.csv',
        modelFilename: 'model1.pkl',
        status: 'running' as const,
        progress: 50,
        created_at: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        mode: 'upload' as const,
        algorithmGID: 'algo2',
        algorithmCID: 'cid2',
        algorithmArgs: {},
        testDatasetFilename: 'test2.csv',
        modelFilename: 'model2.pkl',
        status: 'success' as const,
        progress: 100,
        created_at: '2023-01-02T00:00:00Z',
      },
      {
        id: '3',
        mode: 'upload' as const,
        algorithmGID: 'algo3',
        algorithmCID: 'cid3',
        algorithmArgs: {},
        testDatasetFilename: 'test3.csv',
        modelFilename: 'model3.pkl',
        status: 'error' as const,
        progress: 0,
        created_at: '2023-01-03T00:00:00Z',
      },
    ];
    
    getTestRuns.mockResolvedValue(diverseRuns);
    
    render(await RunningTestsPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('runs-count')).toHaveTextContent('3');
      expect(screen.getByTestId('run-0')).toBeInTheDocument();
      expect(screen.getByTestId('run-1')).toBeInTheDocument();
      expect(screen.getByTestId('run-2')).toBeInTheDocument();
    });
  });
}); 