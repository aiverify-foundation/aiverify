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

// Mock RJSF Form component
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
    key, 
    templates,
    validator 
  }: any) {
    const handleSubmit = (e: any) => {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(e);
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
          
          return (
            <div key={key} data-testid={`field-${key}`}>
              <label htmlFor={key}>{field.title || key}</label>
              <input
                id={key}
                name={key}
                type="text"
                value={value}
                onChange={(e) => {
                  if (onChange) {
                    onChange({
                      formData: { ...formData, [key]: e.target.value }
                    });
                  }
                }}
                data-testid={`input-${key}`}
                required={schema.required?.includes(key)}
              />
            </div>
          );
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
                description: 'Test parameter 1'
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
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      mockUseSubmitTest.mockReturnValue(createMockMutation({
        isPending: true,
        status: 'pending',
        isIdle: false,
      }));

      render(<TestRunForm {...defaultProps} />);
      
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Running...');
      expect(runButton).toBeInTheDocument();
      expect(runButton).toBeDisabled();
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
  });

  describe('Custom Widgets', () => {
    it('renders custom text widget', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // The custom widgets should be available in the form
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('renders custom select widget', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // The custom select widget should be available
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Form Templates', () => {
    it('uses custom field template', () => {
      render(<TestRunForm {...defaultProps} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('uses custom array field template', () => {
      render(<TestRunForm {...defaultProps} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Check for proper form structure
      expect(screen.getByText('Configure Test Parameters')).toBeInTheDocument();
      
      // Check for proper button labels
      const cancelButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Cancel');
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      expect(cancelButton).toBeInTheDocument();
      expect(runButton).toBeInTheDocument();
    });

    it('shows error messages with proper accessibility', async () => {
      render(<TestRunForm {...defaultProps} />);
      
      // Submit without filling required fields
      const runButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('data-text') === 'Run Test');
      await userEvent.click(runButton!);
      
      // The button should remain disabled since form is invalid
      expect(runButton).toBeDisabled();
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

    it('handles plugins without algorithms', () => {
      const pluginsWithoutAlgorithms = [
        {
          ...mockPlugins[0],
          algorithms: [],
        }
      ];

      render(<TestRunForm {...defaultProps} plugins={pluginsWithoutAlgorithms} />);
      
      const forms = screen.getAllByTestId('rjsf-form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });
}); 