import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { notFound } from 'next/navigation';
import {
  transformProjectOutputToState,
  ProjectOutput,
} from '@/app/canvas/utils/transformProjectOutputToState';
import { getAllInputBlockGroups } from '@/lib/fetchApis/getAllInputBlockGroup';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import { getInputBlockDatas } from '@/lib/fetchApis/getInputBlockDatas';
import { getPlugins, populatePluginsMdxBundles } from '@/lib/fetchApis/getPlugins';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import { PluginForGridLayout } from '@/app/canvas/types';
import SelectDataPage from '../page';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/app/canvas/utils/transformProjectOutputToState', () => ({
  transformProjectOutputToState: jest.fn(),
  ProjectOutput: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getAllInputBlockGroup', () => ({
  getAllInputBlockGroups: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getAllModels', () => ({
  getTestModels: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getInputBlockDatas', () => ({
  getInputBlockDatas: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getPlugins', () => ({
  getPlugins: jest.fn(),
  populatePluginsMdxBundles: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getProjects', () => ({
  getProjects: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getTestResults', () => ({
  getTestResults: jest.fn(),
}));

// Mock the child components
jest.mock('../components/SelectDataHeader', () => {
  return function MockSelectDataHeader({ updatedAt }: { updatedAt: string }) {
    return <div data-testid="select-data-header">Select Data Header - Updated: {updatedAt}</div>;
  };
});

jest.mock('../components/ClientSelectData', () => {
  return function MockClientSelectData({
    projectId,
    requiredAlgorithms,
    requiredInputBlocks,
    allModels,
    allTestResults,
    allInputBlockGroups,
    allInputBlockDatas,
    flow,
    initialModelId,
    initialTestResults,
    initialInputBlocks,
  }: any) {
    return (
      <div data-testid="client-select-data">
        Client Select Data - Project: {projectId}, Flow: {flow}
        <div>Required Algorithms: {requiredAlgorithms.length}</div>
        <div>Required Input Blocks: {requiredInputBlocks.length}</div>
        <div>All Models: {allModels.length}</div>
        <div>All Test Results: {allTestResults.length}</div>
        <div>All Input Block Groups: {allInputBlockGroups.length}</div>
        <div>All Input Block Datas: {allInputBlockDatas.length}</div>
        <div>Initial Model ID: {initialModelId || 'none'}</div>
        <div>Initial Test Results: {initialTestResults.length}</div>
        <div>Initial Input Blocks: {initialInputBlocks.length}</div>
      </div>
    );
  };
});

const mockTransformProjectOutputToState = transformProjectOutputToState as jest.MockedFunction<typeof transformProjectOutputToState>;
const mockGetAllInputBlockGroups = getAllInputBlockGroups as jest.MockedFunction<typeof getAllInputBlockGroups>;
const mockGetTestModels = getTestModels as jest.MockedFunction<typeof getTestModels>;
const mockGetInputBlockDatas = getInputBlockDatas as jest.MockedFunction<typeof getInputBlockDatas>;
const mockGetPlugins = getPlugins as jest.MockedFunction<typeof getPlugins>;
const mockPopulatePluginsMdxBundles = populatePluginsMdxBundles as jest.MockedFunction<typeof populatePluginsMdxBundles>;
const mockGetProjects = getProjects as jest.MockedFunction<typeof getProjects>;
const mockGetTestResults = getTestResults as jest.MockedFunction<typeof getTestResults>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe('SelectDataPage', () => {
  const mockProject: ProjectOutput = {
    id: 1,
    templateId: 'template-123',
    pages: [],
    globalVars: [],
    projectInfo: {
      name: 'Test Project',
      description: 'Test Project Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    testModelId: 123,
    inputBlocks: [
      { id: 1, gid: 'input-gid-1', cid: 'input-cid-1' },
      { id: 2, gid: 'input-gid-2', cid: 'input-cid-2' },
    ],
    testResults: [
      { id: 1, gid: 'result-gid-1', cid: 'result-cid-1' },
      { id: 2, gid: 'result-gid-2', cid: 'result-cid-2' },
    ],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  };

  const mockAllModels = [
    {
      id: 1,
      name: 'Model 1',
      description: 'Model 1 Description',
      mode: 'classification',
      modelType: 'sklearn',
      fileType: 'pickle',
      filename: 'model1.pkl',
      zip_hash: 'hash1',
      size: 1024,
      serializer: 'pickle',
      dataFormat: 'pickle',
      modelFormat: 'pickle',
      modelAPI: {
        method: 'POST',
        url: 'https://api.example.com/model1',
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
            name: 'queries',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'requestBody',
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
      numRows: null,
      numCols: null,
      dataColumns: null,
      status: 'valid',
      errorMessages: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Model 2',
      description: 'Model 2 Description',
      mode: 'regression',
      modelType: 'sklearn',
      fileType: 'pickle',
      filename: 'model2.pkl',
      zip_hash: 'hash2',
      size: 2048,
      serializer: 'pickle',
      dataFormat: 'pickle',
      modelFormat: 'pickle',
      modelAPI: {
        method: 'POST',
        url: 'https://api.example.com/model2',
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
            name: 'queries',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'requestBody',
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
      numRows: null,
      numCols: null,
      dataColumns: null,
      status: 'valid',
      errorMessages: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockAllTestResults = [
    {
      id: 1,
      gid: 'result-gid-1',
      cid: 'result-cid-1',
      version: '1.0.0',
      startTime: '2023-01-01T00:00:00Z',
      timeTaken: 1000,
      testArguments: {
        testDataset: 'dataset1',
        mode: 'test',
        modelType: 'sklearn',
        groundTruthDataset: 'groundtruth1',
        groundTruth: 'groundtruth1',
        algorithmArgs: 'args1',
        modelFile: 'model1.pkl',
      },
      output: 'output1',
      artifacts: ['artifact1'],
      name: 'Result 1',
      description: 'Result 1 Description',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'result-gid-2',
      cid: 'result-cid-2',
      version: '1.0.0',
      startTime: '2023-01-02T00:00:00Z',
      timeTaken: 2000,
      testArguments: {
        testDataset: 'dataset2',
        mode: 'test',
        modelType: 'sklearn',
        groundTruthDataset: 'groundtruth2',
        groundTruth: 'groundtruth2',
        algorithmArgs: 'args2',
        modelFile: 'model2.pkl',
      },
      output: 'output2',
      artifacts: ['artifact2'],
      name: 'Result 2',
      description: 'Result 2 Description',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const mockAllInputBlockGroups = [
    {
      id: 1,
      gid: 'group-gid-1',
      name: 'Group 1',
      group: 'group1',
      input_blocks: [
        {
          id: 1,
          cid: 'input-cid-1',
          name: 'Input Block 1',
          groupNumber: 1,
          data: {},
        },
      ],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'group-gid-2',
      name: 'Group 2',
      group: 'group2',
      input_blocks: [
        {
          id: 2,
          cid: 'input-cid-2',
          name: 'Input Block 2',
          groupNumber: 2,
          data: {},
        },
      ],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const mockAllInputBlockDatas = [
    {
      id: 1,
      gid: 'data-gid-1',
      cid: 'data-cid-1',
      name: 'Data 1',
      group: 'group1',
      data: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'data-gid-2',
      cid: 'data-cid-2',
      name: 'Data 2',
      group: 'group2',
      data: {},
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const mockPlugins = [
    { id: 1, name: 'Plugin 1', description: 'Plugin 1 Description' },
    { id: 2, name: 'Plugin 2', description: 'Plugin 2 Description' },
  ];

  const mockPluginsWithMdx: PluginForGridLayout[] = [
    {
      gid: 'plugin-1',
      version: '1.0.0',
      name: 'Plugin 1',
      author: 'Author 1',
      description: 'Plugin 1 Description',
      url: 'https://plugin1.com',
      meta: 'meta1',
      is_stock: true,
      zip_hash: 'hash1',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      gid: 'plugin-2',
      version: '1.0.0',
      name: 'Plugin 2',
      author: 'Author 2',
      description: 'Plugin 2 Description',
      url: 'https://plugin2.com',
      meta: 'meta2',
      is_stock: true,
      zip_hash: 'hash2',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockTransformedProject = {
    layouts: [[]],
    widgets: [[]],
    algorithmsOnReport: [
      {
        gid: 'algo-gid-1',
        cid: 'algo-cid-1',
        name: 'Algorithm 1',
        modelType: ['classification'],
        version: '1.0.0',
        author: 'Author 1',
        description: 'Algorithm 1 Description',
        tags: ['tag1', 'tag2'],
        requireGroundTruth: true,
        language: 'python',
        script: 'script1',
        module_name: 'module1',
        inputSchema: {
          title: 'Input Schema',
          description: 'Input Schema Description',
          type: 'object',
          required: ['input1'],
          properties: {},
        },
        outputSchema: {
          title: 'Output Schema',
          description: 'Output Schema Description',
          type: 'object',
          required: ['output1'],
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
              description: 'Results description',
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
        zip_hash: 'hash1',
      },
    ],
    inputBlocksOnReport: [
      {
        gid: 'input-gid-1',
        cid: 'input-cid-1',
        name: 'Input Block 1',
        version: '1.0.0',
        author: 'Author 1',
        description: 'Input Block 1 Description',
        tags: 'tag1',
        group: 'group1',
        groupNumber: 1,
        width: 'full',
        fullScreen: false,
      },
    ],
    gridItemToAlgosMap: {},
    gridItemToInputBlockDatasMap: {},
    currentPage: 0,
    showGrid: true,
    pageTypes: ['grid' as const],
    overflowParents: [null],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock notFound to throw an error as expected
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    // Setup default successful responses
    mockGetProjects.mockResolvedValue({
      data: [mockProject],
      status: 200,
      code: 'SUCCESS',
    } as any);

    mockGetTestModels.mockResolvedValue(mockAllModels);

    mockGetTestResults.mockResolvedValue(mockAllTestResults);

    mockGetAllInputBlockGroups.mockResolvedValue(mockAllInputBlockGroups);

    mockGetInputBlockDatas.mockResolvedValue(mockAllInputBlockDatas);

    mockGetPlugins.mockResolvedValue({
      data: mockPlugins,
      status: 200,
      code: 'SUCCESS',
    } as any);

    mockPopulatePluginsMdxBundles.mockResolvedValue(mockPluginsWithMdx);
    mockTransformProjectOutputToState.mockReturnValue(mockTransformedProject);
  });

  describe('Parameter validation', () => {
    it('should call notFound when projectId is missing', async () => {
      const searchParams = Promise.resolve({ flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when flow is missing', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when both projectId and flow are missing', async () => {
      const searchParams = Promise.resolve({});

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when projectId is empty string', async () => {
      const searchParams = Promise.resolve({ projectId: '', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when flow is empty string', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: '' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe('Project fetching', () => {
    it('should call notFound when getProjects returns error', async () => {
      mockGetProjects.mockResolvedValue({
        message: 'Project not found',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when getProjects returns no data', async () => {
      mockGetProjects.mockResolvedValue({
        data: null,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when getProjects returns empty data array', async () => {
      mockGetProjects.mockResolvedValue({
        data: [],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should successfully fetch project data', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledWith({ ids: ['project-123'] });
        expect(screen.getByTestId('select-data-header')).toBeInTheDocument();
        expect(screen.getByTestId('client-select-data')).toBeInTheDocument();
      });
    });
  });

  describe('Plugin fetching', () => {
    it('should call notFound when getPlugins returns error', async () => {
      mockGetPlugins.mockResolvedValue({
        message: 'Plugins not found',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when getPlugins returns no data', async () => {
      mockGetPlugins.mockResolvedValue({
        data: null,
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when getPlugins returns non-array data', async () => {
      mockGetPlugins.mockResolvedValue({
        data: 'not-an-array',
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should successfully fetch plugins and populate MDX bundles', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(mockGetPlugins).toHaveBeenCalledWith({ groupByPluginId: false });
        expect(mockPopulatePluginsMdxBundles).toHaveBeenCalledWith(mockPlugins);
      });
    });
  });

  describe('Data transformation', () => {
    it('should transform project data correctly', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(mockTransformProjectOutputToState).toHaveBeenCalledWith(mockProject, mockPluginsWithMdx);
      });
    });

    it('should handle project with null testModelId', async () => {
      const projectWithNullModelId = { ...mockProject, testModelId: null };
      mockGetProjects.mockResolvedValue({
        data: [projectWithNullModelId],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Model ID: none')).toBeInTheDocument();
      });
    });

    it('should handle project with string testModelId', async () => {
      const projectWithStringModelId = { ...mockProject, testModelId: '456' as any };
      mockGetProjects.mockResolvedValue({
        data: [projectWithStringModelId],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Model ID: 456')).toBeInTheDocument();
      });
    });

    it('should handle project with non-array testResults', async () => {
      const projectWithNonArrayResults = { ...mockProject, testResults: null as any };
      mockGetProjects.mockResolvedValue({
        data: [projectWithNonArrayResults],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Test Results: 0')).toBeInTheDocument();
      });
    });

    it('should handle project with non-array inputBlocks', async () => {
      const projectWithNonArrayInputBlocks = { ...mockProject, inputBlocks: null as any };
      mockGetProjects.mockResolvedValue({
        data: [projectWithNonArrayInputBlocks],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Input Blocks: 0')).toBeInTheDocument();
      });
    });

    it('should handle testResults with string id', async () => {
      const projectWithStringIds = {
        ...mockProject,
        testResults: [
          { id: '1' as any, gid: 'result-gid-1', cid: 'result-cid-1' },
          { id: '2' as any, gid: 'result-gid-2', cid: 'result-cid-2' },
        ],
      };
      mockGetProjects.mockResolvedValue({
        data: [projectWithStringIds],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Test Results: 2')).toBeInTheDocument();
      });
    });

    it('should handle testResults with missing id', async () => {
      const projectWithMissingIds = {
        ...mockProject,
        testResults: [
          { id: null as any, gid: 'result-gid-1', cid: 'result-cid-1' },
          { id: undefined as any, gid: 'result-gid-2', cid: 'result-cid-2' },
        ],
      };
      mockGetProjects.mockResolvedValue({
        data: [projectWithMissingIds],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Test Results: 2')).toBeInTheDocument();
      });
    });

    it('should handle inputBlocks with string id', async () => {
      const projectWithStringIds = {
        ...mockProject,
        inputBlocks: [
          { id: '1' as any, gid: 'input-gid-1', cid: 'input-cid-1' },
          { id: '2' as any, gid: 'input-gid-2', cid: 'input-cid-2' },
        ],
      };
      mockGetProjects.mockResolvedValue({
        data: [projectWithStringIds],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Input Blocks: 2')).toBeInTheDocument();
      });
    });

    it('should handle inputBlocks with missing id', async () => {
      const projectWithMissingIds = {
        ...mockProject,
        inputBlocks: [
          { id: null as any, gid: 'input-gid-1', cid: 'input-cid-1' },
          { id: undefined as any, gid: 'input-gid-2', cid: 'input-cid-2' },
        ],
      };
      mockGetProjects.mockResolvedValue({
        data: [projectWithMissingIds],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Input Blocks: 2')).toBeInTheDocument();
      });
    });

    it('should handle testResults with missing gid and cid', async () => {
      const projectWithMissingFields = {
        ...mockProject,
        testResults: [
          { id: 1, gid: null, cid: null },
          { id: 2, gid: undefined, cid: undefined },
        ],
      };
      mockGetProjects.mockResolvedValue({
        data: [projectWithMissingFields],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Test Results: 2')).toBeInTheDocument();
      });
    });

    it('should handle inputBlocks with missing gid and cid', async () => {
      const projectWithMissingFields = {
        ...mockProject,
        inputBlocks: [
          { id: 1, gid: null, cid: null },
          { id: 2, gid: undefined, cid: undefined },
        ],
      };
      mockGetProjects.mockResolvedValue({
        data: [projectWithMissingFields],
        status: 200,
        code: 'SUCCESS',
      } as any);

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Initial Input Blocks: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Component rendering', () => {
    it('should render SelectDataHeader with correct updatedAt', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('select-data-header')).toBeInTheDocument();
        expect(screen.getByText('Select Data Header - Updated: 2023-01-02T00:00:00Z')).toBeInTheDocument();
      });
    });

    it('should render ClientSelectData with correct props', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-select-data')).toBeInTheDocument();
        expect(screen.getByText('Client Select Data - Project: project-123, Flow: test-flow')).toBeInTheDocument();
        expect(screen.getByText('Required Algorithms: 1')).toBeInTheDocument();
        expect(screen.getByText('Required Input Blocks: 1')).toBeInTheDocument();
        expect(screen.getByText('All Models: 2')).toBeInTheDocument();
        expect(screen.getByText('All Test Results: 2')).toBeInTheDocument();
        expect(screen.getByText('All Input Block Groups: 2')).toBeInTheDocument();
        expect(screen.getByText('All Input Block Datas: 2')).toBeInTheDocument();
        expect(screen.getByText('Initial Model ID: 123')).toBeInTheDocument();
        expect(screen.getByText('Initial Test Results: 2')).toBeInTheDocument();
        expect(screen.getByText('Initial Input Blocks: 2')).toBeInTheDocument();
      });
    });

    it('should render project info in left pane', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Test Project Description')).toBeInTheDocument();
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });
    });

    it('should have correct CSS classes and structure', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      const { container } = render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        const flexContainer = container.querySelector('.flex');
        expect(flexContainer).toBeInTheDocument();

        const leftPane = container.querySelector('.flex-shrink-0.flex-grow.basis-1\\/5');
        expect(leftPane).toBeInTheDocument();

        const rightPane = container.querySelector('.flex-shrink-0.flex-grow.basis-4\\/5');
        expect(rightPane).toBeInTheDocument();

        const leftPaneContent = container.querySelector('[role="region"][aria-label="Left pane content"]');
        expect(leftPaneContent).toBeInTheDocument();

        const rightPaneContent = container.querySelector('[role="region"][aria-label="Right pane content"]');
        expect(rightPaneContent).toBeInTheDocument();
      });
    });
  });

  describe('Console logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log flow parameter', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('flow', 'test-flow');
      });
    });

    it('should log project data', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Project data:', {
          testModelId: 123,
          testResults: mockProject.testResults,
          inputBlocks: mockProject.inputBlocks,
        });
      });
    });

    it('should log transformed project', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Transformed project:', mockTransformedProject);
      });
    });

    it('should log transformed data', async () => {
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Transformed data:', {
          initialModelId: '123',
          initialTestResults: [
            { id: 1, gid: 'result-gid-1', cid: 'result-cid-1' },
            { id: 2, gid: 'result-gid-2', cid: 'result-cid-2' },
          ],
          initialInputBlocks: [
            { id: 1, gid: 'input-gid-1', cid: 'input-cid-1' },
            { id: 2, gid: 'input-gid-2', cid: 'input-cid-2' },
          ],
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockGetTestModels.mockRejectedValue(new Error('API Error'));

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('API Error');
    });

    it('should handle multiple API errors', async () => {
      mockGetTestResults.mockRejectedValue(new Error('Test Results API Error'));
      mockGetAllInputBlockGroups.mockRejectedValue(new Error('Input Block Groups API Error'));

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      await expect(SelectDataPage({ searchParams })).rejects.toThrow('Test Results API Error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty transformed project data', async () => {
      mockTransformProjectOutputToState.mockReturnValue({
        layouts: [[]],
        widgets: [[]],
        algorithmsOnReport: [],
        inputBlocksOnReport: [],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid' as const],
        overflowParents: [null],
      });

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Required Algorithms: 0')).toBeInTheDocument();
        expect(screen.getByText('Required Input Blocks: 0')).toBeInTheDocument();
      });
    });

    it('should handle undefined transformed project data', async () => {
      mockTransformProjectOutputToState.mockReturnValue({
        layouts: [[]],
        widgets: [[]],
        algorithmsOnReport: undefined as any,
        inputBlocksOnReport: undefined as any,
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid' as const],
        overflowParents: [null],
      });

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Required Algorithms: 0')).toBeInTheDocument();
        expect(screen.getByText('Required Input Blocks: 0')).toBeInTheDocument();
      });
    });

    it('should handle null transformed project data', async () => {
      mockTransformProjectOutputToState.mockReturnValue({
        layouts: [[]],
        widgets: [[]],
        algorithmsOnReport: null as any,
        inputBlocksOnReport: null as any,
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid' as const],
        overflowParents: [null],
      });

      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'test-flow' });

      render(await SelectDataPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByText('Required Algorithms: 0')).toBeInTheDocument();
        expect(screen.getByText('Required Input Blocks: 0')).toBeInTheDocument();
      });
    });
  });
}); 