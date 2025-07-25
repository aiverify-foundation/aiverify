import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    it('renders widget with basic props', () => {
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

    it('renders widget without MDX code', () => {
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

    it('renders widget in disabled mode', () => {
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

    it('renders widget without properties', () => {
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

    it('renders widget with placeholder during dragging', () => {
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

      // When dragging, it should show a placeholder div instead of the widget content
      expect(screen.queryByTestId('widget-error-boundary')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mdx-component')).not.toBeInTheDocument();
      // Should show a placeholder div with gray background
      const gridItemRoot = document.querySelector('.grid-item-root');
      const placeholder = gridItemRoot?.querySelector('.bg-gray-100');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('h-auto', 'w-full', 'bg-gray-100');
    });

    it('renders widget with placeholder during resizing', () => {
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
      expect(screen.queryByTestId('mdx-component')).not.toBeInTheDocument();
      // Should show a placeholder div with gray background
      const gridItemRoot = document.querySelector('.grid-item-root');
      const placeholder = gridItemRoot?.querySelector('.bg-gray-100');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('h-auto', 'w-full', 'bg-gray-100');
    });
  });

  describe('User Interactions', () => {
    it('shows context menu on mouse enter', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

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
      fireEvent.mouseEnter(widgetContainer!);
      expect(screen.getByTestId('grid-item-context-menu')).toBeInTheDocument();

      fireEvent.mouseLeave(widgetContainer!);
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('handles delete click from context menu', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalled();
    });

    it('handles edit click from context menu', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEditClick).toHaveBeenCalledWith('test-widget-id', expect.any(HTMLDivElement), mockWidget);
    });

    it('handles info click from context menu', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      const infoButton = screen.getByText('Info');
      fireEvent.click(infoButton);

      expect(mockOnInfoClick).toHaveBeenCalled();
      expect(screen.getByTestId('widget-properties-drawer')).toBeInTheDocument();
    });

    it('handles widget properties drawer close', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      const infoButton = screen.getByText('Info');
      fireEvent.click(infoButton);

      const closeButton = screen.getByText('Close Drawer');
      fireEvent.click(closeButton);

      expect(mockOnWidgetPropertiesClose).toHaveBeenCalled();
    });

    it('handles delete from properties drawer', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      const infoButton = screen.getByText('Info');
      fireEvent.click(infoButton);

      const deleteButton = screen.getByText('Delete Widget');
      fireEvent.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalled();
    });
  });

  describe('Data Handling', () => {
    it('passes correct properties to MDX component', () => {
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

    it('handles getIBData function', () => {
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
      fireEvent.click(getIBDataButton);

      // The function should be callable without errors
      expect(getIBDataButton).toBeInTheDocument();
    });

    it('handles getResults function', () => {
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
      fireEvent.click(getResultsButton);

      // The function should be callable without errors
      expect(getResultsButton).toBeInTheDocument();
    });

    it('handles getArtifacts function', () => {
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
      fireEvent.click(getArtifactsButton);

      // The function should be callable without errors
      expect(getArtifactsButton).toBeInTheDocument();
    });

    it('handles getArtifactURL function', () => {
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
      fireEvent.click(getArtifactURLButton);

      // The function should be callable without errors
      expect(getArtifactURLButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles widget without gridItemId', () => {
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

    it('handles empty test results used', () => {
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

    it('handles empty input block datas used', () => {
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

    it('handles null model', () => {
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

    it('handles widget with visited data selection', () => {
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

    it('handles useRealData false', () => {
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
  });

  describe('Context Menu Behavior', () => {
    it('prevents context menu from showing in disabled mode', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('hides context menu during dragging', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      expect(screen.queryByTestId('grid-item-context-menu')).not.toBeInTheDocument();
    });

    it('handles context menu hover events', () => {
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
      fireEvent.mouseEnter(widgetContainer!);

      const hoverButton = screen.getByText('Hover');
      fireEvent.mouseEnter(hoverButton);
      fireEvent.mouseLeave(hoverButton);

      // Should not throw any errors
      expect(hoverButton).toBeInTheDocument();
    });
  });
}); 