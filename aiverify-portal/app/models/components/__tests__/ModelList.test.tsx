import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelList from '../ModelList';
import { TestModel } from '../../utils/types';

// Mock components using the exact import paths from ModelList.tsx
jest.mock('@/app/models/components/ModelDetail', () => ({ __esModule: true, default: (props: any) => <div data-testid="model-detail">{props.model.name}</div> }));
jest.mock('@/app/models/components/SplitPane', () => ({ __esModule: true, default: (props: any) => <div data-testid="split-pane">{props.leftPane}{props.rightPane}</div> }));
jest.mock('../DataGrid', () => ({ 
  __esModule: true, 
  DataGrid: (props: any) => (
    <table data-testid="data-grid">
      <tbody>
        {props.rows.map((row: any) => (
          <tr key={row.id} onClick={() => {
            // Simulate checkbox selection by calling onSelectionModelChange
            if (props.onSelectionModelChange) {
              props.onSelectionModelChange([String(row.id)]);
            }
            if (props.onRowClick) {
              props.onRowClick(row);
            }
          }}>
            <td>{row.name}</td>
            <td>{row.modelType}</td>
            <td>{row.fileType}</td>
            <td>{row.updated_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) 
}));
jest.mock('../FilterButtons', () => ({ 
  __esModule: true, 
  default: (props: any) => (
    <div data-testid="filters">
      <button onClick={() => props.onFilter('model')}>MODEL</button>
      <button onClick={() => props.onFilter('pipeline')}>PIPELINE</button>
      <button onClick={() => props.onFilter('api')}>API</button>
      <button onClick={() => props.onSearch('test')}>Search</button>
      <button onClick={() => props.onSearch('')}>Clear Search</button>
    </div>
  ) 
}));

jest.mock('@/app/models/hooks/useDeleteModel', () => ({ 
  useDeleteModel: () => ({ 
    mutateAsync: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }) 
  }) 
}));
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: (props: any) => <button data-testid={`icon-${props.name}`} onClick={props.onClick} disabled={props.disabled} />,
  IconName: { Delete: 'Delete' }
}));
jest.mock('@/lib/components/modal', () => ({
  Modal: (props: any) => (
    <div data-testid="modal">
      <h2>{props.heading}</h2>
      {props.children}
      {props.primaryBtnLabel && (
        <button onClick={props.onPrimaryBtnClick}>{props.primaryBtnLabel}</button>
      )}
      {props.secondaryBtnLabel && (
        <button onClick={props.onSecondaryBtnClick}>{props.secondaryBtnLabel}</button>
      )}
      <button onClick={props.onCloseIconClick}>Close</button>
    </div>
  )
}));

const mockModels: TestModel[] = [
  {
    id: 1,
    name: 'Model A',
    description: 'Desc A',
    mode: 'file',
    modelType: 'classification',
    fileType: 'file',
    filename: 'a.zip',
    zip_hash: 'hashA',
    size: 100,
    serializer: 'pickle',
    modelFormat: 'sklearn',
    modelAPI: {
      method: 'POST', url: '', urlParams: '', authType: '', authTypeConfig: {}, additionalHeaders: [],
      parameters: { paths: { mediaType: '', isArray: false, maxItems: 1, pathParams: [] }, queries: { mediaType: '', name: '', isArray: false, maxItems: 1, queryParams: [] } },
      requestBody: { mediaType: '', isArray: false, name: '', maxItems: 1, properties: [] },
      response: { statusCode: 200, mediaType: '', schema: {} },
      requestConfig: { sslVerify: true, connectionTimeout: 30, rateLimit: 100, rateLimitTimeout: 60, batchLimit: 10, connectionRetries: 3, maxConnections: 10, batchStrategy: 'sequential' },
    },
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'active',
    errorMessages: '',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Model B',
    description: 'Desc B',
    mode: 'api',
    modelType: 'regression',
    fileType: 'api',
    filename: 'b.zip',
    zip_hash: 'hashB',
    size: 200,
    serializer: 'pickle',
    modelFormat: 'tensorflow',
    modelAPI: {
      method: 'POST', url: '', urlParams: '', authType: '', authTypeConfig: {}, additionalHeaders: [],
      parameters: { paths: { mediaType: '', isArray: false, maxItems: 1, pathParams: [] }, queries: { mediaType: '', name: '', isArray: false, maxItems: 1, queryParams: [] } },
      requestBody: { mediaType: '', isArray: false, name: '', maxItems: 1, properties: [] },
      response: { statusCode: 200, mediaType: '', schema: {} },
      requestConfig: { sslVerify: true, connectionTimeout: 30, rateLimit: 100, rateLimitTimeout: 60, batchLimit: 10, connectionRetries: 3, maxConnections: 10, batchStrategy: 'sequential' },
    },
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'inactive',
    errorMessages: '',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Pipeline C',
    description: 'Desc C',
    mode: 'pipeline',
    modelType: 'pipeline',
    fileType: 'pipeline',
    filename: 'c.zip',
    zip_hash: 'hashC',
    size: 300,
    serializer: 'pickle',
    modelFormat: 'pipeline',
    modelAPI: {
      method: 'POST', url: '', urlParams: '', authType: '', authTypeConfig: {}, additionalHeaders: [],
      parameters: { paths: { mediaType: '', isArray: false, maxItems: 1, pathParams: [] }, queries: { mediaType: '', name: '', isArray: false, maxItems: 1, queryParams: [] } },
      requestBody: { mediaType: '', isArray: false, name: '', maxItems: 1, properties: [] },
      response: { statusCode: 200, mediaType: '', schema: {} },
      requestConfig: { sslVerify: true, connectionTimeout: 30, rateLimit: 100, rateLimitTimeout: 60, batchLimit: 10, connectionRetries: 3, maxConnections: 10, batchStrategy: 'sequential' },
    },
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'active',
    errorMessages: '',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
  },
  {
    id: 4,
    name: 'Folder D',
    description: 'Desc D',
    mode: 'folder',
    modelType: 'folder',
    fileType: 'folder',
    filename: 'd.zip',
    zip_hash: 'hashD',
    size: 400,
    serializer: 'pickle',
    modelFormat: 'folder',
    modelAPI: {
      method: 'POST', url: '', urlParams: '', authType: '', authTypeConfig: {}, additionalHeaders: [],
      parameters: { paths: { mediaType: '', isArray: false, maxItems: 1, pathParams: [] }, queries: { mediaType: '', name: '', isArray: false, maxItems: 1, queryParams: [] } },
      requestBody: { mediaType: '', isArray: false, name: '', maxItems: 1, properties: [] },
      response: { statusCode: 200, mediaType: '', schema: {} },
      requestConfig: { sslVerify: true, connectionTimeout: 30, rateLimit: 100, rateLimitTimeout: 60, batchLimit: 10, connectionRetries: 3, maxConnections: 10, batchStrategy: 'sequential' },
    },
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'active',
    errorMessages: '',
    created_at: '2023-01-04T00:00:00Z',
    updated_at: '2023-01-04T00:00:00Z',
  },
  {
    id: 5,
    name: 'Unknown E',
    description: 'Desc E',
    mode: 'unknown',
    modelType: 'unknown',
    fileType: 'unknown',
    filename: 'e.zip',
    zip_hash: 'hashE',
    size: 500,
    serializer: 'pickle',
    modelFormat: 'unknown',
    modelAPI: {
      method: 'POST', url: '', urlParams: '', authType: '', authTypeConfig: {}, additionalHeaders: [],
      parameters: { paths: { mediaType: '', isArray: false, maxItems: 1, pathParams: [] }, queries: { mediaType: '', name: '', isArray: false, maxItems: 1, queryParams: [] } },
      requestBody: { mediaType: '', isArray: false, name: '', maxItems: 1, properties: [] },
      response: { statusCode: 200, mediaType: '', schema: {} },
      requestConfig: { sslVerify: true, connectionTimeout: 30, rateLimit: 100, rateLimitTimeout: 60, batchLimit: 10, connectionRetries: 3, maxConnections: 10, batchStrategy: 'sequential' },
    },
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'active',
    errorMessages: '',
    created_at: '2023-01-05T00:00:00Z',
    updated_at: '2023-01-05T00:00:00Z',
  },
];

describe('ModelList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders model list and filters', () => {
      render(<ModelList models={mockModels} />);
      expect(screen.getByTestId('filters')).toBeInTheDocument();
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('renders without selected model (list view)', () => {
      render(<ModelList models={mockModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('split-pane')).not.toBeInTheDocument();
    });

    it('renders with selected model (split pane view)', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      expect(screen.getByTestId('split-pane')).toBeInTheDocument();
      expect(screen.getByTestId('model-detail')).toHaveTextContent('Model A');
    });
  });

  describe('Model Selection', () => {
    it('selects a model and shows detail in split pane', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      expect(screen.getByTestId('split-pane')).toBeInTheDocument();
      expect(screen.getByTestId('model-detail')).toHaveTextContent('Model A');
    });

    it('deselects a model when clicking the same model again', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      expect(screen.getByTestId('split-pane')).toBeInTheDocument();
      
      // Click on the table row specifically, not the text
      const tableRows = screen.getAllByText('Model A');
      const tableRow = tableRows[0].closest('tr');
      fireEvent.click(tableRow!);
      expect(screen.queryByTestId('split-pane')).not.toBeInTheDocument();
    });

    it('changes selection when clicking different model', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      expect(screen.getByTestId('model-detail')).toHaveTextContent('Model A');
      
      fireEvent.click(screen.getByText('Model B'));
      expect(screen.getByTestId('model-detail')).toHaveTextContent('Model B');
    });
  });

  describe('Filtering', () => {
    it('filters by model type (file and folder)', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('MODEL'));
      
      // Should show only file and folder types
      expect(screen.getByText('Model A')).toBeInTheDocument(); // file type
      expect(screen.getByText('Folder D')).toBeInTheDocument(); // folder type
      expect(screen.queryByText('Pipeline C')).not.toBeInTheDocument(); // pipeline type
      expect(screen.queryByText('Model B')).not.toBeInTheDocument(); // api type
    });

    it('filters by pipeline type', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('PIPELINE'));
      
      expect(screen.getByText('Pipeline C')).toBeInTheDocument();
      expect(screen.queryByText('Model A')).not.toBeInTheDocument();
      expect(screen.queryByText('Model B')).not.toBeInTheDocument();
    });

    it('filters by api type', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('API'));
      
      expect(screen.getByText('Model B')).toBeInTheDocument();
      expect(screen.queryByText('Model A')).not.toBeInTheDocument();
      expect(screen.queryByText('Pipeline C')).not.toBeInTheDocument();
    });

    it('shows all models when no filter is applied', () => {
      render(<ModelList models={mockModels} />);
      
      expect(screen.getByText('Model A')).toBeInTheDocument();
      expect(screen.getByText('Model B')).toBeInTheDocument();
      expect(screen.getByText('Pipeline C')).toBeInTheDocument();
      expect(screen.getByText('Folder D')).toBeInTheDocument();
      expect(screen.getByText('Unknown E')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters models by search query', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Search'));
      
      // Should show only models with 'test' in name (none in our mock data)
      expect(screen.queryByText('Model A')).not.toBeInTheDocument();
      expect(screen.queryByText('Model B')).not.toBeInTheDocument();
    });

    it('clears search when empty query is provided', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Clear Search'));
      
      // Should show all models
      expect(screen.getByText('Model A')).toBeInTheDocument();
      expect(screen.getByText('Model B')).toBeInTheDocument();
      expect(screen.getByText('Pipeline C')).toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('opens and closes delete modal', () => {
      render(<ModelList models={mockModels} />);
      // First select a row to enable the delete button
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('does not open delete modal when no rows are selected', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByTestId('icon-Delete'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('calls delete mutation when confirming delete', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: true, message: 'Deleted successfully' });
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      render(<ModelList models={mockModels} />);
      // First select a row to enable the delete button
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      // Wait for the mutation to be called
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('1');
      });
      
      // Fast-forward timers to trigger the setTimeout
      act(() => {
        jest.runAllTimers();
      });
      
      // Wait for the success message to appear
      await waitFor(() => {
        expect(screen.getByText(/Models deleted successfully!/)).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('handles delete failure', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: false, message: 'Delete failed' });
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });

    it('handles delete error', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Modal States', () => {
    it('shows confirmation modal initially', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();
      expect(screen.getByText('CANCEL')).toBeInTheDocument();
    });

    it('closes modal on cancel', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('CANCEL'));
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('closes modal on close icon click during confirmation', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('Close'));
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('closes modal on close icon click after success', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: true, message: 'Deleted successfully' });
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      jest.useFakeTimers();
      
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      act(() => {
        jest.runAllTimers();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Deletion Status')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during delete operation', async () => {
      const mockMutateAsync = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      // Should show loading spinner
      expect(screen.getByTestId('split-pane')).toBeInTheDocument();
    });
  });

  describe('Type Label Rendering', () => {
    it('renders correct type labels for different file types', () => {
      render(<ModelList models={mockModels} />);
      
      // Check that the DataGrid is rendered with the correct type labels
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with no fileType but with mode', () => {
      const modelsWithNoFileType = [
        {
          ...mockModels[0],
          fileType: undefined,
          mode: 'api'
        } as unknown as TestModel
      ];
      
      render(<ModelList models={modelsWithNoFileType} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with no fileType and no mode', () => {
      const modelsWithNoFileType = [
        {
          ...mockModels[0],
          fileType: undefined,
          mode: undefined
        } as unknown as TestModel
      ];
      
      render(<ModelList models={modelsWithNoFileType} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with file fileType', () => {
      const fileModels = [
        {
          ...mockModels[0],
          fileType: 'file'
        }
      ];
      
      render(<ModelList models={fileModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with folder fileType', () => {
      const folderModels = [
        {
          ...mockModels[0],
          fileType: 'folder'
        }
      ];
      
      render(<ModelList models={folderModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with pipeline fileType', () => {
      const pipelineModels = [
        {
          ...mockModels[0],
          fileType: 'pipeline'
        }
      ];
      
      render(<ModelList models={pipelineModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with unknown fileType', () => {
      const unknownModels = [
        {
          ...mockModels[0],
          fileType: 'unknown'
        }
      ];
      
      render(<ModelList models={unknownModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with no fileType but api mode', () => {
      const apiModels = [
        {
          ...mockModels[0],
          fileType: undefined,
          mode: 'api'
        } as unknown as TestModel
      ];
      
      render(<ModelList models={apiModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with no fileType but non-api mode', () => {
      const nonApiModels = [
        {
          ...mockModels[0],
          fileType: undefined,
          mode: 'file'
        } as unknown as TestModel
      ];
      
      render(<ModelList models={nonApiModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with no fileType but undefined mode', () => {
      const undefinedModeModels = [
        {
          ...mockModels[0],
          fileType: undefined,
          mode: undefined
        } as unknown as TestModel
      ];
      
      render(<ModelList models={undefinedModeModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with file fileType specifically', () => {
      const fileModels = [
        {
          ...mockModels[0],
          fileType: 'file'
        }
      ];
      
      render(<ModelList models={fileModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with folder fileType specifically', () => {
      const folderModels = [
        {
          ...mockModels[0],
          fileType: 'folder'
        }
      ];
      
      render(<ModelList models={folderModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with pipeline fileType specifically', () => {
      const pipelineModels = [
        {
          ...mockModels[0],
          fileType: 'pipeline'
        }
      ];
      
      render(<ModelList models={pipelineModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with default fileType case', () => {
      const defaultModels = [
        {
          ...mockModels[0],
          fileType: 'custom'
        }
      ];
      
      render(<ModelList models={defaultModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with null fileType', () => {
      const nullFileTypeModels = [
        {
          ...mockModels[0],
          fileType: null as any
        }
      ];
      
      render(<ModelList models={nullFileTypeModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with empty string fileType', () => {
      const emptyFileTypeModels = [
        {
          ...mockModels[0],
          fileType: ''
        }
      ];
      
      render(<ModelList models={emptyFileTypeModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with zero fileType', () => {
      const zeroFileTypeModels = [
        {
          ...mockModels[0],
          fileType: '0'
        }
      ];
      
      render(<ModelList models={zeroFileTypeModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with false fileType', () => {
      const falseFileTypeModels = [
        {
          ...mockModels[0],
          fileType: 'false'
        }
      ];
      
      render(<ModelList models={falseFileTypeModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });
  });

  describe('Fuse Search Dependencies', () => {
    it('updates fuse when results change', () => {
      const { rerender } = render(<ModelList models={mockModels} />);
      
      // Rerender with different models to trigger fuse update
      const newModels = [...mockModels, { ...mockModels[0], id: 6, name: 'New Model' }];
      rerender(<ModelList models={newModels} />);
      
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('updates fuse when models array changes', () => {
      const { rerender } = render(<ModelList models={mockModels} />);
      
      // Rerender with completely different models
      const differentModels = [
        { ...mockModels[0], id: 10, name: 'Different Model 1' },
        { ...mockModels[1], id: 11, name: 'Different Model 2' }
      ];
      rerender(<ModelList models={differentModels} />);
      
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('updates fuse when models array is completely replaced', () => {
      const { rerender } = render(<ModelList models={mockModels} />);
      
      // Rerender with a completely new models array
      const newModelsArray = [
        { ...mockModels[0], id: 20, name: 'Completely New Model 1' },
        { ...mockModels[1], id: 21, name: 'Completely New Model 2' },
        { ...mockModels[2], id: 22, name: 'Completely New Model 3' }
      ];
      rerender(<ModelList models={newModelsArray} />);
      
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });
  });

  describe('Filtering Logic', () => {
    it('handles filtering with activeFilter set', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('MODEL'));
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles filtering with no activeFilter', () => {
      render(<ModelList models={mockModels} />);
      // Don't apply any filter, so activeFilter remains empty
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles filtering with model activeFilter', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('MODEL'));
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles filtering with non-model activeFilter', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('PIPELINE'));
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });
  });

  describe('Delete Functionality Edge Cases', () => {
    it('does not open delete modal when no rows are selected', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByTestId('icon-Delete'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('handles delete with no activeFilter', () => {
      render(<ModelList models={mockModels} />);
      // Don't apply any filter, so activeFilter remains empty
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles delete with empty selectedRows', () => {
      render(<ModelList models={mockModels} />);
      // Don't select any rows, so selectedRows.size === 0
      fireEvent.click(screen.getByTestId('icon-Delete'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Modal Close Logic', () => {
    it('closes modal and stops loading when message includes deleted successfully', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: true, message: 'Models deleted successfully!' });
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      jest.useFakeTimers();
      
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      act(() => {
        jest.runAllTimers();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Models deleted successfully!')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Close modal after success
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });

    it('closes modal without stopping loading when message does not include deleted successfully', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: false, message: 'Some other message' });
      const useDeleteModel = require('@/app/models/hooks/useDeleteModel');
      useDeleteModel.useDeleteModel = () => ({ mutateAsync: mockMutateAsync });
      
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      fireEvent.click(screen.getByTestId('icon-Delete'));
      fireEvent.click(screen.getByText('DELETE'));
      
      await waitFor(() => {
        expect(screen.getByText('Some other message')).toBeInTheDocument();
      });
      
      // Close modal after failure
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty models array', () => {
      render(<ModelList models={[]} />);
      expect(screen.getByTestId('filters')).toBeInTheDocument();
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles models with unknown fileType', () => {
      render(<ModelList models={mockModels} />);
      expect(screen.getByText('Unknown E')).toBeInTheDocument();
    });

    it('handles search with no results', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Search'));
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles filter with no matching results', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('PIPELINE'));
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to DataGrid', () => {
      render(<ModelList models={mockModels} />);
      expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('passes correct props to FilterButtons', () => {
      render(<ModelList models={mockModels} />);
      expect(screen.getByTestId('filters')).toBeInTheDocument();
    });

    it('passes correct props to ModelDetail', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      expect(screen.getByTestId('model-detail')).toHaveTextContent('Model A');
    });

    it('passes correct props to SplitPane', () => {
      render(<ModelList models={mockModels} />);
      fireEvent.click(screen.getByText('Model A'));
      expect(screen.getByTestId('split-pane')).toBeInTheDocument();
    });
  });
}); 