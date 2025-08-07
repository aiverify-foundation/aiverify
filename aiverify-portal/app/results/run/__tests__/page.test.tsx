import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RunTestPage from '../page';

// Mock the API functions
jest.mock('@/lib/fetchApis/getAllModels', () => ({
  getTestModels: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getTestDatasets', () => ({
  getTestDatasets: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getPlugins', () => ({
  getPlugins: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getTestRunApis', () => ({
  checkServerActive: jest.fn(),
}));

// Mock the TestRunForm component
jest.mock('../components/TestRunForm', () => {
  return function MockTestRunForm({ plugins, models, datasets, initialServerActive, preselectedModel, projectId, flow }: any) {
    return (
      <div data-testid="test-run-form">
        <div data-testid="plugins-count">{plugins.length}</div>
        <div data-testid="models-count">{models.length}</div>
        <div data-testid="datasets-count">{datasets.length}</div>
        <div data-testid="server-active">{initialServerActive.toString()}</div>
        <div data-testid="preselected-model">{preselectedModel?.id || 'none'}</div>
        <div data-testid="project-id">{projectId || 'none'}</div>
        <div data-testid="flow">{flow || 'none'}</div>
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

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, variant, size, className, onClick, pill, textColor, icon, iconPosition }: any) => (
    <button
      data-testid={`button-${text?.replace(/\s+/g, '-').toLowerCase()}`}
      data-variant={variant}
      data-size={size}
      data-pill={pill}
      data-text-color={textColor}
      data-icon={icon}
      data-icon-position={iconPosition}
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
    ArrowLeft: 'ArrowLeft',
  },
}));

// Mock the RiFlaskLine icon
jest.mock('@remixicon/react', () => ({
  RiFlaskLine: ({ size, color }: { size: number; color: string }) => (
    <div data-testid="flask-icon" data-size={size} data-color={color}>
      Flask Icon
    </div>
  ),
}));

const { getTestModels } = require('@/lib/fetchApis/getAllModels');
const { getTestDatasets } = require('@/lib/fetchApis/getTestDatasets');
const { getPlugins } = require('@/lib/fetchApis/getPlugins');
const { checkServerActive } = require('@/lib/fetchApis/getTestRunApis');
const { notFound } = require('next/navigation');

describe('RunTestPage', () => {
  const mockModels = [
    { id: 1, name: 'Model 1', version: '1.0.0' },
    { id: 2, name: 'Model 2', version: '1.0.0' },
  ];

  const mockDatasets = [
    { id: 1, name: 'Dataset 1', path: '/path/to/dataset1.csv' },
    { id: 2, name: 'Dataset 2', path: '/path/to/dataset2.csv' },
  ];

  const mockPlugins = [
    {
      id: 1,
      name: 'Plugin 1',
      algorithms: [
        { gid: 'algo1', cid: 'cid1', name: 'Algorithm 1' },
        { gid: 'algo2', cid: 'cid2', name: 'Algorithm 2' },
      ],
    },
    {
      id: 2,
      name: 'Plugin 2',
      algorithms: [
        { gid: 'algo3', cid: 'cid3', name: 'Algorithm 3' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    getTestModels.mockResolvedValue(mockModels);
    getTestDatasets.mockResolvedValue({ data: mockDatasets });
    getPlugins.mockResolvedValue({ data: mockPlugins });
    checkServerActive.mockResolvedValue(true);
  });

  it('renders without crashing', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Run New Test')).toBeInTheDocument();
    });
  });

  it('displays the page title and subtitle', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Run New Test')).toBeInTheDocument();
      expect(screen.getByText('Configure and run a new algorithm test')).toBeInTheDocument();
    });
  });

  it('renders the flask icon with correct props', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      const icon = screen.getByTestId('flask-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-size', '40');
      expect(icon).toHaveAttribute('data-color', '#FFFFFF');
    });
  });

  it('renders TestRunForm with correct props', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('test-run-form')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-count')).toHaveTextContent('2');
      expect(screen.getByTestId('models-count')).toHaveTextContent('2');
      expect(screen.getByTestId('datasets-count')).toHaveTextContent('2');
      expect(screen.getByTestId('server-active')).toHaveTextContent('true');
      expect(screen.getByTestId('preselected-model')).toHaveTextContent('none');
      expect(screen.getByTestId('project-id')).toHaveTextContent('none');
      expect(screen.getByTestId('flow')).toHaveTextContent('none');
    });
  });

  it('shows header when not in project flow', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Run New Test')).toBeInTheDocument();
      expect(screen.getByTestId('button-view-running-tests')).toBeInTheDocument();
    });
  });

  it('hides header when in project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.queryByText('Run New Test')).not.toBeInTheDocument();
      expect(screen.queryByTestId('button-view-running-tests')).not.toBeInTheDocument();
    });
  });

  it('handles preselected model correctly', async () => {
    const searchParams = Promise.resolve({ modelId: '1' });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('preselected-model')).toHaveTextContent('1');
    });
  });

  it('filters plugins for project flow with algorithm parameters', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
      algorithmGid: 'algo1',
      algorithmCid: 'cid1',
    });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('plugins-count')).toHaveTextContent('1');
    });
  });

  it('calls notFound when project flow data is missing', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
      algorithmGid: 'algo1',
      algorithmCid: 'cid1',
    });
    
    // Mock empty plugins to trigger notFound
    getPlugins.mockResolvedValue({ data: [] });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(notFound).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    const searchParams = Promise.resolve({});
    
    getTestModels.mockRejectedValue(new Error('API Error'));
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Error fetching required data. Please try again later.')).toBeInTheDocument();
      expect(screen.getByTestId('button-retry')).toBeInTheDocument();
    });
  });

  it('handles datasets API error', async () => {
    const searchParams = Promise.resolve({});
    
    getTestDatasets.mockResolvedValue({ message: 'Datasets error' });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Datasets error')).toBeInTheDocument();
    });
  });

  it('handles plugins API error', async () => {
    const searchParams = Promise.resolve({});
    
    getPlugins.mockResolvedValue({ message: 'Plugins error' });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByText('Plugins error')).toBeInTheDocument();
    });
  });

  it('filters plugins to only include those with algorithms', async () => {
    const searchParams = Promise.resolve({});
    
    const pluginsWithAlgorithms = [
      { id: 1, name: 'Plugin 1', algorithms: [{ gid: 'algo1', cid: 'cid1' }] },
      { id: 2, name: 'Plugin 2', algorithms: [] }, // Should be filtered out
      { id: 3, name: 'Plugin 3', algorithms: [{ gid: 'algo2', cid: 'cid2' }] },
    ];
    
    getPlugins.mockResolvedValue({ data: pluginsWithAlgorithms });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('plugins-count')).toHaveTextContent('2');
    });
  });

  it('shows correct navigation links for non-project flow', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('link-results')).toHaveAttribute('href', '/results');
      expect(screen.getByTestId('button-back-to-results')).toBeInTheDocument();
    });
  });

  it('shows correct navigation links for project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('link-project-select_data?projectId=test-project&flow=test-flow')).toHaveAttribute('href', '/project/select_data?projectId=test-project&flow=test-flow');
      expect(screen.getByTestId('button-back-to-project')).toBeInTheDocument();
    });
  });

  it('applies correct styling for project flow', async () => {
    const searchParams = Promise.resolve({
      projectId: 'test-project',
      flow: 'test-flow',
    });
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      const mainContent = screen.getByTestId('test-run-form').parentElement;
      expect(mainContent).toHaveClass('rounded-lg', 'bg-secondary-950', 'mt-16');
    });
  });

  it('handles server status correctly', async () => {
    const searchParams = Promise.resolve({});
    
    checkServerActive.mockResolvedValue(false);
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('server-active')).toHaveTextContent('false');
    });
  });

  it('handles missing modelId gracefully', async () => {
    const searchParams = Promise.resolve({ modelId: '999' }); // Non-existent model
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByTestId('preselected-model')).toHaveTextContent('none');
    });
  });

  it('maintains proper heading hierarchy', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toHaveTextContent('Run New Test');
      expect(h3).toHaveTextContent('Configure and run a new algorithm test');
    });
  });

  it('has proper semantic structure', async () => {
    const searchParams = Promise.resolve({});
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Run New Test' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Configure and run a new algorithm test' })).toBeInTheDocument();
    });
  });

  it('handles retry button click', async () => {
    const searchParams = Promise.resolve({});
    
    getTestModels.mockRejectedValue(new Error('API Error'));
    
    render(await RunTestPage({ searchParams }));
    
    await waitFor(() => {
      const retryButton = screen.getByTestId('button-retry');
      expect(retryButton).toBeInTheDocument();
      expect(() => retryButton.click()).not.toThrow();
    });
  });
}); 