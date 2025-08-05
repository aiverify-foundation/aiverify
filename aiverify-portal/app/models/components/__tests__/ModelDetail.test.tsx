import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelDetail from '../ModelDetail';

// Mock the hooks
const mockUseModelData = jest.fn();
const mockUseModelAPIData = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock('@/app/models/hooks/useDownloadModel', () => ({
  useModelData: () => mockUseModelData(),
}));

jest.mock('@/app/models/hooks/useDownloadModelAPI', () => ({
  useModelAPIData: () => mockUseModelAPIData(),
}));

jest.mock('@/app/models/hooks/useEditModel', () => ({
  useEditModel: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

// Mock the components that ModelDetail imports
jest.mock('@/app/models/components/DropdownMenu', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    const { pill, textColor, selectedId, style, ...domProps } = props;
    return <div data-testid="dropdown" {...domProps}>{children}</div>;
  },
}));

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ children, ...props }: any) => {
    const { name, size, color, onClick, ...domProps } = props;
    return <div data-testid="icon" data-name={name} data-size={size} data-color={color} onClick={onClick} {...domProps}>{children}</div>;
  },
  IconName: {
    Pencil: 'pencil',
  },
}));

jest.mock('@/lib/components/button', () => ({
  Button: ({ children, text, ...props }: any) => {
    const { pill, textColor, variant, size, className, disabled, onClick, ...domProps } = props;
    return <button data-testid="button" data-variant={variant} data-size={size} data-pill={pill} className={className} disabled={disabled} onClick={onClick} {...domProps}>{text || children}</button>;
  },
  ButtonVariant: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
  },
}));

jest.mock('@/lib/components/modal', () => ({
  Modal: ({ children, ...props }: any) => {
    const { heading, onPrimaryBtnClick, onSecondaryBtnClick, onCloseIconClick, style, enableScreenOverlay, primaryBtnLabel, secondaryBtnLabel, ...domProps } = props;
    return (
      <div data-testid="modal" data-heading={heading} {...domProps}>
        <div data-testid="modal-content">{children}</div>
        <button data-testid="modal-primary" onClick={onPrimaryBtnClick}>{primaryBtnLabel || 'Primary'}</button>
        <button data-testid="modal-secondary" onClick={onSecondaryBtnClick}>{secondaryBtnLabel || 'Secondary'}</button>
        <button data-testid="modal-close" onClick={onCloseIconClick}>Close</button>
      </div>
    );
  },
}));

describe('ModelDetail Simple Tests', () => {
  const mockModel = {
    id: 1,
    name: 'Test Model',
    description: 'Test Description',
    status: 'active',
    fileType: 'pickle',
    mode: 'file',
    filename: 'test.pkl',
    updated_at: '2023-01-01T00:00:00',
    created_at: '2023-01-01T00:00:00',
    size: 1000,
    serializer: 'pickle',
    modelFormat: 'sklearn',
    modelType: 'classification',
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
          pathParams: []
        },
        queries: {
          mediaType: 'application/json',
          name: '',
          isArray: false,
          maxItems: 1,
          queryParams: []
        }
      },
      requestBody: {
        mediaType: 'application/json',
        isArray: false,
        name: '',
        maxItems: 1,
        properties: []
      },
      response: {
        statusCode: 200,
        mediaType: 'application/json',
        schema: {}
      },
      requestConfig: {
        sslVerify: true,
        connectionTimeout: 30,
        rateLimit: 100,
        rateLimitTimeout: 60,
        batchLimit: 10,
        connectionRetries: 3,
        maxConnections: 10,
        batchStrategy: 'sequential'
      }
    },
    zip_hash: 'test-hash',
    parameterMappings: { requestBody: {}, parameters: {} },
    errorMessages: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseModelData.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    mockUseModelAPIData.mockReturnValue({
      data: null,
    });
    mockMutateAsync.mockResolvedValue({});
  });

  it('should render the model name', () => {
    render(<ModelDetail model={mockModel} />);
    expect(screen.getByText('Test Model')).toBeInTheDocument();
  });

  it('should render the model description', () => {
    render(<ModelDetail model={mockModel} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should render the model status', () => {
    render(<ModelDetail model={mockModel} />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should show edit icon', () => {
    render(<ModelDetail model={mockModel} />);
    const editIcon = screen.getByTestId('icon');
    expect(editIcon).toBeInTheDocument();
    expect(editIcon).toHaveAttribute('data-name', 'pencil');
  });

  it('should show download button for file models', () => {
    render(<ModelDetail model={mockModel} />);
    expect(screen.getByText('DOWNLOAD API DATA')).toBeInTheDocument();
  });

  it('should show download button for file models without API', () => {
    const fileModel = { ...mockModel, modelAPI: undefined } as any;
    render(<ModelDetail model={fileModel} />);
    expect(screen.getByText('DOWNLOAD MODEL FILE')).toBeInTheDocument();
  });

  it('should open edit modal when edit icon is clicked', async () => {
    render(<ModelDetail model={mockModel} />);
    const editIcon = screen.getByTestId('icon');
    await act(async () => {
      await editIcon.click();
    });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal')).toHaveAttribute('data-heading', 'Edit Model');
  });

  it('should show model API data when available', () => {
    render(<ModelDetail model={mockModel} />);
    expect(screen.getByText('Model API')).toBeInTheDocument();
  });

  it('should not render description when empty', () => {
    const modelWithoutDescription = { ...mockModel, description: '' };
    render(<ModelDetail model={modelWithoutDescription} />);
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('should not render description when undefined', () => {
    const modelWithoutDescription = { ...mockModel, description: undefined } as any;
    render(<ModelDetail model={modelWithoutDescription} />);
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('should not render description when null', () => {
    const modelWithoutDescription = { ...mockModel, description: null } as any;
    render(<ModelDetail model={modelWithoutDescription} />);
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });
}); 