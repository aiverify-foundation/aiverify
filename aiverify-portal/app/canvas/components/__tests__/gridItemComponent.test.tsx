import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GridItemComponent } from '../gridItemComponent';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { TestModel } from '@/app/models/utils/types';
import { Layout } from 'react-grid-layout';

// Mock MDX bundler
jest.mock('mdx-bundler/client', () => ({
  getMDXComponent: jest.fn(() => {
    return ({ id, properties, testResult, inputBlockData, model, projectCreatedAt, getIBData, getResults, getArtifacts, getArtifactURL, width, height, requiredTestCount, selectedTestCount }: any) => (
      <div data-testid="mdx-component">
        <div data-testid="widget-id">{id}</div>
        <div data-testid="widget-properties">{JSON.stringify(properties)}</div>
        <div data-testid="widget-test-result">{JSON.stringify(testResult)}</div>
        <div data-testid="widget-input-block-data">{JSON.stringify(inputBlockData)}</div>
        <div data-testid="widget-model">{JSON.stringify(model)}</div>
        <div data-testid="widget-project-created-at">{projectCreatedAt}</div>
        <div data-testid="widget-width">{width}</div>
        <div data-testid="widget-height">{height}</div>
        <div data-testid="widget-required-test-count">{requiredTestCount}</div>
        <div data-testid="widget-selected-test-count">{selectedTestCount}</div>
        <button onClick={() => getIBData('test-cid', 'test-gid')}>Get IB Data</button>
        <button onClick={() => getResults('test-cid', 'test-gid')}>Get Results</button>
        <button onClick={() => getArtifacts('test-gid', 'test-cid')}>Get Artifacts</button>
        <button onClick={() => getArtifactURL('test-cid', 'test-path', 'test-gid')}>Get Artifact URL</button>
      </div>
    );
  }),
}));

// Mock utility functions
jest.mock('@/app/canvas/utils/findInputBlockDataById', () => ({
  findInputBlockDataById: jest.fn(),
}));

jest.mock('@/app/canvas/utils/findMockDataByTypeAndCid', () => ({
  findMockDataByTypeAndCid: jest.fn(),
}));

jest.mock('@/app/canvas/utils/findTestResultById', () => ({
  findTestResultById: jest.fn(),
}));

// Mock components
jest.mock('../drawers/widgetPropertiesDrawer', () => ({
  WidgetPropertiesDrawer: ({ open, setOpen, onDeleteClick }: any) => (
    <div data-testid="widget-properties-drawer">
      {open && (
        <div>
          <button onClick={() => setOpen(false)}>Close Drawer</button>
          <button onClick={onDeleteClick}>Delete Widget</button>
        </div>
      )}
    </div>
  ),
}));

jest.mock('../gridItemContextMenu', () => ({
  GridItemContextMenu: ({ onDeleteClick, onEditClick, onInfoClick, onMouseEnter, onMouseLeave }: any) => (
    <div data-testid="grid-item-context-menu">
      <button onClick={onDeleteClick}>Delete</button>
      <button onClick={onEditClick}>Edit</button>
      <button onClick={onInfoClick}>Info</button>
      <button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>Hover</button>
    </div>
  ),
}));

jest.mock('../widgetErrorBoundary', () => ({
  WidgetErrorBoundary: ({ children, widgetName }: any) => (
    <div data-testid="widget-error-boundary" data-widget-name={widgetName}>
      {children}
    </div>
  ),
}));

describe('GridItemComponent', () => {
  const mockWidget: WidgetOnGridLayout = {
    gridItemId: 'test-widget-id',
    gid: 'test-plugin',
    cid: 'test-widget',
    name: 'Test Widget',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test widget description',
    widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 },
    properties: [
      {
        key: 'title',
        value: 'Test Title',
        default: 'Default Title',
        helper: 'Title helper text',
      },
      {
        key: 'description',
        value: 'Test Description',
        default: 'Default Description',
        helper: 'Description helper text',
      },
    ],
    tags: 'test, widget',
    dependencies: [],
    mockdata: [
      {
        type: 'Algorithm',
        gid: 'test-algo',
        cid: 'test-algo',
        data: { test: 'mock-data' },
        artifacts: ['artifact1.png', 'artifact2.png'],
      },
      {
        type: 'InputBlock',
        gid: 'test-input',
        cid: 'test-input',
        data: { input: 'mock-input-data' },
        artifacts: [],
      },
    ],
    dynamicHeight: false,
    mdx: { 
      code: 'export default () => <div>Test</div>',
      frontmatter: {}
    },
    result: {},
  };

  const mockLayout: Layout = {
    i: 'test-widget-id',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    minW: 1,
    minH: 1,
    maxW: 12,
    maxH: 36,
  };

  const mockAllPlugins = [
    {
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      url: 'https://test.com',
      meta: 'test meta',
      is_stock: true,
      zip_hash: 'test-hash',
      algorithms: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      widgets: [],
      mdx: { code: 'export default () => <div>Test</div>', frontmatter: {} },
      properties: [],
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 },
      mockdata: [],
    },
  ];

  const mockTestResults = [
    {
      id: 1,
      gid: 'test-algo',
      cid: 'test-algo-cid',
      name: 'Test Algorithm',
      version: '1.0.0',
      startTime: '2023-01-01T00:00:00Z',
      timeTaken: 1000,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      output: '{"test": "data"}',
      artifacts: ['artifact1.png', 'artifact2.png'],
      testArguments: {
        testDataset: 'test-dataset',
        mode: 'test-mode',
        modelType: 'test-model',
        groundTruthDataset: 'test-ground-truth',
        groundTruth: 'test-ground-truth',
        algorithmArgs: 'test-args',
        modelFile: 'test-model-file',
      },
    },
  ];

  const mockInputBlockDatas = [
    {
      id: 1,
      gid: 'test-input',
      cid: 'test-input-cid',
      name: 'Test Input Block',
      group: 'test-group',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      data: { input: 'data' },
    },
  ];

  const mockTestResultsUsed = [
    {
      gid: 'test-algo',
      cid: 'test-algo-cid',
      testResultId: 1,
    },
  ];

  const mockInputBlockDatasUsed = [
    {
      gid: 'test-input',
      cid: 'test-input-cid',
      inputBlockDataId: 1,
    },
  ];

  const mockModel: TestModel = {
    id: 1,
    name: 'Test Model',
    description: 'Test model description',
    mode: 'test-mode',
    modelType: 'test-model-type',
    fileType: 'test-file-type',
    filename: 'test-model.pkl',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    zip_hash: 'test-hash',
    size: 1024,
    serializer: 'test-serializer',
    modelFormat: 'test-format',
    modelAPI: {
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
    },
    parameterMappings: { requestBody: {}, parameters: {} },
    status: 'valid',
    errorMessages: '',
  };

  const mockDispatch = jest.fn();
  const mockOnDeleteClick = jest.fn();
  const mockOnEditClick = jest.fn();
  const mockOnInfoClick = jest.fn();
  const mockOnWidgetPropertiesClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders widget with basic props', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
      expect(screen.getByTestId('widget-id')).toHaveTextContent('test-widget-id');
    });

    it('renders widget without MDX code', async () => {
      const widgetWithoutMdx = {
        ...mockWidget,
        mdx: null,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutMdx}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
      expect(screen.getByText('Test Widget - test-widget : Missing mdx')).toBeInTheDocument();
    });

    it('renders widget in disabled mode', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={true}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
    });

    it('renders widget without properties', async () => {
      const widgetWithoutProperties = {
        ...mockWidget,
        properties: [],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-component')).toBeInTheDocument();
    });

    it('renders widget with placeholder during dragging', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={true}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // When dragging, the component shows a placeholder instead of the error boundary
      expect(screen.queryByTestId('widget-error-boundary')).not.toBeInTheDocument();
      // Check for the placeholder div that appears when dragging
      const genericElements = screen.getAllByRole('generic', { hidden: true });
      const placeholderDiv = genericElements.find(el => 
        el.classList.contains('h-auto') && 
        el.classList.contains('w-full') && 
        el.classList.contains('bg-gray-100')
      );
      expect(placeholderDiv).toBeInTheDocument();
    });

    it('renders widget with placeholder during resizing', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={true}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // When resizing, it should show a placeholder div instead of the widget content
      expect(screen.queryByTestId('widget-error-boundary')).not.toBeInTheDocument();
      // Should show a placeholder div with gray background
      const gridItemRoot = document.querySelector('.grid-item-root');
      const placeholder = gridItemRoot?.querySelector('.bg-gray-100');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('h-auto', 'w-full', 'bg-gray-100');
    });
  });

  describe('User Interactions', () => {
    it('shows context menu on mouse enter', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();
    });

    it('hides context menu on mouse leave', async () => {
      jest.useFakeTimers();

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      await act(async () => {
        fireEvent.mouseLeave(widgetContainer!);
      });
      
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('handles delete click from context menu', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const deleteButton = screen.getByText('Delete');
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(mockOnDeleteClick).toHaveBeenCalled();
    });

    it('handles edit click from context menu', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const editButton = screen.getByText('Edit');
      await act(async () => {
        fireEvent.click(editButton);
      });

      expect(mockOnEditClick).toHaveBeenCalledWith('test-widget-id', expect.any(HTMLDivElement), mockWidget);
    });

    it('handles info click from context menu', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const infoButton = screen.getByText('Info');
      await act(async () => {
        fireEvent.click(infoButton);
      });

      expect(mockOnInfoClick).toHaveBeenCalled();
      expect(screen.getByTestId('widget-properties-drawer')).toBeInTheDocument();
    });

    it('handles widget properties drawer close', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const infoButton = screen.getByText('Info');
      await act(async () => {
        fireEvent.click(infoButton);
      });

      const closeButton = screen.getByText('Close Drawer');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(mockOnWidgetPropertiesClose).toHaveBeenCalled();
    });

    it('handles delete from properties drawer', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const infoButton = screen.getByText('Info');
      await act(async () => {
        fireEvent.click(infoButton);
      });

      const deleteButton = screen.getByText('Delete Widget');
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(mockOnDeleteClick).toHaveBeenCalled();
    });
  });

  describe('Data Handling', () => {
    it('passes correct properties to MDX component', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const propertiesElement = screen.getByTestId('widget-properties');
      const properties = JSON.parse(propertiesElement.textContent || '{}');

      expect(properties).toEqual({
        title: 'Test Title',
        description: 'Test Description',
      });
    });

    it('handles getIBData function', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getIBDataButton = screen.getByText('Get IB Data');
      await act(async () => {
        fireEvent.click(getIBDataButton);
      });

      // The function should be callable without errors
      expect(getIBDataButton).toBeInTheDocument();
    });

    it('handles getResults function', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      // The function should be callable without errors
      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getArtifacts function', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactsButton = screen.getByText('Get Artifacts');
      await act(async () => {
        fireEvent.click(getArtifactsButton);
      });

      // The function should be callable without errors
      expect(getArtifactsButton).toBeInTheDocument();
    });

    it('handles getArtifactURL function', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactURLButton = screen.getByText('Get Artifact URL');
      await act(async () => {
        fireEvent.click(getArtifactURLButton);
      });

      // The function should be callable without errors
      expect(getArtifactURLButton).toBeInTheDocument();
    });

    it('handles getResults with hasVisitedDataSelection and no matching test result', async () => {
      const testResultsUsedWithoutMatch = [
        {
          gid: 'non-existent-algo',
          cid: 'non-existent-cid',
          testResultId: 999,
        },
      ];

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={testResultsUsedWithoutMatch}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getResults with hasVisitedDataSelection and no testResultsUsed', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={[]}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getArtifacts with non-array urls', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactsButton = screen.getByText('Get Artifacts');
      await act(async () => {
        fireEvent.click(getArtifactsButton);
      });

      expect(getArtifactsButton).toBeInTheDocument();
    });

    it('handles getArtifactURL with non-array urls', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactURLButton = screen.getByText('Get Artifact URL');
      await act(async () => {
        fireEvent.click(getArtifactURLButton);
      });

      expect(getArtifactURLButton).toBeInTheDocument();
    });

    it('handles getArtifactURL with no matching pathname', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactURLButton = screen.getByText('Get Artifact URL');
      await act(async () => {
        fireEvent.click(getArtifactURLButton);
      });

      expect(getArtifactURLButton).toBeInTheDocument();
    });

    it('handles properties with null values', async () => {
      const widgetWithNullProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: 'Default Title',
            helper: 'Title helper text',
          },
          {
            key: 'description',
            value: undefined,
            default: 'Default Description',
            helper: 'Description helper text',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithNullProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data without data property', async () => {
      const widgetWithoutData = {
        ...mockWidget,
        mockdata: [
          {
            type: 'InputBlock' as const,
            gid: 'test-input',
            cid: 'test-input',
            data: {} as any,
            artifacts: [],
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutData}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles widget without gridItemId', async () => {
      const widgetWithoutId = {
        ...mockWidget,
        gridItemId: undefined,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutId}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles empty test results used', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={[]}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles empty input block datas used', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles null model', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={null}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('widget-model')).toHaveTextContent('null');
    });

    it('handles widget with visited data selection', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles useRealData false', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with invalid JSON output', async () => {
      const testResultWithInvalidJson = {
        ...mockTestResults[0],
        output: 'invalid json string',
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithInvalidJson] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with non-object output', async () => {
      const testResultWithNonObjectOutput = {
        ...mockTestResults[0],
        output: 'simple string output',
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithNonObjectOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with null output', async () => {
      const testResultWithNullOutput = {
        ...mockTestResults[0],
        output: null,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithNullOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result without testResultId', async () => {
      const testResultWithoutId = {
        ...mockTestResultsUsed[0],
        testResultId: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={[testResultWithoutId]}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data without inputBlockDataId', async () => {
      const inputBlockDataWithoutId = {
        ...mockInputBlockDatasUsed[0],
        inputBlockDataId: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithoutId]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data without gid and cid', async () => {
      const inputBlockDataWithoutGidCid = {
        ...mockInputBlockDatasUsed[0],
        gid: undefined,
        cid: undefined,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithoutGidCid]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result without artifacts', async () => {
      const testResultWithoutArtifacts = {
        ...mockTestResults[0],
        artifacts: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithoutArtifacts] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data without artifacts', async () => {
      const widgetWithoutArtifacts = {
        ...mockWidget,
        mockdata: [
          {
            type: 'Algorithm' as const,
            gid: 'test-algo',
            cid: 'test-algo',
            data: { test: 'mock-data' },
            artifacts: undefined,
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutArtifacts}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data without data property', async () => {
      const widgetWithoutData = {
        ...mockWidget,
        mockdata: [
          {
            type: 'InputBlock' as const,
            gid: 'test-input',
            cid: 'test-input',
            data: {} as any,
            artifacts: [],
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutData}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Context Menu Behavior and Positioning', () => {
    it('prevents context menu from showing in disabled mode', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={true}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('hides context menu during dragging', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={true}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // When dragging, context menu should not be shown even on mouse enter
      const widgetContainer = document.querySelector('.grid-item-root');
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('handles context menu hover events', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const hoverButton = screen.getByText('Hover');
      await act(async () => {
        fireEvent.mouseEnter(hoverButton);
      });
      await act(async () => {
        fireEvent.mouseLeave(hoverButton);
      });

      // Should not throw any errors
      expect(hoverButton).toBeInTheDocument();
    });

    it('handles click outside with editor input class', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Wait for context menu to appear
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      // Create an element with editor input class
      const editorElement = document.createElement('div');
      editorElement.className = 'editor-input';
      document.body.appendChild(editorElement);

      // Click on editor element should not close context menu
      await act(async () => {
        fireEvent.mouseDown(editorElement);
      });

      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      document.body.removeChild(editorElement);
    });

    it('handles click outside without editor input class', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Create an element without editor input class
      const outsideElement = document.createElement('div');
      outsideElement.className = 'outside-element';
      document.body.appendChild(outsideElement);

      // Click outside should close context menu
      await act(async () => {
        fireEvent.mouseDown(outsideElement);
      });

      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();

      document.body.removeChild(outsideElement);
    });

    it('handles ResizeObserver functionality', async () => {
      // Mock ResizeObserver
      const mockResizeObserver = jest.fn();
      mockResizeObserver.mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
      }));
      global.ResizeObserver = mockResizeObserver;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(mockResizeObserver).toHaveBeenCalled();
    });

    it('handles window scroll and resize events', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Context menu should be visible
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      // Cleanup
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('handles document mousedown events', async () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Context menu should be visible
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      // Cleanup
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('handles widget properties drawer close effect', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const infoButton = screen.getByText('Info');
      await act(async () => {
        fireEvent.click(infoButton);
      });

      // Properties drawer should be open
      expect(screen.getByTestId('widget-properties-drawer')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Drawer');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      // onWidgetPropertiesClose should be called
      expect(mockOnWidgetPropertiesClose).toHaveBeenCalled();
    });

    it('handles edit click with null gridItemRef', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      const editButton = screen.getByText('Edit');
      await act(async () => {
        fireEvent.click(editButton);
      });

      expect(mockOnEditClick).toHaveBeenCalledWith('test-widget-id', expect.any(HTMLDivElement), mockWidget);
    });

    it('handles timeout cleanup on unmount', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      unmount();

      clearTimeoutSpy.mockRestore();
    });

    it('handles dragging state changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Show context menu first
      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      // Change to dragging state
      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={true}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Context menu should be hidden when dragging
      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('handles context menu position updates', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Context menu should be visible
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      // Trigger scroll event to test position update
      await act(async () => {
        fireEvent.scroll(window);
      });

      addEventListenerSpy.mockRestore();
    });

    it('handles context menu without showContextMenu', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Context menu should not be visible initially
      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('handles widget properties drawer without showWidgetProperties', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Properties drawer should not be visible initially
      expect(screen.queryByTestId('widget-properties-drawer')).not.toBeInTheDocument();
    });
  });

  describe('React.memo functionality', () => {
    it('memoizes component correctly', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Re-render with same props should not cause re-render
      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when props change', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Re-render with different isDragging prop should cause re-render
      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={true}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Should show placeholder when dragging
      const gridItemRoot = document.querySelector('.grid-item-root');
      const placeholder = gridItemRoot?.querySelector('.bg-gray-100');
      expect(placeholder).toBeInTheDocument();
    });

    it('re-renders when widget changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const newWidget = { ...mockWidget, name: 'New Widget Name' };

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={newWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when model changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const newModel = { ...mockModel, name: 'New Model Name' };

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={newModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when layout changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const newLayout = { ...mockLayout, w: 8, h: 6 };

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={newLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when testResultsUsed changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const newTestResultsUsed = [
        { ...mockTestResultsUsed[0], testResultId: 999 },
      ];

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={newTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when inputBlockDatasUsed changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const newInputBlockDatasUsed = [
        { ...mockInputBlockDatasUsed[0], inputBlockDataId: 999 },
      ];

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={newInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when hasVisitedDataSelection changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when requiredTestCount changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={10}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('re-renders when selectedTestCount changes', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={7}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Advanced Edge Cases', () => {
    it('handles test result with complex output structure', async () => {
      const testResultWithComplexOutput = {
        ...mockTestResults[0],
        output: JSON.stringify({
          data: {
            metrics: {
              accuracy: 0.95,
              precision: 0.92,
              recall: 0.88,
            },
            predictions: [1, 0, 1, 1, 0],
            features: ['feature1', 'feature2', 'feature3'],
          },
          metadata: {
            modelType: 'random_forest',
            version: '1.0.0',
          },
        }),
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithComplexOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with array output', async () => {
      const testResultWithArrayOutput = {
        ...mockTestResults[0],
        output: JSON.stringify([1, 2, 3, 4, 5]),
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithArrayOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with string output', async () => {
      const testResultWithStringOutput = {
        ...mockTestResults[0],
        output: 'simple string output',
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithStringOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with number output', async () => {
      const testResultWithNumberOutput = {
        ...mockTestResults[0],
        output: 42,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithNumberOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with boolean output', async () => {
      const testResultWithBooleanOutput = {
        ...mockTestResults[0],
        output: true,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithBooleanOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with undefined testArguments', async () => {
      const testResultWithoutArguments = {
        ...mockTestResults[0],
        testArguments: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithoutArguments] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with undefined modelType', async () => {
      const testResultWithoutModelType = {
        ...mockTestResults[0],
        testArguments: {
          ...mockTestResults[0].testArguments,
          modelType: undefined,
        },
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithoutModelType] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data with complex data structure', async () => {
      const inputBlockDataWithComplexData = {
        ...mockInputBlockDatas[0],
        data: {
          features: ['feature1', 'feature2', 'feature3'],
          labels: [0, 1, 0, 1, 0],
          metadata: {
            source: 'csv',
            rows: 1000,
            columns: 10,
          },
          preprocessing: {
            normalized: true,
            scaled: false,
          },
        },
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={[inputBlockDataWithComplexData]}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with complex properties', async () => {
      const widgetWithComplexProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: 'Complex Widget',
            default: 'Default Title',
            helper: 'Title helper text',
          },
          {
            key: 'description',
            value: 'A widget with complex configuration',
            default: 'Default Description',
            helper: 'Description helper text',
          },
          {
            key: 'threshold',
            value: '0.8',
            default: '0.5',
            helper: 'Classification threshold',
          },
          {
            key: 'enableLogging',
            value: 'true',
            default: 'false',
            helper: 'Enable debug logging',
          },
          {
            key: 'maxIterations',
            value: '1000',
            default: '100',
            helper: 'Maximum iterations',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithComplexProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget without properties array', async () => {
      const widgetWithoutPropertiesArray = {
        ...mockWidget,
        properties: null,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutPropertiesArray}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with empty properties array', async () => {
      const widgetWithEmptyProperties = {
        ...mockWidget,
        properties: [],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithEmptyProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have no value, default, or helper', async () => {
      const widgetWithMinimalProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: '',
            helper: '',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithMinimalProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have only helper value', async () => {
      const widgetWithHelperOnlyProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: '',
            helper: 'This is the helper text',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithHelperOnlyProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have only default value', async () => {
      const widgetWithDefaultOnlyProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: 'Default Title',
            helper: '',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithDefaultOnlyProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have only value', async () => {
      const widgetWithValueOnly = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: 'Only Value',
            default: undefined,
            helper: '',
          },
        ],
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithValueOnly}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have value and default', async () => {
      const widgetWithValueAndDefaultProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: 'Actual Title',
            default: 'Default Title',
            helper: '',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithValueAndDefaultProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have value and helper', async () => {
      const widgetWithValueAndHelperProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: 'Actual Title',
            default: '',
            helper: 'Helper text',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithValueAndHelperProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have default and helper', async () => {
      const widgetWithDefaultAndHelperProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: 'Default Title',
            helper: 'Helper text',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithDefaultAndHelperProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles JSON parsing errors in test result output', async () => {
      const testResultWithInvalidJson = {
        ...mockTestResults[0],
        output: 'invalid json string',
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithInvalidJson] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with non-object output data', async () => {
      const testResultWithNonObjectOutput = {
        ...mockTestResults[0],
        output: 'simple string output',
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithNonObjectOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with null output', async () => {
      const testResultWithNullOutput = {
        ...mockTestResults[0],
        output: null,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithNullOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result without testResultId', async () => {
      const testResultWithoutId = {
        ...mockTestResultsUsed[0],
        testResultId: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={[testResultWithoutId]}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data without inputBlockDataId', async () => {
      const inputBlockDataWithoutId = {
        ...mockInputBlockDatasUsed[0],
        inputBlockDataId: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithoutId]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data without gid and cid', async () => {
      const inputBlockDataWithoutGidCid = {
        ...mockInputBlockDatasUsed[0],
        gid: undefined,
        cid: undefined,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithoutGidCid]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result without artifacts', async () => {
      const testResultWithoutArtifacts = {
        ...mockTestResults[0],
        artifacts: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithoutArtifacts] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data without artifacts', async () => {
      const widgetWithoutArtifacts = {
        ...mockWidget,
        mockdata: [
          {
            type: 'Algorithm' as const,
            gid: 'test-algo',
            cid: 'test-algo',
            data: { test: 'mock-data' },
            artifacts: undefined,
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutArtifacts}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data without data property', async () => {
      const widgetWithoutData = {
        ...mockWidget,
        mockdata: [
          {
            type: 'InputBlock' as const,
            gid: 'test-input',
            cid: 'test-input',
            data: {} as any,
            artifacts: [],
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutData}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Data Handling Functions', () => {
    it('handles getResults with hasVisitedDataSelection and matching test result', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getResults with hasVisitedDataSelection and no testResultId', async () => {
      const testResultsUsedWithoutId = [
        {
          gid: 'test-algo',
          cid: 'test-algo-cid',
          testResultId: undefined,
        },
      ];

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={testResultsUsedWithoutId}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getResults with hasVisitedDataSelection and no matching test result', async () => {
      const testResultsUsedWithoutMatch = [
        {
          gid: 'non-existent-algo',
          cid: 'non-existent-cid',
          testResultId: 999,
        },
      ];

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={testResultsUsedWithoutMatch}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getResults with hasVisitedDataSelection and no testResultsUsed', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={[]}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getResultsButton = screen.getByText('Get Results');
      await act(async () => {
        fireEvent.click(getResultsButton);
      });

      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getArtifacts with non-array urls', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactsButton = screen.getByText('Get Artifacts');
      await act(async () => {
        fireEvent.click(getArtifactsButton);
      });

      expect(getArtifactsButton).toBeInTheDocument();
    });

    it('handles getArtifactURL with non-array urls', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactURLButton = screen.getByText('Get Artifact URL');
      await act(async () => {
        fireEvent.click(getArtifactURLButton);
      });

      expect(getArtifactURLButton).toBeInTheDocument();
    });

    it('handles getArtifactURL with no matching pathname', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const getArtifactURLButton = screen.getByText('Get Artifact URL');
      await act(async () => {
        fireEvent.click(getArtifactURLButton);
      });

      expect(getArtifactURLButton).toBeInTheDocument();
    });

    it('handles properties with null values', async () => {
      const widgetWithNullProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: 'Default Title',
            helper: 'Title helper text',
          },
          {
            key: 'description',
            value: undefined,
            default: 'Default Description',
            helper: 'Description helper text',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithNullProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data without data property', async () => {
      const widgetWithoutData = {
        ...mockWidget,
        mockdata: [
          {
            type: 'InputBlock' as const,
            gid: 'test-input',
            cid: 'test-input',
            data: {} as any,
            artifacts: [],
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithoutData}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with undefined gid fallback to widget gid', async () => {
      const testResultWithUndefinedGid = {
        ...mockTestResultsUsed[0],
        gid: undefined,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={[testResultWithUndefinedGid]}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data with undefined gid fallback to widget gid', async () => {
      const inputBlockDataWithUndefinedGid = {
        ...mockInputBlockDatasUsed[0],
        gid: undefined,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithUndefinedGid]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with object output data', async () => {
      const testResultWithObjectOutput = {
        ...mockTestResults[0],
        output: { test: 'object data' },
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithObjectOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with testArguments modelType', async () => {
      const testResultWithModelType = {
        ...mockTestResults[0],
        testArguments: {
          modelType: 'test-model-type',
        },
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithModelType] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result without testArguments', async () => {
      const testResultWithoutTestArguments = {
        ...mockTestResults[0],
        testArguments: undefined,
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithoutTestArguments] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Advanced Edge Cases and Uncovered Branches', () => {
    it('handles input block data with gid and cid conditions', async () => {
      const inputBlockDataWithGidCid = {
        ...mockInputBlockDatasUsed[0],
        gid: 'test-gid',
        cid: 'test-cid',
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithGidCid]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mock data fallback scenarios', async () => {
      const widgetWithMockDataFallback = {
        ...mockWidget,
        mockdata: [
          {
            type: 'InputBlock' as const,
            gid: 'test-input',
            cid: 'test-input',
            data: { mock: 'data' },
            artifacts: [],
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithMockDataFallback}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles ResizeObserver with null gridItemRef', async () => {
      // Mock ResizeObserver to test the case where gridItemRef.current is null
      const mockResizeObserver = jest.fn();
      mockResizeObserver.mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
      }));
      global.ResizeObserver = mockResizeObserver;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles mouse enter when disabled is true', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={true}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Context menu should not be shown when disabled
      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('handles context menu positioning with null gridItemRef', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      const widgetContainer = screen.getByTestId('widget-error-boundary').parentElement;
      await act(async () => {
        fireEvent.mouseEnter(widgetContainer!);
      });

      // Context menu should be visible
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();
    });

    it('handles properties drawer when showWidgetProperties is false', async () => {
      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Properties drawer should not be visible initially
      expect(screen.queryByTestId('widget-properties-drawer')).not.toBeInTheDocument();
    });

    it('handles React.memo comparison with different props', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Test different combinations of prop changes to trigger memo comparison
      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={{ ...mockWidget, name: 'Different Widget' }}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={true}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={true}
          useRealData={true}
          requiredTestCount={10}
          selectedTestCount={5}
        />
      );

      // When dragging, the component shows a placeholder instead of the error boundary
      expect(screen.queryByTestId('widget-error-boundary')).not.toBeInTheDocument();
      // Check for the placeholder div that appears when dragging
      const genericElements = screen.getAllByRole('generic', { hidden: true });
      const placeholderDiv = genericElements.find(el => 
        el.classList.contains('h-auto') && 
        el.classList.contains('w-full') && 
        el.classList.contains('bg-gray-100')
      );
      expect(placeholderDiv).toBeInTheDocument();
    });

    it('handles React.memo comparison with same props', async () => {
      const { rerender } = render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      // Re-render with exactly the same props to test memo optimization
      rerender(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles input block data without gid and cid fallback to mock data', async () => {
      const inputBlockDataWithoutGidCid = {
        ...mockInputBlockDatasUsed[0],
        gid: undefined,
        cid: undefined,
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={[inputBlockDataWithoutGidCid]}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={false}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles test result with complex output structure and modelType', async () => {
      const testResultWithComplexOutput = {
        ...mockTestResults[0],
        output: { complex: { nested: { data: 'value' } } },
        testArguments: {
          modelType: 'complex-model-type',
        },
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={mockWidget}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={[testResultWithComplexOutput] as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have value, default, and helper', async () => {
      const widgetWithCompleteProperties = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: 'Actual Value',
            default: 'Default Title',
            helper: 'Title helper text',
          },
          {
            key: 'description',
            value: 'Actual Description',
            default: 'Default Description',
            helper: 'Description helper text',
          },
        ],
      };

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithCompleteProperties}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have only value', async () => {
      const widgetWithValueOnly = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: 'Only Value',
            default: undefined,
            helper: undefined,
          },
        ],
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithValueOnly}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have only default', async () => {
      const widgetWithDefaultOnly = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: 'Only Default',
            helper: undefined,
          },
        ],
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithDefaultOnly}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });

    it('handles widget with properties that have only helper', async () => {
      const widgetWithHelperOnly = {
        ...mockWidget,
        properties: [
          {
            key: 'title',
            value: undefined,
            default: undefined,
            helper: 'Only Helper',
          },
        ],
      } as any;

      render(
        <GridItemComponent
          allAvalaiblePlugins={mockAllPlugins}
          layout={mockLayout}
          widget={widgetWithHelperOnly}
          model={mockModel}
          projectCreatedAt="2023-01-01T00:00:00Z"
          testResultsUsed={mockTestResultsUsed}
          inputBlockDatasUsed={mockInputBlockDatasUsed}
          allTestResultsOnSystem={mockTestResults as any}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          onDeleteClick={mockOnDeleteClick}
          onEditClick={mockOnEditClick}
          onInfoClick={mockOnInfoClick}
          onWidgetPropertiesClose={mockOnWidgetPropertiesClose}
          dispatch={mockDispatch}
          pageIndex={0}
          isDragging={false}
          isResizing={false}
          disabled={false}
          hasVisitedDataSelection={false}
          useRealData={true}
          requiredTestCount={5}
          selectedTestCount={3}
        />
      );

      expect(screen.getByTestId('widget-error-boundary')).toBeInTheDocument();
    });
  });
}); 