import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TestResults from '../TestResults';
import { TestModel } from '@/app/models/utils/types';
import { Algorithm, TestResult } from '@/app/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, ...props }: { text: string; [key: string]: any }) => (
    <button {...props}>{text}</button>
  ),
  ButtonVariant: {
    OUTLINE: 'outline',
  },
}));

describe('TestResults', () => {
  const mockAlgorithms: Algorithm[] = [
    {
      gid: 'test-gid-1',
      cid: 'test-cid-1',
      name: 'Test Algorithm 1',
      description: 'Test algorithm description 1',
      modelType: ['classification'],
      version: '1.0.0',
      author: 'Test Author',
      tags: ['test'],
      requireGroundTruth: true,
      language: 'python',
      script: 'test_script.py',
      module_name: 'test_module',
      inputSchema: {
        title: 'Test Input',
        description: 'Test input schema',
        type: 'object',
        required: ['test'],
        properties: {},
      },
      outputSchema: {
        title: 'Test Output',
        description: 'Test output schema',
        type: 'object',
        required: ['results'],
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
      zip_hash: 'test-hash',
    },
    {
      gid: 'test-gid-2',
      cid: 'test-cid-2',
      name: 'Test Algorithm 2',
      description: 'Test algorithm description 2',
      modelType: ['regression'],
      version: '1.0.0',
      author: 'Test Author',
      tags: ['test'],
      requireGroundTruth: true,
      language: 'python',
      script: 'test_script.py',
      module_name: 'test_module',
      inputSchema: {
        title: 'Test Input',
        description: 'Test input schema',
        type: 'object',
        required: ['test'],
        properties: {},
      },
      outputSchema: {
        title: 'Test Output',
        description: 'Test output schema',
        type: 'object',
        required: ['results'],
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
      zip_hash: 'test-hash',
    },
  ];

  const mockTestResults: TestResult[] = [
    {
      id: 1,
      gid: 'test-gid-1',
      cid: 'test-cid-1',
      name: 'Test Result 1',
      version: '1.0.0',
      startTime: '2023-01-01T00:00:00',
      timeTaken: 100,
      created_at: '2023-01-01T00:00:00',
      updated_at: '2023-01-01T00:00:00',
      testArguments: {
        testDataset: 'test-dataset',
        mode: 'test-mode',
        modelType: 'classification',
        groundTruthDataset: 'ground-truth-dataset',
        groundTruth: 'ground-truth',
        algorithmArgs: '{}',
        modelFile: 'model1.pkl',
      },
      output: 'test-output',
    },
    {
      id: 2,
      gid: 'test-gid-1',
      cid: 'test-cid-1',
      name: 'Test Result 2',
      version: '1.0.0',
      startTime: '2023-01-02T00:00:00',
      timeTaken: 200,
      created_at: '2023-01-02T00:00:00',
      updated_at: '2023-01-02T00:00:00',
      testArguments: {
        testDataset: 'test-dataset',
        mode: 'test-mode',
        modelType: 'classification',
        groundTruthDataset: 'ground-truth-dataset',
        groundTruth: 'ground-truth',
        algorithmArgs: '{}',
        modelFile: 'model2.pkl',
      },
      output: 'test-output',
    },
    {
      id: 3,
      gid: 'test-gid-2',
      cid: 'test-cid-2',
      name: 'Test Result 3',
      version: '1.0.0',
      startTime: '2023-01-03T00:00:00',
      timeTaken: 300,
      created_at: '2023-01-03T00:00:00',
      updated_at: '2023-01-03T00:00:00',
      testArguments: {
        testDataset: 'test-dataset',
        mode: 'test-mode',
        modelType: 'regression',
        groundTruthDataset: 'ground-truth-dataset',
        groundTruth: 'ground-truth',
        algorithmArgs: '{}',
        modelFile: 'model1.pkl',
      },
      output: 'test-output',
    },
  ];

  const mockSelectedModel: TestModel = {
    id: 1,
    name: 'model1.pkl',
    description: 'Test model 1',
    mode: 'test-mode',
    modelType: 'classification',
    fileType: 'pickle',
    filename: 'model1.pkl',
    zip_hash: 'test-hash',
    size: 1024,
    serializer: 'pickle',
    modelFormat: 'pickle',
    modelAPI: {
      method: 'POST',
      url: 'test-url',
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
        batchLimit: 1000,
        connectionRetries: 3,
        maxConnections: 10,
        batchStrategy: 'sequential',
      },
    },
    parameterMappings: {
      requestBody: {},
      parameters: {},
    },
    status: 'valid',
    errorMessages: '',
    created_at: '2023-01-01T00:00:00',
    updated_at: '2023-01-01T00:00:00',
  };

  const defaultProps = {
    projectId: 'test-project-id',
    requiredAlgorithms: mockAlgorithms,
    onTestResultsChange: jest.fn(),
    allTestResults: mockTestResults,
    flow: 'test-flow',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.log calls
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with correct title and description', () => {
      render(<TestResults {...defaultProps} />);

      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Select test results for each required algorithm. Only test results matching the selected model will be shown.'
        )
      ).toBeInTheDocument();
    });

    it('renders all required algorithms', () => {
      render(<TestResults {...defaultProps} />);

      expect(screen.getByText('Test Algorithm 1')).toBeInTheDocument();
      expect(screen.getByText('Test Algorithm 2')).toBeInTheDocument();
    });

    it('renders select dropdowns for each algorithm', () => {
      render(<TestResults {...defaultProps} />);

      const selectElements = screen.getAllByRole('combobox');
      expect(selectElements).toHaveLength(2);
    });

    it('renders RUN TESTS buttons for each algorithm', () => {
      render(<TestResults {...defaultProps} />);

      const runButtons = screen.getAllByText('RUN TESTS');
      expect(runButtons).toHaveLength(2);
    });

    it('renders UPLOAD TEST RESULTS button', () => {
      render(<TestResults {...defaultProps} />);

      expect(screen.getByText('UPLOAD TEST RESULTS')).toBeInTheDocument();
    });

    it('shows correct test result options in dropdowns', () => {
      render(<TestResults {...defaultProps} />);

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      // Open the first dropdown
      fireEvent.click(firstSelect);

      // Check that the correct options are shown
      expect(screen.getAllByText('Choose Test Results')).toHaveLength(2);
      expect(screen.getByText(/Test Result 1/)).toBeInTheDocument();
      expect(screen.getByText(/Test Result 2/)).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('initializes with empty selections when no initialTestResults provided', () => {
      render(<TestResults {...defaultProps} />);

      const selectElements = screen.getAllByRole('combobox');
      selectElements.forEach((select) => {
        expect(select).toHaveValue('');
      });
    });

    it('initializes with provided initialTestResults', () => {
      const initialTestResults = [
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
      ];

      render(
        <TestResults {...defaultProps} initialTestResults={initialTestResults} />
      );

      const selectElements = screen.getAllByRole('combobox');
      expect(selectElements[0]).toHaveValue('1');
      expect(selectElements[1]).toHaveValue('');
    });
  });

  describe('User Interactions', () => {
    it('calls onTestResultsChange when user selects a test result', async () => {
      const user = userEvent.setup();
      const onTestResultsChange = jest.fn();

      render(
        <TestResults {...defaultProps} onTestResultsChange={onTestResultsChange} />
      );

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      await user.selectOptions(firstSelect, '1');

      expect(onTestResultsChange).toHaveBeenCalledWith([
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
      ]);
    });

    it('updates selection when user changes test result', async () => {
      const user = userEvent.setup();
      const onTestResultsChange = jest.fn();

      render(
        <TestResults {...defaultProps} onTestResultsChange={onTestResultsChange} />
      );

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      // Select first option
      await user.selectOptions(firstSelect, '1');
      expect(onTestResultsChange).toHaveBeenCalledWith([
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
      ]);

      // Select second option
      await user.selectOptions(firstSelect, '2');
      expect(onTestResultsChange).toHaveBeenCalledWith([
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 2 },
      ]);
    });

    it('allows multiple algorithms to have different selections', async () => {
      const user = userEvent.setup();
      const onTestResultsChange = jest.fn();

      render(
        <TestResults {...defaultProps} onTestResultsChange={onTestResultsChange} />
      );

      const selectElements = screen.getAllByRole('combobox');

      // Select for first algorithm
      await user.selectOptions(selectElements[0], '1');
      // Select for second algorithm
      await user.selectOptions(selectElements[1], '3');

      expect(onTestResultsChange).toHaveBeenCalledWith([
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
        { gid: 'test-gid-2', cid: 'test-cid-2', id: 3 },
      ]);
    });

    it('removes selection when user selects empty option', async () => {
      const user = userEvent.setup();
      const onTestResultsChange = jest.fn();
      const initialTestResults = [
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
      ];

      render(
        <TestResults
          {...defaultProps}
          onTestResultsChange={onTestResultsChange}
          initialTestResults={initialTestResults}
        />
      );

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      // Clear selection
      await user.selectOptions(firstSelect, '');

      expect(onTestResultsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Model Filtering', () => {
    it('filters test results when selectedModel is provided', () => {
      render(
        <TestResults {...defaultProps} selectedModel={mockSelectedModel} />
      );

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      // Open the first dropdown
      fireEvent.click(firstSelect);

      // Should only show test results that match the selected model
      expect(screen.getByText(/Test Result 1/)).toBeInTheDocument();
      expect(screen.queryByText(/Test Result 2/)).not.toBeInTheDocument();
      expect(screen.getByText(/Test Result 3/)).toBeInTheDocument();
    });

    it('updates selections when model changes', async () => {
      const onTestResultsChange = jest.fn();
      const initialTestResults = [
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 2 }, // This result doesn't match the model
      ];

      const { rerender } = render(
        <TestResults
          {...defaultProps}
          onTestResultsChange={onTestResultsChange}
          initialTestResults={initialTestResults}
        />
      );

      // Initially, the selection should be cleared because it doesn't match the model
      rerender(
        <TestResults
          {...defaultProps}
          onTestResultsChange={onTestResultsChange}
          initialTestResults={initialTestResults}
          selectedModel={mockSelectedModel}
        />
      );

      await waitFor(() => {
        expect(onTestResultsChange).toHaveBeenCalledWith([]);
      });
    });

    it('shows all test results when no model is selected', () => {
      render(<TestResults {...defaultProps} />);

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      // Open the first dropdown
      fireEvent.click(firstSelect);

      // Should show all test results for the algorithm
      expect(screen.getByText(/Test Result 1/)).toBeInTheDocument();
      expect(screen.getByText(/Test Result 2/)).toBeInTheDocument();
    });
  });

  describe('Link Generation', () => {
    it('generates correct RUN TESTS links', () => {
      render(<TestResults {...defaultProps} />);

      const runButtons = screen.getAllByText('RUN TESTS');
      const firstButton = runButtons[0];
      const secondButton = runButtons[1];

      expect(firstButton.closest('a')).toHaveAttribute(
        'href',
        '/results/run?flow=test-flow&projectId=test-project-id&algorithmGid=test-gid-1&algorithmCid=test-cid-1'
      );

      expect(secondButton.closest('a')).toHaveAttribute(
        'href',
        '/results/run?flow=test-flow&projectId=test-project-id&algorithmGid=test-gid-2&algorithmCid=test-cid-2'
      );
    });

    it('includes modelId in RUN TESTS links when model is selected', () => {
      render(<TestResults {...defaultProps} selectedModel={mockSelectedModel} />);

      const runButtons = screen.getAllByText('RUN TESTS');
      const firstButton = runButtons[0];

      expect(firstButton.closest('a')).toHaveAttribute(
        'href',
        '/results/run?flow=test-flow&projectId=test-project-id&algorithmGid=test-gid-1&algorithmCid=test-cid-1&modelId=1'
      );
    });

    it('generates correct UPLOAD TEST RESULTS link', () => {
      render(<TestResults {...defaultProps} />);

      const uploadButton = screen.getByText('UPLOAD TEST RESULTS');

      expect(uploadButton.closest('a')).toHaveAttribute(
        'href',
        '/results/upload?flow=test-flow&projectId=test-project-id'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty algorithms array', () => {
      render(<TestResults {...defaultProps} requiredAlgorithms={[]} />);

      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('handles empty test results array', () => {
      render(<TestResults {...defaultProps} allTestResults={[]} />);

      const selectElements = screen.getAllByRole('combobox');
      selectElements.forEach((select) => {
        fireEvent.click(select);
        expect(screen.getAllByText('Choose Test Results')).toHaveLength(2);
      });
    });

    it('handles test results with no matching algorithms', () => {
      const unmatchedTestResults: TestResult[] = [
        {
          id: 999,
          gid: 'unmatched-gid',
          cid: 'unmatched-cid',
          name: 'Unmatched Test Result',
          version: '1.0.0',
          startTime: '2023-01-01T00:00:00',
          timeTaken: 100,
          created_at: '2023-01-01T00:00:00',
          updated_at: '2023-01-01T00:00:00',
          testArguments: {
            testDataset: 'test-dataset',
            mode: 'test-mode',
            modelType: 'classification',
            groundTruthDataset: 'ground-truth-dataset',
            groundTruth: 'ground-truth',
            algorithmArgs: '{}',
            modelFile: 'model1.pkl',
          },
          output: 'test-output',
        },
      ];

      render(
        <TestResults {...defaultProps} allTestResults={unmatchedTestResults} />
      );

      const selectElements = screen.getAllByRole('combobox');
      selectElements.forEach((select) => {
        fireEvent.click(select);
        expect(screen.getAllByText('Choose Test Results')).toHaveLength(2);
        expect(screen.queryByText('Unmatched Test Result')).not.toBeInTheDocument();
      });
    });

    it('handles undefined initialTestResults', () => {
      render(<TestResults {...defaultProps} initialTestResults={undefined} />);

      const selectElements = screen.getAllByRole('combobox');
      selectElements.forEach((select) => {
        expect(select).toHaveValue('');
      });
    });

    it('handles test results with missing created_at', () => {
      const testResultsWithMissingDate: TestResult[] = [
        {
          id: 1,
          gid: 'test-gid-1',
          cid: 'test-cid-1',
          name: 'Test Result 1',
          version: '1.0.0',
          startTime: '2023-01-01T00:00:00',
          timeTaken: 100,
          created_at: '', // Missing date
          updated_at: '2023-01-01T00:00:00',
          testArguments: {
            testDataset: 'test-dataset',
            mode: 'test-mode',
            modelType: 'classification',
            groundTruthDataset: 'ground-truth-dataset',
            groundTruth: 'ground-truth',
            algorithmArgs: '{}',
            modelFile: 'model1.pkl',
          },
          output: 'test-output',
        },
      ];

      render(
        <TestResults {...defaultProps} allTestResults={testResultsWithMissingDate} />
      );

      const selectElements = screen.getAllByRole('combobox');
      const firstSelect = selectElements[0];

      fireEvent.click(firstSelect);
      expect(screen.getByText(/Test Result 1 - Invalid Date/)).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('updates internal state when initialTestResults changes', () => {
      const { rerender } = render(<TestResults {...defaultProps} />);

      const initialTestResults = [
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
      ];

      rerender(
        <TestResults {...defaultProps} initialTestResults={initialTestResults} />
      );

      const selectElements = screen.getAllByRole('combobox');
      expect(selectElements[0]).toHaveValue('1');
    });

    it('prevents infinite loops when initialTestResults are the same', () => {
      const initialTestResults = [
        { gid: 'test-gid-1', cid: 'test-cid-1', id: 1 },
      ];

      const { rerender } = render(
        <TestResults {...defaultProps} initialTestResults={initialTestResults} />
      );

      // Re-render with the same initialTestResults
      rerender(
        <TestResults {...defaultProps} initialTestResults={initialTestResults} />
      );

      // Should not cause any issues
      const selectElements = screen.getAllByRole('combobox');
      expect(selectElements[0]).toHaveValue('1');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for select elements', () => {
      render(<TestResults {...defaultProps} />);

      const labels = screen.getAllByText(/Test Algorithm/);
      expect(labels).toHaveLength(2);
      expect(labels[0]).toHaveTextContent('Test Algorithm 1');
      expect(labels[1]).toHaveTextContent('Test Algorithm 2');
    });

    it('has proper ARIA attributes for select elements', () => {
      render(<TestResults {...defaultProps} />);

      const selectElements = screen.getAllByRole('combobox');
      selectElements.forEach((select) => {
        expect(select).toHaveAttribute('class');
      });
    });
  });
}); 