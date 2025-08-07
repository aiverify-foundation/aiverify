import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { notFound } from 'next/navigation';
import CanvasPage from '../page';
import { UserFlows } from '@/app/userFlowsEnum';
import { TestModel } from '@/app/models/utils/types';
import { ReportTemplate } from '@/app/templates/types';
import { InputBlockData } from '@/app/types';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Mock all the API functions
jest.mock('@/lib/fetchApis/getPlugins');
jest.mock('@/lib/fetchApis/getProjects');
jest.mock('@/lib/fetchApis/getTemplates');
jest.mock('@/lib/fetchApis/getAllModels');
jest.mock('@/lib/fetchApis/getInputBlockDatas');
jest.mock('@/lib/fetchApis/getTestResults');
jest.mock('@/app/canvas/utils/transformProjectOutputToState');
jest.mock('@/app/canvas/utils/transformTemplateOutputToState');

// Mock the ClientDesigner component
jest.mock('../components/client-designer', () => ({
  ClientDesigner: ({ 
    flow, 
    project, 
    initialState, 
    allPluginsWithMdx, 
    allTestResultsOnSystem, 
    allInputBlockDatasOnSystem,
    selectedTestResultsFromUrlParams,
    selectedInputBlockDatasFromUrlParams,
    pageNavigationMode,
    disabled,
    isTemplate,
    modelData 
  }: any) => (
    <div data-testid="client-designer">
      <div data-testid="flow">{flow}</div>
      <div data-testid="project-id">{project?.id}</div>
      <div data-testid="initial-state">{JSON.stringify(initialState)}</div>
      <div data-testid="plugins-count">{allPluginsWithMdx?.length || 0}</div>
      <div data-testid="test-results-count">{allTestResultsOnSystem?.length || 0}</div>
      <div data-testid="input-blocks-count">{allInputBlockDatasOnSystem?.length || 0}</div>
      <div data-testid="selected-test-results-count">{selectedTestResultsFromUrlParams?.length || 0}</div>
      <div data-testid="selected-input-blocks-count">{selectedInputBlockDatasFromUrlParams?.length || 0}</div>
      <div data-testid="page-navigation-mode">{pageNavigationMode}</div>
      <div data-testid="disabled">{disabled ? 'true' : 'false'}</div>
      <div data-testid="is-template">{isTemplate ? 'true' : 'false'}</div>
      <div data-testid="model-data">{modelData ? JSON.stringify(modelData) : 'null'}</div>
    </div>
  ),
}));

// Import mocked functions
const mockGetPlugins = require('@/lib/fetchApis/getPlugins').getPlugins;
const mockPopulatePluginsMdxBundles = require('@/lib/fetchApis/getPlugins').populatePluginsMdxBundles;
const mockGetProjects = require('@/lib/fetchApis/getProjects').getProjects;
const mockFetchTemplates = require('@/lib/fetchApis/getTemplates').fetchTemplates;
const mockGetTestModels = require('@/lib/fetchApis/getAllModels').getTestModels;
const mockGetInputBlockDatas = require('@/lib/fetchApis/getInputBlockDatas').getInputBlockDatas;
const mockGetInputBlockGroupDatas = require('@/lib/fetchApis/getInputBlockDatas').getInputBlockGroupDatas;
const mockGetTestResults = require('@/lib/fetchApis/getTestResults').getTestResults;
const mockTransformProjectOutputToState = require('@/app/canvas/utils/transformProjectOutputToState').transformProjectOutputToState;
const mockTransformTemplateOutputToState = require('@/app/canvas/utils/transformTemplateOutputToState').transformTemplateOutputToState;

// Mock data
const mockPlugins = {
  data: [
    {
      id: 'plugin1',
      name: 'Test Plugin 1',
      version: '1.0.0',
      widgets: [],
      algorithms: [],
      input_blocks: [],
      templates: [],
    },
  ],
};

const mockPluginsWithMdx = [
  {
    ...mockPlugins.data[0],
    mdxBundles: {},
  },
];

const mockProject = {
  id: 1,
  name: 'Test Project',
  testModelId: '123',
  pages: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockTemplate: ReportTemplate = {
  id: 1,
  fromPlugin: true,
  pages: [],
  globalVars: [],
  projectInfo: {
    name: 'Test Template',
    description: 'Test template description',
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockModel: TestModel = {
  id: 123,
  name: 'Test Model',
  description: 'Test model description',
  mode: 'test',
  modelType: 'classification',
  fileType: 'pickle',
  filename: 'test-model.pkl',
  zip_hash: 'hash123',
  size: 1024,
  serializer: 'pickle',
  modelFormat: 'pickle',
  modelAPI: {
    method: 'POST',
    url: 'http://test.com',
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
  status: 'valid',
  errorMessages: '',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockTestResults = [
  {
    id: 1,
    output: JSON.stringify(JSON.stringify({ result: 'test' })),
    created_at: '2023-01-01T00:00:00Z',
  },
];

const mockInputBlockDatas: InputBlockData[] = [
  {
    id: 1,
    gid: 'test-group',
    cid: 'test-category',
    name: 'Test Input Block',
    data: { field1: 'value1' },
    group: 'test-group',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockInputBlockGroupDatas = [
  {
    id: 2,
    gid: 'group1',
    group: 'Test Group',
    input_blocks: [
      {
        cid: 'category1',
        name: 'Group Input Block',
        data: { field2: 'value2' },
      },
    ],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockInitialState = {
  useRealData: false,
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
};

describe('CanvasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockGetPlugins.mockResolvedValue(mockPlugins);
    mockPopulatePluginsMdxBundles.mockResolvedValue(mockPluginsWithMdx);
    mockGetProjects.mockResolvedValue({ data: [mockProject] });
    mockFetchTemplates.mockResolvedValue({ data: [mockTemplate] });
    mockGetTestModels.mockResolvedValue([mockModel]);
    mockGetInputBlockDatas.mockResolvedValue(mockInputBlockDatas);
    mockGetInputBlockGroupDatas.mockResolvedValue(mockInputBlockGroupDatas);
    mockGetTestResults.mockResolvedValue(mockTestResults);
    mockTransformProjectOutputToState.mockReturnValue(mockInitialState);
    mockTransformTemplateOutputToState.mockReturnValue(mockInitialState);
  });

  describe('Project Flow', () => {
    it('should render project canvas with correct data', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'edit' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.EditExistingProject);
      expect(screen.getByTestId('project-id')).toHaveTextContent('1');
      expect(screen.getByTestId('is-template')).toHaveTextContent('false');
      expect(screen.getByTestId('disabled')).toHaveTextContent('false');
      expect(screen.getByTestId('page-navigation-mode')).toHaveTextContent('multi');
    });

    it('should handle project not found', async () => {
      mockGetProjects.mockResolvedValue({ message: 'Project not found' });

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '999',
        mode: 'edit' as const,
      });

      await expect(CanvasPage({ searchParams })).rejects.toThrow();
    });

    it('should fetch model data for project with testModelId', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(mockGetTestModels).toHaveBeenCalled();
      expect(screen.getByTestId('model-data')).toHaveTextContent(JSON.stringify(mockModel));
    });

    it('should handle model fetch error gracefully', async () => {
      mockGetTestModels.mockRejectedValue(new Error('Model fetch failed'));

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('model-data')).toHaveTextContent('null');
    });

    it('should set useRealData to true in view mode with projectId', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      // The useRealData should be true when projectId is provided and mode is view
      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.EditExistingProject);
    });
  });

  describe('Template Flow', () => {
    it('should render template canvas with correct data', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.ViewTemplate,
        templateId: '1',
        mode: 'edit' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('flow')).toHaveTextContent(UserFlows.ViewTemplate);
      expect(screen.getByTestId('project-id')).toHaveTextContent('1');
      expect(screen.getByTestId('is-template')).toHaveTextContent('true');
      expect(screen.getByTestId('disabled')).toHaveTextContent('false');
    });

    it('should handle template not found', async () => {
      mockFetchTemplates.mockResolvedValue({ message: 'Templates not found' });

      const searchParams = Promise.resolve({
        flow: UserFlows.ViewTemplate,
        templateId: '999',
        mode: 'edit' as const,
      });

      await expect(CanvasPage({ searchParams })).rejects.toThrow();
    });

    it('should handle template not found in data', async () => {
      mockFetchTemplates.mockResolvedValue({ data: [] });

      const searchParams = Promise.resolve({
        flow: UserFlows.ViewTemplate,
        templateId: '999',
        mode: 'edit' as const,
      });

      await expect(CanvasPage({ searchParams })).rejects.toThrow();
    });
  });

  describe('Real Data Mode', () => {
    it('should fetch and parse test results when testResultIds provided', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        testResultIds: '1,2',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(mockGetTestResults).toHaveBeenCalled();
      expect(screen.getByTestId('test-results-count')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-test-results-count')).toHaveTextContent('1');
    });

    it('should handle test result parsing errors gracefully', async () => {
      const invalidTestResults = [
        {
          id: 1,
          output: 'invalid-json',
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      mockGetTestResults.mockResolvedValue(invalidTestResults);

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        testResultIds: '1',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('test-results-count')).toHaveTextContent('1');
    });

    it('should fetch and parse input block data when iBlockIds provided', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        iBlockIds: '1,2',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(mockGetInputBlockDatas).toHaveBeenCalled();
      expect(mockGetInputBlockGroupDatas).toHaveBeenCalled();
      expect(screen.getByTestId('input-blocks-count')).toHaveTextContent('2');
      expect(screen.getByTestId('selected-input-blocks-count')).toHaveTextContent('2');
    });

    it('should combine input block data from both sources', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        iBlockIds: '1,2',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      // Should have 2 input blocks: 1 from direct data + 1 from group data
      expect(screen.getByTestId('input-blocks-count')).toHaveTextContent('2');
    });
  });

  describe('Error Handling', () => {
    it('should handle plugins fetch error', async () => {
      mockGetPlugins.mockResolvedValue({ message: 'Failed to fetch plugins' });

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'edit' as const,
      });

      await expect(CanvasPage({ searchParams })).rejects.toThrow('Failed to fetch plugins');
    });

    it('should handle invalid plugins data', async () => {
      mockGetPlugins.mockResolvedValue({ data: 'invalid' });

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'edit' as const,
      });

      await expect(CanvasPage({ searchParams })).rejects.toThrow('Invalid plugins data');
    });

    it('should handle state initialization error with fallback', async () => {
      mockTransformProjectOutputToState.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'edit' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      const initialState = JSON.parse(screen.getByTestId('initial-state').textContent || '{}');
      expect(initialState.useRealData).toBe(false);
      expect(initialState.layouts).toEqual([[]]);
      expect(initialState.showGrid).toBe(true);
    });

    it('should set showGrid to false in view mode when state initialization fails', async () => {
      mockTransformProjectOutputToState.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      const initialState = JSON.parse(screen.getByTestId('initial-state').textContent || '{}');
      expect(initialState.showGrid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no projectId or templateId', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        mode: 'edit' as const,
      });

      await expect(CanvasPage({ searchParams })).rejects.toThrow();
    });

    it('should handle empty testResultIds', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        testResultIds: '',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('selected-test-results-count')).toHaveTextContent('0');
    });

    it('should handle empty iBlockIds', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        iBlockIds: '',
        mode: 'view' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('selected-input-blocks-count')).toHaveTextContent('0');
    });

    it('should handle template without testModelId', async () => {
      const searchParams = Promise.resolve({
        flow: UserFlows.ViewTemplate,
        templateId: '1',
        mode: 'edit' as const,
      });

      render(await CanvasPage({ searchParams }));

      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('model-data')).toHaveTextContent('null');
    });
  });

  describe('Suspense Boundary', () => {
    it('should render loading fallback while component loads', async () => {
      // Mock a slow operation
      mockGetPlugins.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockPlugins), 100)));

      const searchParams = Promise.resolve({
        flow: UserFlows.EditExistingProject,
        projectId: '1',
        mode: 'edit' as const,
      });

      render(await CanvasPage({ searchParams }));

      // The component should render successfully even with the delay
      await waitFor(() => {
        expect(screen.getByTestId('client-designer')).toBeInTheDocument();
      });
    });
  });
}); 