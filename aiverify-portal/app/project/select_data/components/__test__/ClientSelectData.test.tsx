import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
      <button onClick={() => onModelChange('model-1')}>Select Model 1</button>
      <button onClick={() => onModelChange('model-2')}>Select Model 2</button>
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
      <span>Selected: {selectedTestResults?.length || 0}</span>
    </div>
  ),
}));

jest.mock('../UserInputs', () => ({
  __esModule: true,
  default: ({ selectedInputBlocks, onInputBlocksChange }: any) => (
    <div data-testid="user-inputs">
      <button onClick={() => onInputBlocksChange([{ gid: 'group-1', cid: 'input-1', id: 1 }])}>Select Input 1</button>
      <button onClick={() => onInputBlocksChange([
        { gid: 'group-1', cid: 'input-1', id: 1 },
        { gid: 'group-1', cid: 'input-2', id: 2 }
      ])}>Select Multiple Inputs</button>
      <span>Selected: {selectedInputBlocks?.length || 0}</span>
    </div>
  ),
}));

// Mock the API function - fix the import path
jest.mock('@/lib/fetchApis/getProjects', () => ({
  patchProject: jest.fn(),
}));

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
        modelFile: 'model.pkl',
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
        modelFile: 'model2.pkl',
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
  });
}); 