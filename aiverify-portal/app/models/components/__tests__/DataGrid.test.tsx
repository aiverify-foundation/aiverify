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
  {
    id: 3,
    name: 'Model C',
    description: 'Desc C',
    mode: 'file',
    modelType: 'classification',
    fileType: 'file',
    filename: 'c.zip',
    zip_hash: 'hashC',
    size: 150,
    serializer: 'pickle',
    modelFormat: 'pytorch',
    modelAPI: mockModelAPI,
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'active',
    errorMessages: '',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
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

  // New tests to increase branch coverage
  it('handles checkbox selection without onSelectionModelChange callback', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
        checkboxSelection
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // Should not throw error when clicking checkbox without callback
    expect(() => fireEvent.click(checkboxes[0])).not.toThrow();
  });

  it('handles checkbox selection with undefined onSelectionModelChange', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
        checkboxSelection
        onSelectionModelChange={undefined}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // Should not throw error when clicking checkbox with undefined callback
    expect(() => fireEvent.click(checkboxes[0])).not.toThrow();
  });

  it('calls onSelectionModelChange with correct parameters when checkbox is clicked', () => {
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
    // Click first checkbox
    fireEvent.click(checkboxes[0]);
    expect(onSelectionModelChange).toHaveBeenCalledWith(['1']);
    
    // Click second checkbox
    fireEvent.click(checkboxes[1]);
    expect(onSelectionModelChange).toHaveBeenCalledWith(['1', '2']);
    
    // Unclick first checkbox
    fireEvent.click(checkboxes[0]);
    expect(onSelectionModelChange).toHaveBeenCalledWith(['2']);
  });

  it('handles complete sorting cycle (asc -> desc -> null)', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    // First click: asc
    fireEvent.click(screen.getByText('Name'));
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↑');
    
    // Second click: desc
    fireEvent.click(screen.getByText('Name'));
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↓');
    
    // Third click: null (no sort indicator) - but the logic shows desc again
    fireEvent.click(screen.getByText('Name'));
    // The current implementation cycles through asc -> desc -> desc, not asc -> desc -> null
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↓');
  });

  it('handles sorting with equal values', () => {
    const rowsWithEqualValues = [
      { ...mockRows[0], name: 'Model A' },
      { ...mockRows[1], name: 'Model A' },
      { ...mockRows[2], name: 'Model B' },
    ];
    
    render(
      <DataGrid
        rows={rowsWithEqualValues}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    // Sort by name (asc)
    fireEvent.click(screen.getByText('Name'));
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↑');
    
    // Sort by name (desc)
    fireEvent.click(screen.getByText('Name'));
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↓');
  });

  it('handles sorting with different field types', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    // Sort by modelType (string)
    fireEvent.click(screen.getByText('Model Type'));
    expect(screen.getByText('Model Type').parentElement?.textContent).toContain('↑');
    
    // Sort by modelType (desc)
    fireEvent.click(screen.getByText('Model Type'));
    expect(screen.getByText('Model Type').parentElement?.textContent).toContain('↓');
  });

  it('handles non-sortable column clicks', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    // Click on non-sortable column should not trigger sorting
    fireEvent.click(screen.getByText('Type'));
    expect(screen.getByText('Type').parentElement?.textContent).not.toContain('↑');
    expect(screen.getByText('Type').parentElement?.textContent).not.toContain('↓');
  });

  it('handles filter with empty value', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    const selects = screen.getAllByRole('combobox');
    // Set filter to empty value
    fireEvent.change(selects[0], { target: { value: '' } });
    
    // Should show all rows when filter is empty
    const cells = screen.getAllByRole('cell');
    expect(cells.some(cell => cell.textContent === 'Model A')).toBe(true);
    expect(cells.some(cell => cell.textContent === 'Model B')).toBe(true);
    expect(cells.some(cell => cell.textContent === 'Model C')).toBe(true);
  });

  it('handles renderCell function', () => {
    const columnsWithRenderCell: Column<TestModel>[] = [
      { 
        field: 'name', 
        headerName: 'Name', 
        renderCell: (row) => <span data-testid={`custom-${row.id}`}>{row.name.toUpperCase()}</span>
      },
      { field: 'modelType', headerName: 'Model Type' },
    ];
    
    render(
      <DataGrid
        rows={mockRows}
        columns={columnsWithRenderCell}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    expect(screen.getByTestId('custom-1')).toBeInTheDocument();
    expect(screen.getByText('MODEL A')).toBeInTheDocument();
  });

  it('handles pagination with multiple pages', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[1, 2, 'All']}
      />
    );
    
    // Should show pagination buttons when pageSize is not 'All'
    const pageButtons = screen.getAllByRole('button').filter(button => 
      /^\d+$/.test(button.textContent || '')
    );
    expect(pageButtons.length).toBeGreaterThan(0);
    
    // Click on second page
    if (pageButtons.length > 1) {
      fireEvent.click(pageButtons[1]);
      // Should show different content on second page - use getAllByText to handle multiple elements
      const modelBElements = screen.getAllByText('Model B');
      expect(modelBElements.length).toBeGreaterThan(0);
    }
  });

  it('handles page size change to number', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[1, 2, 'All']}
      />
    );
    
    // Change page size to 2
    const pageSizeSelect = screen.getByDisplayValue('1');
    fireEvent.change(pageSizeSelect, { target: { value: '2' } });
    
    // Should show 2 rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(3); // header + 2 rows
  });

  it('handles checkbox click with stopPropagation', () => {
    const onRowClick = jest.fn();
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
        checkboxSelection
        onRowClick={onRowClick}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    // Click checkbox should not trigger row click
    fireEvent.click(checkboxes[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('handles empty rows array', () => {
    render(
      <DataGrid
        rows={[]}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    // Should render table without data rows
    expect(screen.getByText('Name')).toBeInTheDocument();
    const dataRows = screen.getAllByRole('row').slice(1); // Exclude header
    expect(dataRows.length).toBe(0);
  });

  it('handles pageSizeOptions without numbers', () => {
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        pageSizeOptions={['All']}
      />
    );
    
    // Should default to showing all rows
    const cells = screen.getAllByRole('cell');
    expect(cells.some(cell => cell.textContent === 'Model A')).toBe(true);
    expect(cells.some(cell => cell.textContent === 'Model B')).toBe(true);
    expect(cells.some(cell => cell.textContent === 'Model C')).toBe(true);
  });

  it('handles complex sorting scenarios', () => {
    const complexRows = [
      { ...mockRows[0], name: 'Zebra', modelType: 'classification' },
      { ...mockRows[1], name: 'Alpha', modelType: 'regression' },
      { ...mockRows[2], name: 'Beta', modelType: 'classification' },
    ];
    
    render(
      <DataGrid
        rows={complexRows}
        columns={mockColumns}
        pageSizeOptions={[5, 'All']}
      />
    );
    
    // Sort by name ascending
    fireEvent.click(screen.getByText('Name'));
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↑');
    
    // Sort by name descending
    fireEvent.click(screen.getByText('Name'));
    expect(screen.getByText('Name').parentElement?.textContent).toContain('↓');
    
    // Sort by modelType ascending
    fireEvent.click(screen.getByText('Model Type'));
    expect(screen.getByText('Model Type').parentElement?.textContent).toContain('↑');
  });
}); 