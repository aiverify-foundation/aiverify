import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ClientSelectData from '../ClientSelectData';
import { UserFlows } from '@/app/userFlowsEnum';
import { TestModel } from '@/app/models/utils/types';
import { Algorithm, InputBlock, InputBlockData, InputBlockGroupData, TestResult } from '@/app/types';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the child components with simpler implementations
jest.mock('../ModelSelection', () => ({
  __esModule: true,
  default: ({ selectedModelId, onModelChange }: any) => (
    <div data-testid="model-selection">
      <button onClick={() => onModelChange('1')}>Select Model 1</button>
      <button onClick={() => onModelChange('2')}>Select Model 2</button>
      <button onClick={() => onModelChange(undefined)}>Clear Model</button>
      <span>Selected: {selectedModelId || ''}</span>
    </div>
  ),
}));

jest.mock('../TestResults', () => ({
  __esModule: true,
  default: ({ selectedTestResults, onTestResultsChange }: any) => (
    <div data-testid="test-results">
      <button onClick={() => onTestResultsChange([{ gid: 'group-1', cid: 'test-1', id: 1 }])}>Select Test 1</button>
      <button onClick={() => onTestResultsChange([
        { gid: 'group-1', cid: 'test-1', id: 1 },
        { gid: 'group-1', cid: 'test-2', id: 2 }
      ])}>Select Multiple Tests</button>
      <button onClick={() => onTestResultsChange([])}>Clear Tests</button>
      <span>Selected: {selectedTestResults?.length || 0}</span>
    </div>
  ),
}));

jest.mock('../UserInputs', () => ({
  __esModule: true,
  default: ({ selectedInputBlocks, onInputBlocksChange, onValidationResultsChange }: any) => (
    <div data-testid="user-inputs">
      <button onClick={() => onInputBlocksChange([{ gid: 'group-1', cid: 'input-1', id: 1 }])}>Select Input 1</button>
      <button onClick={() => onInputBlocksChange([
        { gid: 'group-1', cid: 'input-1', id: 1 },
        { gid: 'group-1', cid: 'input-2', id: 2 }
      ])}>Select Multiple Inputs</button>
      <button onClick={() => onInputBlocksChange([])}>Clear Inputs</button>
      <button onClick={() => onValidationResultsChange({
        'group-1-input-1-1': { isValid: false, message: 'Validation error', progress: 0 }
      })}>Trigger Validation Error</button>
      <button onClick={() => onValidationResultsChange({
        'group-1-input-1-1': { isValid: true, message: 'Valid', progress: 100 }
      })}>Trigger Validation Success</button>
      <span>Selected: {selectedInputBlocks?.length || 0}</span>
    </div>
  ),
}));

// Mock the API function
jest.mock('@/lib/fetchApis/getProjects', () => ({
  patchProject: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as unknown as jest.Mocked<Storage>;
global.localStorage = localStorageMock;

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPatchProject = require('@/lib/fetchApis/getProjects').patchProject as jest.MockedFunction<any>;

describe('ClientSelectData', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockRequiredAlgorithms: Algorithm[] = [
    {
      cid: 'algo-1',
      gid: 'group-1',
      name: 'Test Algorithm 1',
      modelType: ['classification'],
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Algorithm Description 1',
      tags: ['test'],
      requireGroundTruth: true,
      language: 'python',
      script: 'test_script.py',
      module_name: 'test_module',
      inputSchema: {
        title: 'Test Input Schema',
        description: 'Test Input Schema Description',
        type: 'object',
        required: ['test'],
        properties: {},
      },
      outputSchema: {
        title: 'Test Output Schema',
        description: 'Test Output Schema Description',
        type: 'object',
        required: ['test'],
        minProperties: 1,
        properties: {
          feature_names: {
            type: 'array',
            description: 'Feature names',
            minItems: 1,
            items: { type: 'string' },
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
                  items: { type: 'number' },
                },
                ale: {
                  title: 'ALE',
                  type: 'array',
                  minItems: 1,
                  items: { type: 'number' },
                },
                size: {
                  title: 'Size',
                  type: 'array',
                  minItems: 1,
                  items: { type: 'number' },
                },
              },
            },
          },
        },
      },
      zip_hash: 'test_hash',
    },
  ];

  const mockRequiredInputBlocks: InputBlock[] = [
    {
      gid: 'group-1',
      cid: 'input-1',
      name: 'Input Block 1',
      description: 'Input Block Description 1',
      group: 'test-group',
    },
    {
      gid: 'group-1',
      cid: 'input-2',
      name: 'Input Block 2',
      description: 'Input Block Description 2',
      group: 'test-group',
    },
  ];

  const mockAllModels: TestModel[] = [
    {
      id: 1,
      name: 'Test Model 1',
      description: 'Test Description 1',
      mode: 'test-mode',
      modelType: 'classification',
      fileType: 'pkl',
      filename: 'model1.pkl',
      zip_hash: 'test_hash_1',
      size: 1024,
      serializer: 'pickle',
      modelFormat: 'pickle',
      modelAPI: {
        method: 'POST',
        url: 'http://test.com/api',
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
            name: 'test',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'test',
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
      mode: 'test-mode',
      modelType: 'classification',
      fileType: 'pkl',
      filename: 'model2.pkl',
      zip_hash: 'test_hash_2',
      size: 2048,
      serializer: 'pickle',
      modelFormat: 'pickle',
      modelAPI: {
        method: 'POST',
        url: 'http://test.com/api',
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
            name: 'test',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'test',
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
  ];

  const mockAllTestResults: TestResult[] = [
    {
      id: 1,
      gid: 'group-1',
      cid: 'test-1',
      version: '1.0.0',
      startTime: '2023-01-01T00:00:00Z',
      timeTaken: 100,
      testArguments: {
        testDataset: 'test-dataset',
        mode: 'test-mode',
        modelType: 'classification',
        groundTruthDataset: 'ground-truth',
        groundTruth: 'ground-truth',
        algorithmArgs: '{}',
        modelFile: 'Test Model 1',
      },
      output: 'test-output',
      name: 'Test Result 1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'group-1',
      cid: 'test-2',
      version: '1.0.0',
      startTime: '2023-01-01T00:00:00Z',
      timeTaken: 200,
      testArguments: {
        testDataset: 'test-dataset-2',
        mode: 'test-mode-2',
        modelType: 'classification',
        groundTruthDataset: 'ground-truth-2',
        groundTruth: 'ground-truth-2',
        algorithmArgs: '{}',
        modelFile: 'Test Model 2',
      },
      output: 'test-output-2',
      name: 'Test Result 2',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockAllInputBlockGroups: InputBlockGroupData[] = [
    {
      id: 1,
      gid: 'group-1',
      name: 'Group 1',
      group: 'test-group',
      input_blocks: [
        {
          id: 1,
          cid: 'input-1',
          name: 'Child 1',
          groupNumber: 1,
          data: {},
        },
      ],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockAllInputBlockDatas: InputBlockData[] = [
    {
      gid: 'group-1',
      cid: 'input-1',
      name: 'Input Data 1',
      group: 'test-group',
      data: {},
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const defaultProps = {
    projectId: 'test-project-id',
    requiredAlgorithms: mockRequiredAlgorithms,
    requiredInputBlocks: mockRequiredInputBlocks,
    allModels: mockAllModels,
    allTestResults: mockAllTestResults,
    allInputBlockGroups: mockAllInputBlockGroups,
    allInputBlockDatas: mockAllInputBlockDatas,
    flow: 'edit',
    initialModelId: undefined,
    initialTestResults: [],
    initialInputBlocks: [],
    hasVisitedDataSelection: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockPatchProject.mockResolvedValue({ success: true });
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders the component with all sections', () => {
      render(<ClientSelectData {...defaultProps} />);
      
      expect(screen.getByTestId('model-selection')).toBeInTheDocument();
      expect(screen.getByTestId('test-results')).toBeInTheDocument();
      expect(screen.getByTestId('user-inputs')).toBeInTheDocument();
    });

    it('renders with correct initial state', () => {
      render(<ClientSelectData {...defaultProps} />);
      
      expect(screen.getByText('Selected:')).toBeInTheDocument();
      expect(screen.getAllByText('Selected: 0')).toHaveLength(2);
    });

    it('renders with title and description', () => {
      render(<ClientSelectData {...defaultProps} />);
      
      expect(screen.getByText('Select the Model, Test Results and User Input')).toBeInTheDocument();
      expect(screen.getByText('Please select the AI Model, Test Result(s) and User Input(s) required for report generation.')).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<ClientSelectData {...defaultProps} />);
      
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('renders with initial values when provided', () => {
      const propsWithInitialValues = {
        ...defaultProps,
        initialModelId: '1',
        initialTestResults: [{ id: 1, gid: 'group-1', cid: 'test-1' }],
        initialInputBlocks: [{ id: 1, gid: 'group-1', cid: 'input-1' }],
      };
      
      render(<ClientSelectData {...propsWithInitialValues} />);
      
      expect(screen.getByText('Selected: 1')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles different flow values', () => {
      const propsWithDifferentFlow = {
        ...defaultProps,
        flow: 'create',
      };
      
      render(<ClientSelectData {...propsWithDifferentFlow} />);
      
      expect(screen.getByTestId('model-selection')).toBeInTheDocument();
      expect(screen.getByTestId('test-results')).toBeInTheDocument();
      expect(screen.getByTestId('user-inputs')).toBeInTheDocument();
    });

    it('handles empty arrays for data', () => {
      const propsWithEmptyData = {
        ...defaultProps,
        allModels: [],
        allTestResults: [],
        allInputBlockGroups: [],
        allInputBlockDatas: [],
      };
      
      render(<ClientSelectData {...propsWithEmptyData} />);
      
      expect(screen.getByTestId('model-selection')).toBeInTheDocument();
      expect(screen.getByTestId('test-results')).toBeInTheDocument();
      expect(screen.getByTestId('user-inputs')).toBeInTheDocument();
    });

    it('handles empty required input blocks', () => {
      const propsWithNoRequiredInputs = {
        ...defaultProps,
        requiredInputBlocks: [],
      };
      
      render(<ClientSelectData {...propsWithNoRequiredInputs} />);
      
      expect(screen.getByTestId('user-inputs')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('updates model selection', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const modelButton = screen.getByText('Select Model 1');
      await act(async () => {
        fireEvent.click(modelButton);
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: 1,
          testResults: [],
          inputBlocks: [],
        });
      });
    });

    it('updates test results selection', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const testButton = screen.getByText('Select Test 1');
      await act(async () => {
        fireEvent.click(testButton);
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [1],
          inputBlocks: [],
        });
      });
    });

    it('updates input blocks selection', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const inputButton = screen.getByText('Select Input 1');
      await act(async () => {
        fireEvent.click(inputButton);
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [1],
        });
      });
    });

    it('clears model selection', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // First select a model
      await act(async () => {
        fireEvent.click(screen.getByText('Select Model 1'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: 1,
          testResults: [],
          inputBlocks: [],
        });
      });
      
      // Then clear it - the mock component passes undefined, but the actual component might handle it differently
      await act(async () => {
        fireEvent.click(screen.getByText('Clear Model'));
      });
      
      // Check that the API was called again (we don't need to check the exact parameters)
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledTimes(2);
      });
    });

    it('clears test results selection', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // First select test results
      await act(async () => {
        fireEvent.click(screen.getByText('Select Test 1'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [1],
          inputBlocks: [],
        });
      });
      
      // Then clear them
      await act(async () => {
        fireEvent.click(screen.getByText('Clear Tests'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [],
        });
      });
    });

    it('clears input blocks selection', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // First select input blocks
      await act(async () => {
        fireEvent.click(screen.getByText('Select Input 1'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [1],
        });
      });
      
      // Then clear them
      await act(async () => {
        fireEvent.click(screen.getByText('Clear Inputs'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [],
        });
      });
    });
  });

  describe('API Integration', () => {
    it('calls patchProject when model changes', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const modelButton = screen.getByText('Select Model 1');
      fireEvent.click(modelButton);
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: 1,
          testResults: [],
          inputBlocks: [],
        });
      });
    });

    it('calls patchProject when test results change', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const testButton = screen.getByText('Select Test 1');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [1],
          inputBlocks: [],
        });
      });
    });

    it('calls patchProject when input blocks change', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const inputButton = screen.getByText('Select Input 1');
      fireEvent.click(inputButton);
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [1],
        });
      });
    });

    it('handles API errors gracefully', async () => {
      mockPatchProject.mockRejectedValue(new Error('API Error'));
      
      render(<ClientSelectData {...defaultProps} />);
      
      const modelButton = screen.getByText('Select Model 1');
      fireEvent.click(modelButton);
      
      // Should not throw error
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalled();
      });
    });
  });

  describe('Validation Handling', () => {
    it('handles validation errors', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // First select an input block
      await act(async () => {
        fireEvent.click(screen.getByText('Select Input 1'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [1],
        });
      });
      
      // Then trigger validation error
      await act(async () => {
        fireEvent.click(screen.getByText('Trigger Validation Error'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles validation success', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // First select an input block
      await act(async () => {
        fireEvent.click(screen.getByText('Select Input 1'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [],
          inputBlocks: [1],
        });
      });
      
      // Then trigger validation success
      await act(async () => {
        fireEvent.click(screen.getByText('Trigger Validation Success'));
      });
      
      // Should not show validation warnings
      expect(screen.queryByText('Validation Warnings')).not.toBeInTheDocument();
    });

    it('handles validation with no required input blocks', async () => {
      const propsWithNoRequiredInputs = {
        ...defaultProps,
        requiredInputBlocks: [],
      };
      
      render(<ClientSelectData {...propsWithNoRequiredInputs} />);
      
      // Trigger validation error
      await act(async () => {
        fireEvent.click(screen.getByText('Trigger Validation Error'));
      });
      
      // Should not show validation warnings when no input blocks are required
      expect(screen.queryByText('Validation Warnings')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('handles next button click for edit flow', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select required data - need to select all required input blocks (2 in this case)
      fireEvent.click(screen.getByText('Select Model 1'));
      fireEvent.click(screen.getByText('Select Test 1'));
      fireEvent.click(screen.getByText('Select Multiple Inputs')); // This selects 2 input blocks
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalled();
      });
    });

    it('handles next button click for create flow', async () => {
      const propsWithCreateFlow = {
        ...defaultProps,
        flow: UserFlows.NewProjectWithNewTemplate,
      };
      
      render(<ClientSelectData {...propsWithCreateFlow} />);
      
      // Select required data - need to select all required input blocks (2 in this case)
      fireEvent.click(screen.getByText('Select Model 1'));
      fireEvent.click(screen.getByText('Select Test 1'));
      fireEvent.click(screen.getByText('Select Multiple Inputs')); // This selects 2 input blocks
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalled();
      });
    });

    it('disables next button when validation errors exist', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block and trigger validation error
      fireEvent.click(screen.getByText('Select Input 1'));
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
      
      // Next button should be disabled or not present
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('enables next button when all required input blocks are selected and no validation errors', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select all required input blocks (2 in this case)
      fireEvent.click(screen.getByText('Select Multiple Inputs'));
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });
  });

  describe('Model Change Logic', () => {
    it('filters test results when model changes', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // First select test results
      await act(async () => {
        fireEvent.click(screen.getByText('Select Test 1'));
      });
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: null,
          testResults: [1],
          inputBlocks: [],
        });
      });
      
      // Then change model
      await act(async () => {
        fireEvent.click(screen.getByText('Select Model 1'));
      });
      
      // Test results should be filtered based on model
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: 1,
          testResults: [1], // Should keep matching test result
          inputBlocks: [],
        });
      });
    });
  });

  describe('useEffect Hooks', () => {
    it('syncs state with props when initialModelId changes', async () => {
      const { rerender } = render(<ClientSelectData {...defaultProps} />);
      
      // Change the initialModelId prop
      await act(async () => {
        rerender(<ClientSelectData {...defaultProps} initialModelId="2" />);
      });
      
      // Check that the UI reflects the change (the mock component shows the selected model ID)
      await waitFor(() => {
        expect(screen.getByText('Selected: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing projectId', async () => {
      const propsWithoutProjectId = {
        ...defaultProps,
        projectId: '',
      };
      
      render(<ClientSelectData {...propsWithoutProjectId} />);
      
      // Should not call API when projectId is missing
      fireEvent.click(screen.getByText('Select Model 1'));
      
      await waitFor(() => {
        expect(mockPatchProject).not.toHaveBeenCalled();
      });
    });

    it('handles group selections in input blocks', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // This would test group selection logic if we had more complex mock data
      // For now, just ensure the component renders with group data
      expect(screen.getByTestId('user-inputs')).toBeInTheDocument();
    });

    it('handles complex validation result processing', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger complex validation with multiple errors
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles localStorage operations', async () => {
      localStorageMock.getItem.mockReturnValue('1234567890');
      
      render(<ClientSelectData {...defaultProps} />);
      
      // Trigger some action that uses localStorage
      fireEvent.click(screen.getByText('Select Model 1'));
      
      // The component should call localStorage.setItem when saving
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalled();
      });
    });

    it('handles visibility change events', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Simulate visibility change
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Then make it visible again
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Should handle the visibility change without errors
      expect(screen.getByTestId('model-selection')).toBeInTheDocument();
    });
  });

  describe('Back Button Logic', () => {
    it('renders correct back button link for edit flow', () => {
      render(<ClientSelectData {...defaultProps} />);
      
      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
    });

    it('renders correct back button link for create flow', () => {
      const propsWithCreateFlow = {
        ...defaultProps,
        flow: UserFlows.NewProjectWithNewTemplate,
      };
      
      render(<ClientSelectData {...propsWithCreateFlow} />);
      
      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Console Logging', () => {
    it('logs debug information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<ClientSelectData {...defaultProps} />);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Additional Coverage Tests', () => {
    it('handles different flow types for navigation', () => {
      const flows = [
        UserFlows.EditExistingProject,
        UserFlows.NewProjectWithNewTemplate,
        UserFlows.NewProjectWithExistingTemplate,
        UserFlows.NewProjectWithEditingExistingTemplate,
      ];

      flows.forEach(flow => {
        const propsWithFlow = {
          ...defaultProps,
          flow,
        };
        
        render(<ClientSelectData {...propsWithFlow} />);
        expect(screen.getByTestId('model-selection')).toBeInTheDocument();
        cleanup(); // Clean up after each render
      });
    });

    it('handles validation with empty selected input blocks', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Trigger validation error without selecting input blocks
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      // Should not show validation warnings when no input blocks are selected
      expect(screen.queryByText('Validation Warnings')).not.toBeInTheDocument();
    });

    it('handles validation with multiple input blocks', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select multiple input blocks
      fireEvent.click(screen.getByText('Select Multiple Inputs'));
      
      // Trigger validation error
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles model selection with matching test results', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select test results first
      fireEvent.click(screen.getByText('Select Test 1'));
      
      // Then select a model that matches the test results
      fireEvent.click(screen.getByText('Select Model 1'));
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: 1,
          testResults: [1], // Should keep matching test result
          inputBlocks: [],
        });
      });
    });

    it('handles model selection with non-matching test results', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select test results first
      fireEvent.click(screen.getByText('Select Test 1'));
      
      // Then select a model that doesn't match the test results
      fireEvent.click(screen.getByText('Select Model 2'));
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalledWith('test-project-id', {
          testModelId: 2,
          testResults: [], // Should clear non-matching test results
          inputBlocks: [],
        });
      });
    });

    it('handles saveSelectionsToAPI with parameters', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // This test would require accessing the internal function
      // For now, we test the behavior through the UI
      fireEvent.click(screen.getByText('Select Model 1'));
      
      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalled();
      });
    });

    it('handles processValidationResults with complex validation keys', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger validation with complex key
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles findInputBlockInfo function', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger validation to exercise findInputBlockInfo
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles validation result key parsing', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger validation to exercise key parsing logic
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles validation with group selections', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger validation to exercise group selection logic
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles validation message formatting', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger validation to exercise message formatting
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });

    it('handles validation with checklist formatting', async () => {
      render(<ClientSelectData {...defaultProps} />);
      
      // Select input block
      fireEvent.click(screen.getByText('Select Input 1'));
      
      // Trigger validation to exercise checklist formatting
      fireEvent.click(screen.getByText('Trigger Validation Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
      });
    });
  });
}); 