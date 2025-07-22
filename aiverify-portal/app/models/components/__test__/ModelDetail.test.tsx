import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelDetail from '../ModelDetail';
import { TestModel } from '../../utils/types';

jest.mock('../DropdownMenu', () => (props: any) => (
  <select data-testid="dropdown" value={props.selectedId} onChange={e => props.onSelect?.(e.target.value)}>
    {props.data.map((item: any) => (
      <option key={item.id} value={item.id}>{item.name}</option>
    ))}
  </select>
));

jest.mock('@/app/models/hooks/useDownloadModel', () => ({ useModelData: () => ({ data: null, isLoading: false, error: null }) }));
jest.mock('@/app/models/hooks/useDownloadModelAPI', () => ({ useModelAPIData: () => jest.fn() }));
jest.mock('@/app/models/hooks/useEditModel', () => ({ useEditModel: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: (props: any) => <div data-testid={`icon-${props.name}`} onClick={props.onClick} />,
  IconName: { Pencil: 'Pencil' }
}));
jest.mock('@/lib/components/button', () => ({ Button: (props: any) => <button onClick={props.onClick} disabled={props.disabled}>{props.text}</button>, ButtonVariant: { PRIMARY: 'primary' } }));
jest.mock('@/lib/components/modal', () => ({
  Modal: (props: any) => (
    <div data-testid="modal">
      {props.children}
      {props.primaryBtnLabel && (
        <button data-testid="save-button" onClick={props.onPrimaryBtnClick}>{props.primaryBtnLabel}</button>
      )}
      <button onClick={props.onCloseIconClick}>Close</button>
    </div>
  )
}));

const mockModel: TestModel = {
  id: 1,
  name: 'Test Model',
  description: 'A test model',
  mode: 'file',
  modelType: 'classification',
  fileType: 'file',
  filename: 'model.zip',
  zip_hash: 'abc123',
  size: 1024,
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
};

describe('ModelDetail', () => {
  it('renders model details', () => {
    render(<ModelDetail model={mockModel} />);
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('A test model')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('file')).toBeInTheDocument();
    expect(screen.getByText('1024')).toBeInTheDocument();
    expect(screen.getByText('pickle')).toBeInTheDocument();
    expect(screen.getByText('sklearn')).toBeInTheDocument();
    expect(screen.getByText('classification')).toBeInTheDocument();
  });

  it('opens and closes edit modal', () => {
    render(<ModelDetail model={mockModel} />);
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('handles input changes in modal', () => {
    render(<ModelDetail model={mockModel} />);
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    // Use getByRole to find the textbox for model name
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(nameInput).toHaveValue('New Name');
  });

  it('handles dropdown change in modal', () => {
    render(<ModelDetail model={mockModel} />);
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    const dropdown = screen.getByTestId('dropdown');
    fireEvent.change(dropdown, { target: { value: 'regression' } });
    expect(dropdown).toHaveValue('regression');
  });

  it('shows feedback modal on save error', async () => {
    // Mock mutateAsync to throw
    const useEditModel = require('@/app/models/hooks/useEditModel');
    useEditModel.useEditModel = () => ({ mutateAsync: jest.fn().mockRejectedValue(new Error('Save error')) });
    
    render(<ModelDetail model={mockModel} />);
    fireEvent.click(screen.getByTestId('icon-Pencil'));
    
    // Click the save button
    fireEvent.click(screen.getByTestId('save-button'));
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Save error/)).toBeInTheDocument();
    });
  });
}); 