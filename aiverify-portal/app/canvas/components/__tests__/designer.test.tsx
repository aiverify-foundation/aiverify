import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Designer } from '../designer';
import { UserFlows } from '@/app/userFlowsEnum';
import { ProjectOutput } from '@/app/canvas/utils/transformProjectOutputToState';
import { TemplateOutput } from '@/app/canvas/utils/transformTemplateOutputToState';
import { State } from '../hooks/pagesDesignReducer';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock external dependencies
jest.mock('@/app/canvas/utils/saveStateToDatabase', () => ({
  debouncedSaveStateToDatabase: jest.fn(),
  getProjectIdAndFlowFromUrl: jest.fn(() => ({ projectId: '1', flow: 'test' })),
}));

jest.mock('@/app/canvas/utils/saveTemplateToDatabase', () => ({
  debouncedSaveTemplateToDatabase: jest.fn(),
  getTemplateIdFromUrl: jest.fn(() => '1'),
}));

jest.mock('@/lib/fetchApis/getProjects', () => ({
  patchProject: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getTemplates', () => ({
  patchTemplate: jest.fn(),
}));

// Mock custom hooks
jest.mock('../hooks/useCanvasState', () => ({
  useCanvasState: jest.fn(),
}));

jest.mock('../hooks/useDragToScroll', () => ({
  useDragToScroll: jest.fn(),
}));

jest.mock('../hooks/usePrintable', () => ({
  usePrintable: jest.fn(),
}));

jest.mock('../hooks/useZoom', () => ({
  useZoom: jest.fn(),
}));

// Mock utility functions
jest.mock('@/app/canvas/utils/findInputBlockDataByGidAndCid', () => ({
  findInputBlockDataByGidAndCid: jest.fn(() => ({ id: 1, data: { test: 'data' } })),
}));

jest.mock('@/app/canvas/utils/findTestResultByAlgoGidAndCid', () => ({
  findTestResultByAlgoGidAndCid: jest.fn(() => ({ id: 1, output: { test: 'data' } })),
}));

jest.mock('@/app/canvas/utils/findWidgetFromPluginsById', () => ({
  findWidgetFromPluginsById: jest.fn(() => ({ 
    gid: 'test', 
    cid: 'test', 
    name: 'Test Widget',
    widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 }
  })),
}));

jest.mock('@/app/canvas/utils/getWidgetAlgosFromPlugins', () => ({
  getWidgetAlgosFromPlugins: jest.fn(() => []),
}));

jest.mock('@/app/canvas/utils/getWidgetInputBlocksFromPlugins', () => ({
  getWidgetInputBlocksFromPlugins: jest.fn(() => []),
}));

jest.mock('@/app/canvas/utils/isPageContentOverflow', () => ({
  isPageContentOverflow: jest.fn(() => false),
}));

jest.mock('@/app/canvas/utils/populateInitialWidgetResult', () => ({
  populateInitialWidgetResult: jest.fn(() => ({})),
}));

jest.mock('@/app/canvas/utils/transformStateToProjectInput', () => ({
  transformStateToProjectInput: jest.fn(() => ({})),
}));

jest.mock('@/app/canvas/utils/findInputBlockDataById', () => ({
  findInputBlockDataById: jest.fn(() => ({ id: 1, data: { test: 'data' } })),
}));

jest.mock('@/app/canvas/utils/findMockDataByTypeAndCid', () => ({
  findMockDataByTypeAndCid: jest.fn(() => ({ id: 1, data: { test: 'data' } })),
}));

jest.mock('@/app/canvas/utils/findTestResultById', () => ({
  findTestResultById: jest.fn(() => ({ id: 1, output: { test: 'data' } })),
}));

// Mock API functions
jest.mock('@/lib/fetchApis/getProjects', () => ({
  patchProject: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@/lib/fetchApis/getTemplates', () => ({
  patchTemplate: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock hooks
jest.mock('@/app/canvas/components/hooks/useCanvasState', () => ({
  useCanvasState: jest.fn(() => ({
    state: {
      widgets: [[]],
      layouts: [[]],
      globalVars: [],
    },
    dispatch: jest.fn(),
  })),
}));

jest.mock('@/app/canvas/components/hooks/useDragToScroll', () => ({
  useDragToScroll: jest.fn(() => ({
    isDragging: false,
    startDrag: jest.fn(),
    stopDrag: jest.fn(),
  })),
}));

jest.mock('@/app/canvas/components/hooks/usePrintable', () => ({
  usePrintable: jest.fn(() => ({
    isPrintable: false,
    setIsPrintable: jest.fn(),
    print: jest.fn(),
  })),
}));

jest.mock('@/app/canvas/components/hooks/useZoom', () => ({
  useZoom: jest.fn(() => ({
    zoom: 1,
    setZoom: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    resetZoom: jest.fn(),
  })),
}));

// Mock debounced save functions
jest.mock('@/app/canvas/utils/saveStateToDatabase', () => ({
  debouncedSaveStateToDatabase: jest.fn(),
  getProjectIdAndFlowFromUrl: jest.fn(() => ({ projectId: '1', flow: 'test' })),
}));

jest.mock('@/app/canvas/utils/saveTemplateToDatabase', () => ({
  debouncedSaveTemplateToDatabase: jest.fn(),
  getTemplateIdFromUrl: jest.fn(() => '1'),
}));

// Mock components
jest.mock('../header', () => ({
  CanvasHeader: ({ project }: { project: any }) => (
    <div data-testid="canvas-header">{project?.projectInfo?.name}</div>
  ),
}));

jest.mock('../pluginsPanel', () => ({
  PluginsPanel: ({ plugins, onDragStart, onDragEnd }: any) => (
    <div data-testid="plugins-panel">
      <button onClick={() => onDragStart({ 
        gid: 'test-gid', 
        cid: 'test-cid',
        widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 }
      })}>
        Start Drag
      </button>
      <button onClick={onDragEnd}>End Drag</button>
    </div>
  ),
}));

jest.mock('../gridItemComponent', () => ({
  GridItemComponent: ({ widget, onDeleteClick, onEditClick }: any) => (
    <div data-testid={`grid-item-${widget.gridItemId}`}>
      <button onClick={onDeleteClick}>Delete</button>
      <button onClick={() => onEditClick('test-id', document.createElement('div'), widget)}>
        Edit
      </button>
    </div>
  ),
}));

jest.mock('../editingOverlay', () => ({
  EditingOverlay: ({ onClose }: any) => (
    <div data-testid="editing-overlay">
      <button onClick={() => onClose({ gridItemId: 'test-id', properties: [] })}>
        Save
      </button>
    </div>
  ),
}));

jest.mock('../drawers/testResultsDrawer', () => ({
  TestResultsDrawer: ({ onCheckboxClick }: any) => (
    <div data-testid="test-results-drawer">
      <button onClick={() => onCheckboxClick([])}>Select Results</button>
    </div>
  ),
}));

jest.mock('../drawers/inputBlockDatasDrawer', () => ({
  InputBlockDatasDrawer: ({ onCheckboxClick }: any) => (
    <div data-testid="input-block-datas-drawer">
      <button onClick={() => onCheckboxClick([])}>Select Input Blocks</button>
    </div>
  ),
}));

jest.mock('../drawers/reportAlgorithms', () => ({
  ReportAlgorithmsDrawer: ({ algorithms }: any) => (
    <div data-testid="report-algorithms-drawer">
      {algorithms?.length || 0} algorithms
    </div>
  ),
}));

jest.mock('../drawers/reportInputBlocks', () => ({
  ReportInputBlocksDrawer: ({ inputBlocks }: any) => (
    <div data-testid="report-input-blocks-drawer">
      {inputBlocks?.length || 0} input blocks
    </div>
  ),
}));

jest.mock('../drawers/widgetPropertiesDrawer', () => ({
  WidgetPropertiesDrawer: ({ open, setOpen }: any) => (
    <div data-testid="widget-properties-drawer">
      {open && <button onClick={() => setOpen(false)}>Close</button>}
    </div>
  ),
}));

jest.mock('../gridItemContextMenu', () => ({
  GridItemContextMenu: ({ onDeleteClick, onEditClick, onInfoClick }: any) => (
    <div data-testid="grid-item-context-menu">
      <button onClick={onDeleteClick}>Delete</button>
      <button onClick={onEditClick}>Edit</button>
      <button onClick={onInfoClick}>Info</button>
    </div>
  ),
}));

jest.mock('../widgetErrorBoundary', () => ({
  WidgetErrorBoundary: ({ children }: any) => <div data-testid="widget-error-boundary">{children}</div>,
}));

jest.mock('../freeFormDraggableArea', () => ({
  FreeFormDraggableArea: ({ children }: any) => (
    <div data-testid="free-form-draggable-area">{children}</div>
  ),
}));

jest.mock('../gridLines', () => ({
  GridLines: () => <div data-testid="grid-lines" />,
}));

jest.mock('../pageNumber', () => ({
  PageNumber: ({ onDeleteClick }: any) => (
    <div data-testid="page-number">
      <button onClick={onDeleteClick}>Delete Page</button>
    </div>
  ),
}));

jest.mock('../resizeHandle', () => ({
  ResizeHandle: () => <div data-testid="resize-handle" />,
}));

jest.mock('../zoomControl', () => ({
  ZoomControl: ({ onZoomIn, onZoomOut, onZoomReset }: any) => (
    <div data-testid="zoom-control">
      <button onClick={onZoomIn}>Zoom In</button>
      <button onClick={onZoomOut}>Zoom Out</button>
      <button onClick={onZoomReset}>Reset Zoom</button>
    </div>
  ),
}));

jest.mock('../pageNavigation', () => ({
  PageNavigation: ({ onPageChange, onNextPage, onPreviousPage, onAddPage }: any) => (
    <div data-testid="page-navigation">
      <button onClick={() => onPageChange(0)}>Page 1</button>
      <button onClick={onNextPage} data-testid="next-button">Next</button>
      <button onClick={onPreviousPage}>Previous</button>
      <button onClick={onAddPage}>Add Page</button>
    </div>
  ),
}));

jest.mock('@/lib/components/modal/modal', () => ({
  Modal: ({ children, onPrimaryBtnClick, onSecondaryBtnClick, onCloseIconClick }: any) => (
    <div data-testid="modal">
      <div>Edit Project Information</div>
      {children}
      <button onClick={onPrimaryBtnClick} data-testid="modal-primary-btn">
        Primary
      </button>
      <button onClick={onSecondaryBtnClick} data-testid="modal-secondary-btn">
        Secondary
      </button>
      <button onClick={onCloseIconClick} data-testid="modal-close-btn">
        Close
      </button>
    </div>
  ),
}));

jest.mock('@/lib/components/TremurButton', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Mock GridLayout
jest.mock('react-grid-layout', () => ({
  __esModule: true,
  default: ({ children, onDrop, onDragStart, onDragStop, onResizeStop, onResizeStart }: any) => (
    <div data-testid="grid-layout">
      {children}
      <button onClick={() => onDrop([], { x: 0, y: 0 }, { dataTransfer: { getData: () => '{"gid":"test-plugin","cid":"test-widget"}' } })}>
        Drop Widget
      </button>
      <button onClick={() => onDragStart([], {}, { i: 'test-id' })}>Start Drag</button>
      <button onClick={() => onDragStop([], { x: 0, y: 0 }, { x: 1, y: 1, i: 'test-id' })}>Stop Drag</button>
      <button onClick={() => onResizeStop([], {}, { i: 'test-id' })}>Stop Resize</button>
      <button onClick={() => onResizeStart([], {}, { i: 'test-id' })}>Start Resize</button>
    </div>
  ),
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('Designer Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams('mode=edit&testResultIds=1,2&iBlockIds=3,4');

  const mockProject: ProjectOutput = {
    id: 1,
    templateId: 'test-template',
    testModelId: 1,
    inputBlocks: [],
    testResults: [],
    projectInfo: {
      name: 'Test Project',
      description: 'Test Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    pages: [],
    globalVars: [],
  };

  const mockTemplate: TemplateOutput = {
    id: 1,
    fromPlugin: false,
    projectInfo: {
      name: 'Test Template',
      description: 'Test Template Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    pages: [],
    globalVars: [],
  };

  const mockInitialState: State = {
    layouts: [[]],
    widgets: [[]],
    currentPage: 0,
    showGrid: true,
    pageTypes: ['grid'],
    overflowParents: [null],
    algorithmsOnReport: [],
    inputBlocksOnReport: [],
    gridItemToAlgosMap: {},
    gridItemToInputBlockDatasMap: {},
    useRealData: true,
  };

  const mockPlugins = [
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
      widgets: [
        {
          gid: 'test-plugin',
          cid: 'test-widget',
          name: 'Test Widget',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test widget description',
          widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 },
          properties: [],
          tags: 'test, widget',
          dependencies: [],
          mockdata: [],
          dynamicHeight: false,
          mdx: { code: 'export default () => <div>Test</div>', frontmatter: {} },
          gridItemId: 'test-widget-id',
          result: {},
        },
      ],
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
      output: { test: 'data' },
      artifacts: [],
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
  ] as any; // Use type assertion to bypass strict typing for test mocks

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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);

    // Mock useCanvasState
    const { useCanvasState } = require('../hooks/useCanvasState');
    useCanvasState.mockReturnValue({
      state: mockInitialState,
      dispatch: jest.fn(),
      navigateToNextStep: jest.fn(),
    });

    // Mock useZoom
    const { useZoom } = require('../hooks/useZoom');
    useZoom.mockReturnValue({
      zoomLevel: 1,
      resetZoom: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
    });

    // Mock usePrintable
    const { usePrintable } = require('../hooks/usePrintable');
    usePrintable.mockReturnValue({
      print: jest.fn(),
      contentRef: { current: null },
    });

    // Mock useDragToScroll
    const { useDragToScroll } = require('../hooks/useDragToScroll');
    useDragToScroll.mockReturnValue(undefined);
  });

  describe('Rendering', () => {
    it('renders designer with project data', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-panel')).toBeInTheDocument();
      expect(screen.getByTestId('free-form-draggable-area')).toBeInTheDocument();
    });

    it('renders designer with template data', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockTemplate}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          isTemplate={true}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-panel')).toBeInTheDocument();
    });

    it('renders in disabled mode', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          disabled={true}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
      // Should not render plugins panel in disabled mode
      expect(screen.queryByTestId('plugins-panel')).not.toBeInTheDocument();
    });

    it('renders in single page navigation mode', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          pageNavigationMode="single"
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
      expect(screen.getByTestId('free-form-draggable-area')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles widget drop', async () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      // Ensure the mock widget has widgetSize and matches the data transfer
      const widgetWithSize = {
        ...mockPlugins[0].widgets[0],
        gid: 'test-plugin',
        cid: 'test-widget',
        widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 },
      };

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={[{
            ...mockPlugins[0],
            widgets: [widgetWithSize]
          }]}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const dropButton = screen.getByText('Drop Widget');
      fireEvent.click(dropButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('handles grid item drag start', () => {
      // Ensure the mock widget has widgetSize
      const widgetWithSize = {
        ...mockPlugins[0].widgets[0],
        widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 },
      };

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={[{
            ...mockPlugins[0],
            widgets: [widgetWithSize]
          }]}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const dragStartButton = screen.getAllByRole('button', { name: /^Start Drag/ })[0];
      fireEvent.click(dragStartButton);

      // Should not throw any errors
      expect(dragStartButton).toBeInTheDocument();
    });

    it('handles grid item drag stop', async () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const dragStopButton = screen.getByText('Stop Drag');
      fireEvent.click(dragStopButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('handles grid item resize start', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const resizeStartButton = screen.getByText('Start Resize');
      fireEvent.click(resizeStartButton);

      expect(resizeStartButton).toBeInTheDocument();
    });

    it('handles grid item resize stop', async () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const resizeStopButton = screen.getByText('Stop Resize');
      fireEvent.click(resizeStopButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('handles page navigation', () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const pageButton = screen.getByText('Page 1');
      fireEvent.click(pageButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_PAGE',
        pageIndex: 0,
      });
    });

    it('handles next page navigation', () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: { ...mockInitialState, layouts: [[], []], widgets: [[], []] },
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      // Click the PageNavigation's Next button (not the main navigation Next button)
      const pageNavNextButton = screen.getByTestId('next-button');
      fireEvent.click(pageNavNextButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_PAGE',
        pageIndex: 1,
      });
    });

    it('handles previous page navigation', () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: { ...mockInitialState, currentPage: 1 },
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const previousButton = screen.getAllByRole('button', { name: /^Previous/ })[0];
      fireEvent.click(previousButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_PAGE',
        pageIndex: 0,
      });
    });

    it('handles add new page', () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const addPageButton = screen.getByText('Add Page');
      fireEvent.click(addPageButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_NEW_PAGE',
      });
    });

    it('handles delete page', () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: { ...mockInitialState, layouts: [[], []], widgets: [[], []] },
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const deletePageButton = screen.getAllByText('Delete Page')[0];
      fireEvent.click(deletePageButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DELETE_PAGE',
        pageIndex: 0,
      });
    });

    it('handles zoom controls', () => {
      const mockZoomIn = jest.fn();
      const mockZoomOut = jest.fn();
      const mockResetZoom = jest.fn();

      const { useZoom } = require('../hooks/useZoom');
      useZoom.mockReturnValue({
        zoomLevel: 1,
        resetZoom: mockResetZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const zoomInButton = screen.getByText('Zoom In');
      const zoomOutButton = screen.getByText('Zoom Out');
      const resetZoomButton = screen.getByText('Reset Zoom');

      fireEvent.click(zoomInButton);
      fireEvent.click(zoomOutButton);
      fireEvent.click(resetZoomButton);

      expect(mockZoomIn).toHaveBeenCalled();
      expect(mockZoomOut).toHaveBeenCalled();
      expect(mockResetZoom).toHaveBeenCalled();
    });

    it('handles grid toggle', () => {
      const mockDispatch = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: mockDispatch,
        navigateToNextStep: jest.fn(),
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      // Grid toggle button should be present
      expect(screen.getByTitle('Toggle Grid')).toBeInTheDocument();
    });

    it('handles print functionality', () => {
      const mockPrint = jest.fn();
      const { usePrintable } = require('../hooks/usePrintable');
      usePrintable.mockReturnValue({
        print: mockPrint,
        contentRef: { current: null },
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const printButton = screen.getByTitle('Print');
      fireEvent.click(printButton);

      expect(mockPrint).toHaveBeenCalled();
    });

    it('handles save as template', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as jest.Mock;

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const saveButton = screen.getByTitle('Save as Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/projects/saveProjectAsTemplate/${mockProject.id}`,
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('handles export template', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob()),
          headers: {
            get: () => 'attachment; filename=template.zip',
          },
        })
      ) as jest.Mock;

      // Mock URL.createObjectURL and revokeObjectURL
      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockTemplate}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          isTemplate={true}
        />
      );

      const exportButton = screen.getByTitle('Export Template');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/project_templates/export/${mockTemplate.id}`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('handles mode toggle', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockTemplate}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          isTemplate={true}
        />
      );

      const modeToggleButton = screen.getByTitle('Switch to View Mode');
      fireEvent.click(modeToggleButton);

      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('?mode=view&testResultIds=1'));
    });

    it('handles edit project info', async () => {
      const mockPatchProject = require('@/lib/fetchApis/getProjects').patchProject;
      mockPatchProject.mockResolvedValue({ success: true });

      const mockTransformStateToProjectInput = require('@/app/canvas/utils/transformStateToProjectInput').transformStateToProjectInput;
      mockTransformStateToProjectInput.mockReturnValue({
        pages: [],
        projectInfo: { name: 'Test', description: 'Test' },
      });

      const mockGetProjectIdAndFlowFromUrl = require('@/app/canvas/utils/saveStateToDatabase').getProjectIdAndFlowFromUrl;
      mockGetProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-id' });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      // Find and click the edit project info button
      const editButton = screen.getByTitle('Edit project info');
      fireEvent.click(editButton);

      // Modal should be rendered
      expect(screen.getByText('Edit Project Information')).toBeInTheDocument();

      // Fill in the form
      const nameInput = screen.getByLabelText('Name');
      const descriptionInput = screen.getByLabelText('Description');

      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });

      // Save the changes
      const saveButton = screen.getByTestId('modal-primary-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockPatchProject).toHaveBeenCalled();
      });
    });

    it('handles edit template info', async () => {
      const mockPatchTemplate = require('@/lib/fetchApis/getTemplates').patchTemplate;
      mockPatchTemplate.mockResolvedValue({ success: true });

      const mockTransformStateToProjectInput = require('@/app/canvas/utils/transformStateToProjectInput').transformStateToProjectInput;
      mockTransformStateToProjectInput.mockReturnValue({
        pages: [],
        projectInfo: { name: 'Test', description: 'Test' },
      });

      const mockGetTemplateIdFromUrl = require('@/app/canvas/utils/saveTemplateToDatabase').getTemplateIdFromUrl;
      mockGetTemplateIdFromUrl.mockReturnValue({ templateId: 'test-id' });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockTemplate}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          isTemplate={true}
        />
      );

      // Find and click the edit project info button
      const editButton = screen.getByTitle('Edit project info');
      fireEvent.click(editButton);

      // Modal should be rendered
      expect(screen.getByText('Edit Project Information')).toBeInTheDocument();

      // Fill in the form
      const nameInput = screen.getByLabelText('Name');
      const descriptionInput = screen.getByLabelText('Description');

      fireEvent.change(nameInput, { target: { value: 'Updated Template Name' } });
      fireEvent.change(descriptionInput, { target: { value: 'Updated Template Description' } });

      // Save the changes
      const saveButton = screen.getByTestId('modal-primary-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockPatchTemplate).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation and Flow Handling', () => {
    it('handles next step navigation for new project with new template', () => {
      mockUseRouter.mockReturnValue(mockRouter);
      const mockNavigateToNextStep = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: jest.fn(),
        navigateToNextStep: mockNavigateToNextStep,
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      // Find the main navigation Next button by looking for the one that's not in page navigation
      const allNextButtons = screen.getAllByText('Next');
      const mainNextButton = allNextButtons.find(button => {
        const pageNav = button.closest('[data-testid="page-navigation"]');
        return !pageNav;
      });
      fireEvent.click(mainNextButton!);

      expect(mockNavigateToNextStep).toHaveBeenCalledWith(
        `/project/select_data?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=${mockProject.id}`
      );
    });

    it('handles next step navigation for new project with editing existing template', () => {
      mockUseRouter.mockReturnValue(mockRouter);
      const mockNavigateToNextStep = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: jest.fn(),
        navigateToNextStep: mockNavigateToNextStep,
      });

      render(
        <Designer
          flow={UserFlows.NewProjectWithEditingExistingTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      // Find the main navigation Next button by looking for the one that's not in page navigation
      const allNextButtons = screen.getAllByText('Next');
      const mainNextButton = allNextButtons.find(button => {
        const pageNav = button.closest('[data-testid="page-navigation"]');
        return !pageNav;
      });
      fireEvent.click(mainNextButton!);

      expect(mockNavigateToNextStep).toHaveBeenCalledWith(
        `/project/select_data?flow=${UserFlows.NewProjectWithEditingExistingTemplate}&projectId=${mockProject.id}`
      );
    });

    it('handles next step navigation for edit existing project', () => {
      mockUseRouter.mockReturnValue(mockRouter);
      const mockNavigateToNextStep = jest.fn();
      const { useCanvasState } = require('../hooks/useCanvasState');
      useCanvasState.mockReturnValue({
        state: mockInitialState,
        dispatch: jest.fn(),
        navigateToNextStep: mockNavigateToNextStep,
      });

      render(
        <Designer
          flow={UserFlows.EditExistingProject}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      // Find the main navigation Next button by looking for the one that's not in page navigation
      const allNextButtons = screen.getAllByText('Next');
      const mainNextButton = allNextButtons.find(button => {
        const pageNav = button.closest('[data-testid="page-navigation"]');
        return !pageNav;
      });
      fireEvent.click(mainNextButton!);

      expect(mockNavigateToNextStep).toHaveBeenCalledWith(
        `/project/select_data?flow=${UserFlows.EditExistingProject}&projectId=${mockProject.id}`
      );
    });

    it('shows back button for result flows', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplateAndResults}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          selectedTestResultsFromUrlParams={mockTestResults}
          selectedInputBlockDatasFromUrlParams={mockInputBlockDatas}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('shows next button for non-result flows', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      expect(screen.getAllByRole('button', { name: /^Next/ })[0]).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles save as template error', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const saveButton = screen.getByTitle('Save as Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save project as template. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles edit project info error', async () => {
      const mockPatchProject = require('@/lib/fetchApis/getProjects').patchProject;
      mockPatchProject.mockRejectedValue(new Error('Update failed'));

      const mockTransformStateToProjectInput = require('@/app/canvas/utils/transformStateToProjectInput').transformStateToProjectInput;
      mockTransformStateToProjectInput.mockReturnValue({
        pages: [],
        projectInfo: { name: 'Test', description: 'Test' },
      });

      const mockGetProjectIdAndFlowFromUrl = require('@/app/canvas/utils/saveStateToDatabase').getProjectIdAndFlowFromUrl;
      mockGetProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-id' });

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      const editButton = screen.getByTitle('Edit project info');
      fireEvent.click(editButton);

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const saveButton = screen.getByTestId('modal-primary-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update project information. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty plugins array', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={[]}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
      expect(screen.getByTestId('plugins-panel')).toBeInTheDocument();
    });

    it('handles empty test results', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={[]}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
    });

    it('handles empty input block datas', () => {
      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockProject}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={[]}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
    });

    it('handles template from plugin (skips save)', () => {
      const mockTemplateFromPlugin = {
        ...mockTemplate,
        fromPlugin: true,
      };

      render(
        <Designer
          flow={UserFlows.NewProjectWithNewTemplate}
          project={mockTemplateFromPlugin}
          initialState={mockInitialState}
          allPluginsWithMdx={mockPlugins}
          allTestResultsOnSystem={mockTestResults}
          allInputBlockDatasOnSystem={mockInputBlockDatas}
          isTemplate={true}
        />
      );

      expect(screen.getByTestId('canvas-header')).toBeInTheDocument();
    });
  });
}); 