import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
          </tr>
        ))}
      </tbody>
    </table>
  ) 
}));
jest.mock('../FilterButtons', () => ({ __esModule: true, default: (props: any) => <div data-testid="filters"><button onClick={() => props.onFilter('model')}>MODEL</button><button onClick={() => props.onSearch('test')}>Search</button></div> }));

jest.mock('@/app/models/hooks/useDeleteModel', () => ({ useDeleteModel: () => ({ mutateAsync: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }) }) }));
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: (props: any) => <button data-testid={`icon-${props.name}`} onClick={props.onClick} disabled={props.disabled} />,
  IconName: { Delete: 'Delete' }
}));
jest.mock('@/lib/components/modal', () => ({
  Modal: (props: any) => (
    <div data-testid="modal">
      {props.children}
      {props.primaryBtnLabel && (
        <button onClick={props.onPrimaryBtnClick}>{props.primaryBtnLabel}</button>
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
];

describe('ModelList', () => {
  it('renders model list and filters', () => {
    render(<ModelList models={mockModels} />);
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });

  it('selects a model and shows detail in split pane', () => {
    render(<ModelList models={mockModels} />);
    fireEvent.click(screen.getByText('Model A'));
    expect(screen.getByTestId('split-pane')).toBeInTheDocument();
    expect(screen.getByTestId('model-detail')).toHaveTextContent('Model A');
  });

  it('opens and closes delete modal', () => {
    render(<ModelList models={mockModels} />);
    // First select a row to enable the delete button
    fireEvent.click(screen.getByText('Model A'));
    fireEvent.click(screen.getByTestId('icon-Delete'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
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
    jest.runAllTimers();
    
    // Wait for the success message to appear
    await waitFor(() => {
      expect(screen.getByText(/Models deleted successfully!/)).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
}); 