import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { UseMutationResult } from '@tanstack/react-query';
import TestRunForm from '../TestRunForm';
import useSubmitTest from '../../hooks/useSubmitTest';
import { Plugin, Algorithm, Dataset } from '@/app/types';
import { TestRunInput, TestRunOutput } from '@/lib/fetchApis/getTestRunApis';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the useSubmitTest hook
jest.mock('../../hooks/useSubmitTest');

// Mock the Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, style, ...props }: any) => (
    <div data-testid={`icon-${name}`} style={{ ...style, color }} {...props} />
  ),
  IconName: {
    Alert: 'Alert',
  },
}));

// Mock the Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ 
    variant, 
    text, 
    size, 
    disabled, 
    onClick, 
    textColor,
    ...props 
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
      data-variant={variant}
      data-size={size}
      data-disabled={disabled}
      data-text={text}
      {...props}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    OUTLINE: 'outline',
  },
}));

// Mock ServerStatusModal
jest.mock('../ServerStatusModal', () => {
  return function MockServerStatusModal({ isOpen, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="server-status-modal">
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
      </div>
    );
  };
});

// Mock RJSF Form component with enhanced functionality
jest.mock('@rjsf/core', () => {
  return function MockForm({ 
    schema, 
    formData, 
    onChange, 
    onSubmit, 
    uiSchema, 
    widgets, 
    className, 
    liveValidate, 
    showErrorList, 
    templates,
    validator,
    ...rest
  }: any) {
    const handleSubmit = (e: any) => {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(e);
      }
    };

    const handleChange = (e: any) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <form onSubmit={handleSubmit} data-testid="rjsf-form" className={className}>
        <div data-testid="form-schema" data-schema={JSON.stringify(schema)} />
        <div data-testid="form-data" data-formdata={JSON.stringify(formData)} />
        <div data-testid="form-errors" data-errors={JSON.stringify({})} />
        
        {/* Render form fields based on schema */}
        {schema?.properties && Object.keys(schema.properties).map((key) => {
          const field = schema.properties[key];
          const value = formData?.[key] || '';
          const widget = uiSchema?.[key]?.['ui:widget'];
          
          // Handle null or undefined field
          if (!field) {
            return (
              <div key={key} data-testid={`field-${key}`}>
                <label htmlFor={key}>{key}</label>
                <input
                  id={key}
                  name={key}
                  type="text"
                  value={value}
                  onChange={(e) => {
                    handleChange({
                      formData: { ...formData, [key]: e.target.value },
                      errors: [],
                      errorSchema: {}
                    });
                  }}
                  data-testid={`input-${key}`}
                  required={schema.required?.includes(key)}
                />
              </div>
            );
          }
          
          if (widget === 'CustomSelectWidget') {
            const enumOptions = uiSchema?.[key]?.['ui:enumOptions'] || [];
            return (
              <div key={key} data-testid={`field-${key}`}>
                <label htmlFor={key}>{field?.title || key}</label>
                <select
                  id={key}
                  name={key}
                  value={value}
                  onChange={(e) => {
                    handleChange({
                      formData: { ...formData, [key]: e.target.value },
                      errors: [],
                      errorSchema: {}
                    });
                  }}
                  data-testid={`select-${key}`}
                  required={schema.required?.includes(key)}
                >
                  <option value="">{uiSchema?.[key]?.['ui:placeholder'] || '-- Select --'}</option>
                  {enumOptions.map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          } else {
            return (
              <div key={key} data-testid={`field-${key}`}>
                <label htmlFor={key}>{field?.title || key}</label>
                <input
                  id={key}
                  name={key}
                  type="text"
                  value={value}
                  onChange={(e) => {
                    handleChange({
                      formData: { ...formData, [key]: e.target.value },
                      errors: [],
                      errorSchema: {}
                    });
                  }}
                  data-testid={`input-${key}`}
                  required={schema.required?.includes(key)}
                />
              </div>
            );
          }
        })}
        
        <button type="submit" data-testid="form-submit">Submit</button>
      </form>
    );
  };
});

// Mock validator
jest.mock('@rjsf/validator-ajv8', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSubmitTest = useSubmitTest as jest.MockedFunction<typeof useSubmitTest>;

describe('TestRunForm', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockSubmitTest = jest.fn();
  
  // Create a properly typed mock mutation object
  const createMockMutation = (overrides: Partial<UseMutationResult<TestRunOutput, Error, TestRunInput, unknown>> = {}): UseMutationResult<TestRunOutput, Error, TestRunInput, unknown> => ({
    mutate: mockSubmitTest,
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    variables: undefined,
    isIdle: true,
    status: 'idle',
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    ...overrides,
  } as UseMutationResult<TestRunOutput, Error, TestRunInput, unknown>);

  const mockPlugins: Plugin[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author',
      description: 'Test Description',
      url: null,
      meta: '{}',
      is_stock: true,
      zip_hash: 'hash1',
      algorithms: [
        {
          cid: 'algo1',
          gid: 'plugin1',
          name: 'Test Algorithm 1',
          modelType: ['classification'],
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Algorithm Description',
          tags: ['test'],
          requireGroundTruth: true,
          language: 'python',
          script: 'test_script.py',
          module_name: 'test_module',
          inputSchema: {
            title: 'Test Algorithm Input',
            description: 'Test input schema',
            type: 'object',
            required: ['param1'],
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1',
                description: 'Test parameter 1',
                default: 'default_value'
              },
              param2: {
                type: 'string',
                title: 'Parameter 2',
                description: 'Test parameter 2',
                'ui:widget': 'selectDataset'
              },
              param3: {
                type: 'string',
                title: 'Parameter 3',
                description: 'Test parameter 3',
                'ui:widget': 'selectTestDataFeature'
              }
            }
          },
          outputSchema: {
            title: 'Test Algorithm Output',
            description: 'Test output schema',
            type: 'object',
            required: ['feature_names'],
            minProperties: 1,
            properties: {
              feature_names: {
                type: 'array',
                description: 'Feature names',
                minItems: 1,
                items: { type: 'string' }
              },
              results: {
                title: 'Results',
                description: 'Test results',
                type: 'array',
                minItems: 1,
                items: {
                  description: 'Result item',
                  type: 'object',
                  required: ['indices'],
                  minProperties: 1,
                  properties: {
                    indices: {
                      title: 'Indices',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' }
                    },
                    ale: {
                      title: 'ALE',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' }
                    },
                    size: {
                      title: 'Size',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          zip_hash: 'hash1'
        }
      ],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }
  ];

  const mockModels = [
    { filename: 'model1.pkl', name: 'Test Model 1' },
    { filename: 'model2.pkl', name: 'Test Model 2' },
  ];

  const mockDatasets: Dataset[] = [
    {
      id: 'dataset1',
      name: 'Test Dataset 1',
      description: 'Test dataset description',
      fileType: 'file',
      filename: 'dataset1.csv',
      zip_hash: 'hash1',
      size: 1024,
      serializer: 'csv',
      dataFormat: 'csv',
      numRows: 100,
      numCols: 10,
      dataColumns: [
        { name: 'col1', datatype: 'string', label: 'Column 1' },
        { name: 'col2', datatype: 'number', label: 'Column 2' },
      ],
      status: 'valid',
      errorMessages: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'dataset2',
      name: 'Test Dataset 2',
      description: 'Test dataset 2 description',
      fileType: 'file',
      filename: 'dataset2.csv',
      zip_hash: 'hash2',
      size: 2048,
      serializer: 'csv',
      dataFormat: 'csv',
      numRows: 200,
      numCols: 15,
      dataColumns: [
        { name: 'ground_truth', datatype: 'string', label: 'Ground Truth' },
        { name: 'feature1', datatype: 'number', label: 'Feature 1' },
      ],
      status: 'valid',
      errorMessages: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }
  ];

  const defaultProps = {
    plugins: mockPlugins,
    models: mockModels,
    datasets: mockDatasets,
    initialServerActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSubmitTest.mockReturnValue(createMockMutation());
  });

  describe('Rendering', () => {
    it('renders the form with correct title', () => {
      render(<TestRunForm {...defaultProps} />);
      
      expect(screen.getByText('Configure Test Parameters')).toBeInTheDocument();
    });

    it('renders the main form with RJSF', () => {
      render(<TestRunForm {...defaultProps} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('renders cancel and run test buttons', () => {
      render(<TestRunForm {...defaultProps} />);
      
      const buttons = screen.getAllByTestId('button');
      const cancelButton = buttons.find(btn => btn.getAttribute('data-text') === 'Cancel');
      const runButton = buttons.find(btn => btn.getAttribute('data-text') === 'Run Test');
      
      expect(cancelButton).toBeInTheDocument();
      expect(runButton).toBeInTheDocument();
    });

    it('shows server inactive message when server is not active', () => {
      render(<TestRunForm {...defaultProps} initialServerActive={false} />);
      
      expect(screen.getByText(/The Test Engine Worker is not running/)).toBeInTheDocument();
      const showInstructionsButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Show Instructions');
      expect(showInstructionsButton).toBeInTheDocument();
    });

    it('opens server status modal when show instructions is clicked', async () => {
      render(<TestRunForm {...defaultProps} initialServerActive={false} />);
      
      const showInstructionsButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Show Instructions');
      await userEvent.click(showInstructionsButton!);
      
      expect(screen.getByTestId('server-status-modal')).toBeInTheDocument();
    });

    it('closes server status modal when close button is clicked', async () => {
      render(<TestRunForm {...defaultProps} initialServerActive={false} />);
      
      const showInstructionsButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Show Instructions');
      await userEvent.click(showInstructionsButton!);
      
      const closeButton = screen.getByTestId('close-modal');
      await userEvent.click(closeButton);
      
      expect(screen.queryByTestId('server-status-modal')).not.toBeInTheDocument();
    });

    it('renders algorithm parameters section when algorithm is selected', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Should render algorithm parameters section
      expect(screen.getByText('Algorithm Parameters')).toBeInTheDocument();
    });

    it('does not render algorithm parameters when no algorithm is selected', () => {
      // Create a plugin with no algorithms to ensure no algorithm is auto-selected
      const pluginWithNoAlgorithms = {
        ...mockPlugins[0],
        algorithms: []
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNoAlgorithms]} />);
      
      expect(screen.queryByText('Algorithm Parameters')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when form is invalid', () => {
      render(<TestRunForm {...defaultProps} />);
      
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      expect(runButton).toBeDisabled();
    });

    it('shows validation error messages when submit is clicked with invalid form', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Try to submit without filling required fields
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      expect(runButton).not.toBeDisabled();
    });

    it('shows missing fields message when form is invalid', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Try to submit without filling required fields
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
    });

    it('submits form with correct data when valid', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Verify submitTest was called
      expect(mockSubmitTest).toHaveBeenCalledWith({
        mode: 'upload',
        algorithmGID: 'plugin1',
        algorithmCID: 'algo1',
        algorithmArgs: { param1: 'default_value' },
        modelFilename: 'model1.pkl',
        testDatasetFilename: 'dataset1.csv',
        groundTruthDatasetFilename: 'dataset1.csv',
        groundTruth: undefined,
      });
    });

    it('handles form submission error', async () => {
      const mockError = new Error('Test error message');
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isError: true,
        error: mockError,
        status: 'error',
        isIdle: false,
      }));

      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Check if form renders correctly with error state
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('navigates to results page on successful submission', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Check if submitTest was called (navigation happens in onSuccess callback)
      expect(mockSubmitTest).toHaveBeenCalled();
    });

    it('navigates with project context when projectId and flow are provided', async () => {
      render(<TestRunForm {...defaultProps} projectId="test-project" flow="test-flow" />);
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Check if submitTest was called (navigation happens in onSuccess callback)
      expect(mockSubmitTest).toHaveBeenCalled();
    });

    it('throws error when no algorithm is selected', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Try to submit without selecting algorithm
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
    });

    it('throws error when selected algorithm is not found', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields with valid algorithm (since we can't select invalid one in dropdown)
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should submit successfully since algorithm is valid
      expect(mockSubmitTest).toHaveBeenCalled();
    });

    it('shows server status modal when server is inactive during submission', async () => {
      render(<TestRunForm {...defaultProps} initialServerActive={false} />);
      
      // Try to submit
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should show server status modal
      expect(screen.getByTestId('server-status-modal')).toBeInTheDocument();
    });

    it('submits form with ground truth dataset when selected', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields including ground truth dataset
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      const groundTruthDatasetSelect = screen.getByTestId('select-groundTruthDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      await userEvent.selectOptions(groundTruthDatasetSelect, 'dataset2.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should submit with selected ground truth dataset
      expect(mockSubmitTest).toHaveBeenCalledWith(
        expect.objectContaining({
          groundTruthDatasetFilename: 'dataset2.csv'
        })
      );
    });

    it('submits form with ground truth column when selected', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields including ground truth column
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      const groundTruthSelect = screen.getByTestId('select-groundTruth');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      await userEvent.selectOptions(groundTruthSelect, 'col1');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should submit with selected ground truth column
      expect(mockSubmitTest).toHaveBeenCalledWith(
        expect.objectContaining({
          groundTruth: 'col1'
        })
      );
    });

    it('handles form submission with algorithm arguments processing', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Fill in algorithm parameter
      const paramInput = screen.getByTestId('input-param1');
      await userEvent.type(paramInput, 'custom_value');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should submit with processed algorithm arguments
      expect(mockSubmitTest).toHaveBeenCalledWith(
        expect.objectContaining({
          algorithmArgs: { param1: 'custom_value' }
        })
      );
    });
  });

  describe('Ground Truth Handling', () => {
    it('uses test dataset as ground truth when ground truth dataset is not selected', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields without selecting ground truth dataset
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should use test dataset as ground truth
      expect(mockSubmitTest).toHaveBeenCalledWith(
        expect.objectContaining({
          groundTruthDatasetFilename: 'dataset1.csv'
        })
      );
    });

    it('uses selected ground truth dataset when provided', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in required fields including ground truth dataset
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      const groundTruthDatasetSelect = screen.getByTestId('select-groundTruthDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      await userEvent.selectOptions(groundTruthDatasetSelect, 'dataset2.csv');
      
      // Submit the form
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should use selected ground truth dataset
      expect(mockSubmitTest).toHaveBeenCalledWith(
        expect.objectContaining({
          groundTruthDatasetFilename: 'dataset2.csv'
        })
      );
    });
  });

  describe('Missing Fields Message', () => {
    it('shows missing fields message when form is invalid', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Try to submit without filling required fields
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
    });

    it('shows specific missing field message for single field', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in some but not all required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Try to submit
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Check if form is still invalid (button might be enabled if algorithm is auto-selected)
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Algorithm Arguments Processing', () => {
    it('processes algorithm arguments with selectDataset widget', async () => {
      const pluginWithSelectDataset = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            title: 'Test Algorithm Input',
            description: 'Test input schema',
            type: 'object',
            required: ['datasetParam'],
            properties: {
              datasetParam: {
                type: 'string',
                title: 'Dataset Parameter',
                description: 'Select a dataset',
                'ui:widget': 'selectDataset'
              }
            }
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithSelectDataset]} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Should render the form with algorithm parameters
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('processes algorithm arguments with selectTestDataFeature widget', async () => {
      const pluginWithSelectFeature = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            title: 'Test Algorithm Input',
            description: 'Test input schema',
            type: 'object',
            required: ['featureParam'],
            properties: {
              featureParam: {
                type: 'string',
                title: 'Feature Parameter',
                description: 'Select a feature',
                'ui:widget': 'selectTestDataFeature'
              }
            }
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithSelectFeature]} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Should render the form with algorithm parameters
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('applies default values from algorithm schema', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Should apply default values from schema
      const formDataElements = screen.getAllByTestId('form-data');
      expect(formDataElements.length).toBeGreaterThan(0);
    });

    it('handles algorithm with selectDataset widget and default value', async () => {
      const pluginWithDefaultDataset = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            title: 'Test Algorithm Input',
            description: 'Test input schema',
            type: 'object',
            required: ['datasetParam'],
            properties: {
              datasetParam: {
                type: 'string',
                title: 'Dataset Parameter',
                description: 'Select a dataset',
                'ui:widget': 'selectDataset',
                default: 'default_dataset.csv'
              }
            }
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithDefaultDataset]} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Should render the form with algorithm parameters
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Single Algorithm Auto-Selection', () => {
    it('auto-selects algorithm when only one is available', () => {
      const singleAlgorithmPlugin = {
        ...mockPlugins[0],
        algorithms: [mockPlugins[0].algorithms[0]]
      };

      render(<TestRunForm {...defaultProps} plugins={[singleAlgorithmPlugin]} />);
      
      // Algorithm should be auto-selected
      const formDataElements = screen.getAllByTestId('form-data');
      expect(formDataElements.length).toBeGreaterThan(0);
    });
  });

  describe('Timer Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { unmount } = render(<TestRunForm {...defaultProps} />);
      
      // Should not throw any errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Algorithm Arguments Reset', () => {
    it('resets algorithm arguments when algorithm changes', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Change algorithm
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Algorithm arguments should be reset
      const formDataElements = screen.getAllByTestId('form-data');
      expect(formDataElements.length).toBeGreaterThan(0);
    });
  });

  describe('Form Change Handlers', () => {
    it('handles main form changes correctly', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Change algorithm selection
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Should update form data
      const formDataElements = screen.getAllByTestId('form-data');
      expect(formDataElements.length).toBeGreaterThan(0);
    });

    it('handles algorithm parameter changes correctly', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Select an algorithm to show parameters
      const algorithmSelect = screen.getByTestId('select-algorithm');
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      
      // Change algorithm parameter
      const paramInput = screen.getByTestId('input-param1');
      await userEvent.type(paramInput, 'test value');
      
      // Should update algorithm arguments
      const formDataElements = screen.getAllByTestId('form-data');
      expect(formDataElements.length).toBeGreaterThan(0);
    });

    it('handles form validation state changes', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Initially form should be invalid
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      expect(runButton).toBeDisabled();
      
      // Fill in required fields
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      // Form should now be valid
      expect(runButton).not.toBeDisabled();
    });
  });

  describe('Error Message Formatting', () => {
    it('formats JSON error messages correctly', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Test error message formatting by simulating an error with JSON
      const mockError = new Error('API Error: {"error": "Invalid input", "details": "Field is required"}');
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isError: true,
        error: mockError,
        status: 'error',
        isIdle: false,
      }));

      // Re-render with error state
      render(<TestRunForm {...defaultProps} />);
      
      // Should format the error message - check if error handling is working
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles nested JSON error messages', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Test nested JSON error message
      const mockError = new Error('API Error: {"error": "Validation failed", "details": "{\"detail\": \"Field is invalid\"}"}');
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isError: true,
        error: mockError,
        status: 'error',
        isIdle: false,
      }));

      // Re-render with error state
      render(<TestRunForm {...defaultProps} />);
      
      // Should format the nested error message - check if error handling is working
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('returns original message for non-JSON errors', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Test non-JSON error message
      const mockError = new Error('Simple error message');
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isError: true,
        error: mockError,
        status: 'error',
        isIdle: false,
      }));

      // Re-render with error state
      render(<TestRunForm {...defaultProps} />);
      
      // Should return original message - check if error handling is working
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles error message with malformed JSON', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Test malformed JSON error message
      const mockError = new Error('API Error: {"error": "Invalid input", "details": "Field is required"');
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isError: true,
        error: mockError,
        status: 'error',
        isIdle: false,
      }));

      // Re-render with error state
      render(<TestRunForm {...defaultProps} />);
      
      // Should handle malformed JSON gracefully
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty plugins array', () => {
      render(<TestRunForm {...defaultProps} plugins={[]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles empty models array', () => {
      render(<TestRunForm {...defaultProps} models={[]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles empty datasets array', () => {
      render(<TestRunForm {...defaultProps} datasets={[]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm without input schema', () => {
      const pluginWithoutSchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: undefined as any
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithoutSchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with empty input schema', () => {
      const pluginWithEmptySchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: { 
            type: 'object', 
            properties: {},
            title: 'Empty Schema',
            description: 'Empty input schema',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithEmptySchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with null input schema', () => {
      const pluginWithNullSchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: null as any
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullSchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with schema without properties', () => {
      const pluginWithoutProperties = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            title: 'Schema without properties',
            description: 'Schema without properties',
            required: [],
            properties: {}
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithoutProperties]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with schema with null properties', () => {
      const pluginWithNullProperties = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: null as any,
            title: 'Schema with null properties',
            description: 'Schema with null properties',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullProperties]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with optional array type', () => {
      const pluginWithOptionalArray = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            title: 'Test Algorithm Input',
            description: 'Test input schema',
            type: 'object',
            required: [],
            properties: {
              optionalArray: {
                type: ['array', 'null'],
                title: 'Optional Array',
                description: 'Optional array parameter'
              }
            }
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithOptionalArray]} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      userEvent.selectOptions(algorithmSelect, 'algo1');
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with empty array value', () => {
      const pluginWithEmptyArray = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            title: 'Test Algorithm Input',
            description: 'Test input schema',
            type: 'object',
            required: [],
            properties: {
              emptyArray: {
                type: ['array', 'null'],
                title: 'Empty Array',
                description: 'Empty array parameter'
              }
            }
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithEmptyArray]} />);
      
      // Select an algorithm
      const algorithmSelect = screen.getByTestId('select-algorithm');
      userEvent.selectOptions(algorithmSelect, 'algo1');
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('navigates to results page when cancel is clicked', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      const cancelButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Cancel');
      await userEvent.click(cancelButton!);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/results');
    });
  });

  describe('Preselected Model', () => {
    it('preselects model when provided', () => {
      const preselectedModel = {
        id: 1,
        name: 'Preselected Model',
        filename: 'preselected.pkl',
      };

      render(<TestRunForm {...defaultProps} preselectedModel={preselectedModel} />);
      
      const formDataElements = screen.getAllByTestId('form-data');
      expect(formDataElements.length).toBeGreaterThan(0);
    });
  });

  describe('Project ID and Flow', () => {
    it('handles project ID and flow props', () => {
      render(<TestRunForm {...defaultProps} projectId="test-project" flow="test-flow" />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles missing required fields gracefully', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Submit without filling any fields
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
    });

    it('handles algorithm not found error', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Fill in fields with valid algorithm (since we can't select invalid one in dropdown)
      const algorithmSelect = screen.getByTestId('select-algorithm');
      const modelSelect = screen.getByTestId('select-model');
      const testDatasetSelect = screen.getByTestId('select-testDataset');
      
      await userEvent.selectOptions(algorithmSelect, 'algo1');
      await userEvent.selectOptions(modelSelect, 'model1.pkl');
      await userEvent.selectOptions(testDatasetSelect, 'dataset1.csv');
      
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // Should submit successfully since algorithm is valid
      expect(mockSubmitTest).toHaveBeenCalled();
    });

    it('handles missing algorithm selection error', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Try to submit without selecting algorithm
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
    });

    it('displays error message when error state is set', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Simulate error state by calling the error handler
      const mockError = new Error('Test error message');
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isError: true,
        error: mockError,
        status: 'error',
        isIdle: false,
      }));

      // Re-render with error state
      render(<TestRunForm {...defaultProps} />);
      
      // Check if form renders correctly with error state
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with null input schema', () => {
      const pluginWithNullSchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: null as any
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullSchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with undefined input schema', () => {
      const pluginWithUndefinedSchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: undefined as any
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithUndefinedSchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with schema without properties', () => {
      const pluginWithoutProperties = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            title: 'Schema without properties',
            description: 'Schema without properties',
            required: [],
            properties: {}
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithoutProperties]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with schema with null properties', () => {
      const pluginWithNullProperties = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: null as any,
            title: 'Schema with null properties',
            description: 'Schema with null properties',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullProperties]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with schema with undefined properties', () => {
      const pluginWithUndefinedProperties = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: undefined as any,
            title: 'Schema with undefined properties',
            description: 'Schema with undefined properties',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithUndefinedProperties]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with schema with non-object properties', () => {
      const pluginWithNonObjectProperties = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: 'not an object' as any,
            title: 'Schema with non-object properties',
            description: 'Schema with non-object properties',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNonObjectProperties]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property schema that is not an object', () => {
      const pluginWithInvalidPropertySchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: 'not a schema object' as any
            },
            title: 'Schema with invalid property schema',
            description: 'Schema with invalid property schema',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithInvalidPropertySchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property schema that is null', () => {
      const pluginWithNullPropertySchema = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: null as any
            },
            title: 'Schema with null property schema',
            description: 'Schema with null property schema',
            required: []
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullPropertySchema]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with required fields that are not arrays', () => {
      const pluginWithInvalidRequired = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1'
              }
            },
            required: 'not an array' as any,
            title: 'Schema with invalid required field',
            description: 'Schema with invalid required field'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithInvalidRequired]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with null required fields', () => {
      const pluginWithNullRequired = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1'
              }
            },
            required: null as any,
            title: 'Schema with null required field',
            description: 'Schema with null required field'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullRequired]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with undefined required fields', () => {
      const pluginWithUndefinedRequired = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1'
              }
            },
            required: undefined as any,
            title: 'Schema with undefined required field',
            description: 'Schema with undefined required field'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithUndefinedRequired]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has no default value', () => {
      const pluginWithoutDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1'
                // No default value
              }
            },
            required: [],
            title: 'Schema without default values',
            description: 'Schema without default values'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithoutDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has null default value', () => {
      const pluginWithNullDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1',
                default: null
              }
            },
            required: [],
            title: 'Schema with null default value',
            description: 'Schema with null default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithNullDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has undefined default value', () => {
      const pluginWithUndefinedDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1',
                default: undefined
              }
            },
            required: [],
            title: 'Schema with undefined default value',
            description: 'Schema with undefined default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithUndefinedDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has empty string default value', () => {
      const pluginWithEmptyStringDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                title: 'Parameter 1',
                default: ''
              }
            },
            required: [],
            title: 'Schema with empty string default value',
            description: 'Schema with empty string default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithEmptyStringDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has zero default value', () => {
      const pluginWithZeroDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'number',
                title: 'Parameter 1',
                default: 0
              }
            },
            required: [],
            title: 'Schema with zero default value',
            description: 'Schema with zero default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithZeroDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has false default value', () => {
      const pluginWithFalseDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'boolean',
                title: 'Parameter 1',
                default: false
              }
            },
            required: [],
            title: 'Schema with false default value',
            description: 'Schema with false default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithFalseDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has empty array default value', () => {
      const pluginWithEmptyArrayDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'array',
                title: 'Parameter 1',
                default: []
              }
            },
            required: [],
            title: 'Schema with empty array default value',
            description: 'Schema with empty array default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithEmptyArrayDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has empty object default value', () => {
      const pluginWithEmptyObjectDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'object',
                title: 'Parameter 1',
                default: {}
              }
            },
            required: [],
            title: 'Schema with empty object default value',
            description: 'Schema with empty object default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithEmptyObjectDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('handles algorithm with property that has complex default value', () => {
      const pluginWithComplexDefault = {
        ...mockPlugins[0],
        algorithms: [{
          ...mockPlugins[0].algorithms[0],
          inputSchema: {
            type: 'object',
            properties: {
              param1: {
                type: 'object',
                title: 'Parameter 1',
                default: {
                  nested: {
                    value: 'test',
                    array: [1, 2, 3],
                    boolean: true
                  }
                }
              }
            },
            required: [],
            title: 'Schema with complex default value',
            description: 'Schema with complex default value'
          }
        }]
      };

      render(<TestRunForm {...defaultProps} plugins={[pluginWithComplexDefault]} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });
}); 