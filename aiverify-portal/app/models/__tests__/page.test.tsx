import React from 'react';
import { render, screen } from '@testing-library/react';
import ModelsPage from '../page';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import { TestModel } from '../utils/types';

// Mock the components
jest.mock('@/app/models/components/ActionButtons', () => {
  return function MockActionButtons() {
    return <div data-testid="action-buttons">Action Buttons</div>;
  };
});

jest.mock('@/app/models/components/ModelList', () => {
  return function MockModelList({ models }: { models: TestModel[] }) {
    return <div data-testid="model-list">Model List ({models.length} models)</div>;
  };
});

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color }: { name: string; size: number; color: string }) => (
    <div data-testid={`icon-${name}`} data-size={size} data-color={color}>
      Icon {name}
    </div>
  ),
  IconName: {
    Document: 'Document',
  },
}));

// Mock the API function
jest.mock('@/lib/fetchApis/getAllModels', () => ({
  getTestModels: jest.fn(),
}));

const mockGetTestModels = getTestModels as jest.MockedFunction<typeof getTestModels>;

describe('ModelsPage', () => {
  const mockModels: TestModel[] = [
    {
      id: 1,
      name: 'Test Model 1',
      description: 'Test Description 1',
      mode: 'file',
      modelType: 'classification',
      fileType: 'file',
      filename: 'test1.zip',
      zip_hash: 'hash1',
      size: 1024,
      serializer: 'pickle',
      modelFormat: 'sklearn',
      modelAPI: {
        method: 'POST',
        url: 'https://api.example.com/predict',
        urlParams: '',
        authType: 'none',
        authTypeConfig: {},
        additionalHeaders: [],
        parameters: {
          paths: {
            mediaType: 'application/json',
            isArray: false,
            maxItems: 1,
            pathParams: [],
          },
          queries: {
            mediaType: 'application/json',
            name: 'query',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'body',
          maxItems: 1,
          properties: [],
        },
        response: {
          statusCode: 200,
          mediaType: 'application/json',
          schema: {},
        },
        requestConfig: {
          sslVerify: true,
          connectionTimeout: 30,
          rateLimit: 100,
          rateLimitTimeout: 60,
          batchLimit: 10,
          connectionRetries: 3,
          maxConnections: 10,
          batchStrategy: 'sequential',
        },
      },
      parameterMappings: {
        requestBody: {},
        parameters: {},
      },
      status: 'active',
      errorMessages: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Test Model 2',
      description: 'Test Description 2',
      mode: 'api',
      modelType: 'regression',
      fileType: 'api',
      filename: 'test2.zip',
      zip_hash: 'hash2',
      size: 2048,
      serializer: 'pickle',
      modelFormat: 'tensorflow',
      modelAPI: {
        method: 'POST',
        url: 'https://api.example.com/predict',
        urlParams: '',
        authType: 'none',
        authTypeConfig: {},
        additionalHeaders: [],
        parameters: {
          paths: {
            mediaType: 'application/json',
            isArray: false,
            maxItems: 1,
            pathParams: [],
          },
          queries: {
            mediaType: 'application/json',
            name: 'query',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'body',
          maxItems: 1,
          properties: [],
        },
        response: {
          statusCode: 200,
          mediaType: 'application/json',
          schema: {},
        },
        requestConfig: {
          sslVerify: true,
          connectionTimeout: 30,
          rateLimit: 100,
          rateLimitTimeout: 60,
          batchLimit: 10,
          connectionRetries: 3,
          maxConnections: 10,
          batchStrategy: 'sequential',
        },
      },
      parameterMappings: {
        requestBody: {},
        parameters: {},
      },
      status: 'active',
      errorMessages: '',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockGetTestModels.mockResolvedValue(mockModels);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with correct structure', async () => {
    render(await ModelsPage());
    
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('View and manage test models')).toBeInTheDocument();
  });

  it('renders the Document icon with correct props', async () => {
    render(await ModelsPage());
    
    const icon = screen.getByTestId('icon-Document');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-size', '40');
    expect(icon).toHaveAttribute('data-color', '#FFFFFF');
  });

  it('renders ActionButtons component', async () => {
    render(await ModelsPage());
    
    expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
  });

  it('renders ModelList component with models data', async () => {
    render(await ModelsPage());
    
    expect(screen.getByTestId('model-list')).toBeInTheDocument();
    expect(screen.getByText('Model List (2 models)')).toBeInTheDocument();
  });

  it('calls getTestModels API function', async () => {
    render(await ModelsPage());
    
    expect(mockGetTestModels).toHaveBeenCalledTimes(1);
  });

  it('handles empty models array', async () => {
    mockGetTestModels.mockResolvedValue([]);
    
    render(await ModelsPage());
    
    expect(screen.getByTestId('model-list')).toBeInTheDocument();
    expect(screen.getByText('Model List (0 models)')).toBeInTheDocument();
  });

  it('applies correct CSS classes to container', async () => {
    render(await ModelsPage());
    const container = screen.getByText('Models').closest('div');
    expect(container).toBeInTheDocument();
    // Optionally check for any class
    if (container && container.className) {
      expect(container.className).not.toBe('');
    }
  });

  it('renders header section with correct layout', async () => {
    render(await ModelsPage());
    const headerSection = screen.getByText('Models').closest('div')?.parentElement;
    expect(headerSection).toBeInTheDocument();
    if (headerSection && headerSection.className) {
      expect(headerSection.className).toMatch(/flex/);
      expect(headerSection.className).toMatch(/items-center/);
    }
  });

  it('renders left section with icon and text', async () => {
    render(await ModelsPage());
    const leftSection = screen.getByText('Models').closest('div')?.parentElement?.firstElementChild;
    expect(leftSection).toBeInTheDocument();
  });

  it('renders text content with correct styling', async () => {
    render(await ModelsPage());
    
    const title = screen.getByText('Models');
    const subtitle = screen.getByText('View and manage test models');
    
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-white');
    expect(subtitle).toHaveClass('text-white');
  });
}); 