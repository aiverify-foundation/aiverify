import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from '../DataGrid';
import { TestModel, Column } from '../../utils/types';

const mockModelAPI = {
  method: 'POST',
  url: 'https://api.example.com/predict',
  urlParams: '',
  authType: 'none',
  authTypeConfig: {},
  additionalHeaders: [],
  parameters: {
    paths: { mediaType: 'application/json', isArray: false, maxItems: 1, pathParams: [] },
    queries: { mediaType: 'application/json', name: 'query', isArray: false, maxItems: 1, queryParams: [] },
  },
  requestBody: { mediaType: 'application/json', isArray: false, name: 'body', maxItems: 1, properties: [] },
  response: { statusCode: 200, mediaType: 'application/json', schema: {} },
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
};

const mockRows: TestModel[] = [
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
    modelAPI: mockModelAPI,
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
    modelAPI: mockModelAPI,
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'inactive',
    errorMessages: '',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

const mockColumns: Column<TestModel>[] = [
  { field: 'name', headerName: 'Name', sortable: true, filterable: true },
  { field: 'modelType', headerName: 'Model Type', sortable: true },
  { field: 'fileType', headerName: 'Type' },
];

describe('DataGrid', () => {
  it('renders table with rows and columns', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    const cells = screen.getAllByRole('cell');
    expect(cells.some(cell => cell.textContent === 'Model A')).toBe(true);
    expect(cells.some(cell => cell.textContent === 'Model B')).toBe(true);
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = jest.fn();
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
        onRowClick={onRowClick}
      />
    );
    const cells = screen.getAllByRole('cell');
    const modelACell = cells.find(cell => cell.textContent === 'Model A');
    fireEvent.click(modelACell!);
    expect(onRowClick).toHaveBeenCalledWith(mockRows[0]);
  });

  it('supports checkbox selection and calls onSelectionModelChange', () => {
    const onSelectionModelChange = jest.fn();
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
        checkboxSelection
        onSelectionModelChange={onSelectionModelChange}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(onSelectionModelChange).toHaveBeenCalled();
  });

  it('supports sorting by column', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    // Click header to sort
    fireEvent.click(screen.getByText('Name'));
    // Should show sort indicator
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↑');
  });

  it('supports filtering by column', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Model A' } });
    const cells = screen.getAllByRole('cell');
    expect(cells.some(cell => cell.textContent === 'Model A')).toBe(true);
    expect(cells.some(cell => cell.textContent === 'Model B')).toBe(false);
  });

  it('supports pagination and page size change', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[1, 'All']}
      />
    );
    // Should only show one row initially
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + 1 row
    // Change page size to All
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: 'All' } });
    expect(screen.getAllByRole('row').length).toBeGreaterThan(2);
  });
}); 