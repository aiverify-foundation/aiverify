import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsPage from '../page';

// Mock the API function
jest.mock('@/lib/fetchApis/getTestResults', () => ({
  getTestResults: jest.fn(),
}));

// Mock the components
jest.mock('../components/ActionButton', () => {
  return function MockActionButtons() {
    return <div data-testid="action-buttons">Action Buttons</div>;
  };
});

jest.mock('../components/TestResultsList', () => {
  return function MockTestResultsList({ testResults }: { testResults: any[] }) {
    return (
      <div data-testid="test-results-list">
        Test Results List ({testResults.length} results)
      </div>
    );
  };
});

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

const { getTestResults } = require('@/lib/fetchApis/getTestResults');

describe('ResultsPage', () => {
  const mockTestResults = [
    {
      id: 1,
      name: 'Test Result 1',
      cid: 'test-cid-1',
      gid: 'test-gid-1',
      version: '1.0.0',
      created_at: '2023-01-01T00:00:00Z',
      testArguments: {
        testDataset: '/path/to/dataset1.csv',
        modelType: 'classification',
        modelFile: '/path/to/model1.pkl',
      },
    },
    {
      id: 2,
      name: 'Test Result 2',
      cid: 'test-cid-2',
      gid: 'test-gid-2',
      version: '1.0.0',
      created_at: '2023-01-02T00:00:00Z',
      testArguments: {
        testDataset: '/path/to/dataset2.csv',
        modelType: 'regression',
        modelFile: '/path/to/model2.pkl',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });
  });

  it('displays the page title and subtitle', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.getByText('View and manage test results')).toBeInTheDocument();
    });
  });

  it('renders the lightning icon with correct props', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      const icon = screen.getByTestId('icon-Lightning');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-size', '40');
      expect(icon).toHaveAttribute('data-color', '#FFFFFF');
    });
  });

  it('renders ActionButtons component', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    });
  });

  it('renders TestResultsList with fetched data', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByTestId('test-results-list')).toBeInTheDocument();
      expect(screen.getByText('Test Results List (2 results)')).toBeInTheDocument();
    });
  });

  it('calls getTestResults API function', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(getTestResults).toHaveBeenCalledTimes(1);
    });
  });

  it('handles empty test results', async () => {
    getTestResults.mockResolvedValue([]);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByTestId('test-results-list')).toBeInTheDocument();
      expect(screen.getByText('Test Results List (0 results)')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    getTestResults.mockRejectedValue(new Error('API Error'));
    
    // This should not throw an error and should render the component
    const component = await ResultsPage();
    expect(component).toBeDefined();
    
    // Render the component and expect it to handle the error gracefully
    render(component);
    
    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });
  });

  it('has correct layout structure', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      const container = screen.getByText('Test Results').closest('div')?.parentElement?.parentElement?.parentElement;
      expect(container).toHaveClass('p-6');
    });
  });

  it('displays header section with correct styling', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      const headerSection = screen.getByText('Test Results').closest('div')?.parentElement?.parentElement;
      expect(headerSection).toHaveClass('mb-1', 'flex', 'items-center', 'justify-between');
    });
  });

  it('displays title section with correct styling', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      const titleSection = screen.getByText('Test Results').closest('div')?.parentElement;
      expect(titleSection).toHaveClass('flex', 'items-center');
    });
  });

  it('renders with large test results array', async () => {
    const largeTestResults = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Test Result ${i + 1}`,
      cid: `test-cid-${i + 1}`,
      gid: `test-gid-${i + 1}`,
      version: '1.0.0',
      created_at: '2023-01-01T00:00:00Z',
      testArguments: {
        testDataset: `/path/to/dataset${i + 1}.csv`,
        modelType: 'classification',
        modelFile: `/path/to/model${i + 1}.pkl`,
      },
    }));

    getTestResults.mockResolvedValue(largeTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByText(`Test Results List (${largeTestResults.length} results)`)).toBeInTheDocument();
    });
  });

  it('maintains proper heading hierarchy', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toHaveTextContent('Test Results');
      expect(h3).toHaveTextContent('View and manage test results');
    });
  });

  it('has proper semantic structure', async () => {
    getTestResults.mockResolvedValue(mockTestResults);
    
    render(await ResultsPage());
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Results' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'View and manage test results' })).toBeInTheDocument();
    });
  });
}); 