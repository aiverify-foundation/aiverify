import { renderHook, act } from '@testing-library/react';
import { useCanvasState } from '../useCanvasState';
import { getProjectIdAndFlowFromUrl } from '@/app/canvas/utils/saveStateToDatabase';
import { clearSessionStorage } from '@/app/canvas/utils/sessionStorage';
import { State, initialState } from '../pagesDesignReducer';

// Mock the dependencies
jest.mock('@/app/canvas/utils/saveStateToDatabase', () => ({
  getProjectIdAndFlowFromUrl: jest.fn(),
  debouncedSaveStateToDatabase: jest.fn(),
}));

jest.mock('@/app/canvas/utils/sessionStorage', () => ({
  clearSessionStorage: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockGetProjectIdAndFlowFromUrl = getProjectIdAndFlowFromUrl as jest.MockedFunction<typeof getProjectIdAndFlowFromUrl>;
const mockClearSessionStorage = clearSessionStorage as jest.MockedFunction<typeof clearSessionStorage>;

describe('useCanvasState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjectIdAndFlowFromUrl.mockReturnValue({ projectId: null, flow: null });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCanvasState());

    expect(result.current.state).toEqual(initialState);
    expect(typeof result.current.dispatch).toBe('function');
    expect(typeof result.current.navigateToNextStep).toBe('function');
  });

  it('should initialize with custom initial state', () => {
    const customState: State = {
      ...initialState,
      currentPage: 1,
      showGrid: false,
    };

    const { result } = renderHook(() => useCanvasState(customState));

    expect(result.current.state).toEqual(customState);
  });

  it('should dispatch actions and update state', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'TOGGLE_GRID' });
    });

    expect(result.current.state.showGrid).toBe(false);
  });

  it('should handle multiple state changes', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'TOGGLE_GRID' });
      result.current.dispatch({ type: 'ADD_NEW_PAGE' });
    });

    expect(result.current.state.showGrid).toBe(false);
    expect(result.current.state.layouts).toHaveLength(2);
    expect(result.current.state.currentPage).toBe(1);
  });

  it('should handle complex state changes', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'ADD_NEW_PAGE' });
      result.current.dispatch({ type: 'SET_CURRENT_PAGE', pageIndex: 1 });
      result.current.dispatch({ type: 'TOGGLE_GRID' });
    });

    expect(result.current.state.layouts).toHaveLength(2);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.showGrid).toBe(false);
  });

  it('should handle widget operations', () => {
    const { result } = renderHook(() => useCanvasState());

    const mockLayout = {
      i: 'widget-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    };

    const mockWidget = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    act(() => {
      result.current.dispatch({
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: mockLayout,
        widget: mockWidget,
        gridItemAlgosMap: undefined,
        gridItemInputBlockDatasMap: undefined,
        algorithms: [],
        inputBlocks: [],
        pageIndex: 0,
      });
    });

    expect(result.current.state.layouts[0]).toHaveLength(1);
    expect(result.current.state.widgets[0]).toHaveLength(1);
    expect(result.current.state.layouts[0][0]).toEqual(mockLayout);
    expect(result.current.state.widgets[0][0]).toEqual(mockWidget);
  });

  it('should handle page operations', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'ADD_NEW_PAGE' });
      result.current.dispatch({ type: 'ADD_NEW_PAGE' });
    });

    expect(result.current.state.layouts).toHaveLength(3);
    expect(result.current.state.widgets).toHaveLength(3);
    expect(result.current.state.pageTypes).toHaveLength(3);
    expect(result.current.state.overflowParents).toHaveLength(3);
    expect(result.current.state.currentPage).toBe(2);
  });

  it('should handle overflow page operations', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'ADD_OVERFLOW_PAGES', parentPageIndex: 0, count: 2 });
    });

    expect(result.current.state.pageTypes).toEqual(['grid', 'overflow', 'overflow']);
    expect(result.current.state.overflowParents).toEqual([null, 0, 0]);
  });

  it('should handle overflow page removal', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'ADD_OVERFLOW_PAGES', parentPageIndex: 0, count: 2 });
      result.current.dispatch({ type: 'REMOVE_OVERFLOW_PAGES', parentPageIndex: 0 });
    });

    expect(result.current.state.layouts).toHaveLength(1);
    expect(result.current.state.pageTypes).toEqual(['grid']);
    expect(result.current.state.overflowParents).toEqual([null]);
  });

  it('should handle page deletion', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'ADD_NEW_PAGE' });
      result.current.dispatch({ type: 'DELETE_PAGE', pageIndex: 0 });
    });

    expect(result.current.state.layouts).toHaveLength(1);
    expect(result.current.state.widgets).toHaveLength(1);
    expect(result.current.state.pageTypes).toHaveLength(1);
    expect(result.current.state.overflowParents).toHaveLength(1);
    expect(result.current.state.currentPage).toBe(0);
  });

  it('should handle widget deletion', () => {
    const { result } = renderHook(() => useCanvasState());

    const mockLayout = {
      i: 'widget-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    };

    const mockWidget = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    act(() => {
      result.current.dispatch({
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: mockLayout,
        widget: mockWidget,
        gridItemAlgosMap: undefined,
        gridItemInputBlockDatasMap: undefined,
        algorithms: [],
        inputBlocks: [],
        pageIndex: 0,
      });
      result.current.dispatch({ type: 'DELETE_WIDGET_FROM_CANVAS', index: 0, pageIndex: 0 });
    });

    expect(result.current.state.layouts[0]).toHaveLength(0);
    expect(result.current.state.widgets[0]).toHaveLength(0);
  });

  it('should handle widget updates', () => {
    const { result } = renderHook(() => useCanvasState());

    const mockWidget = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    const updatedWidget = {
      ...mockWidget,
      name: 'Updated Widget',
      description: 'Updated description',
    };

    act(() => {
      result.current.dispatch({
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: { i: 'widget-1', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1, maxW: 12, maxH: 12 },
        widget: mockWidget,
        gridItemAlgosMap: undefined,
        gridItemInputBlockDatasMap: undefined,
        algorithms: [],
        inputBlocks: [],
        pageIndex: 0,
      });
      result.current.dispatch({ type: 'UPDATE_WIDGET', widget: updatedWidget, pageIndex: 0 });
    });

    expect(result.current.state.widgets[0][0]).toEqual(updatedWidget);
  });

  it('should handle algorithm tracker updates', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_ALGO_TRACKER',
        gridItemAlgosMap: [
          { gid: 'test-plugin', cid: 'test-algo', testResultId: 1 },
        ],
      });
    });

    // The state should remain unchanged since there are no widgets to update
    expect(result.current.state).toEqual(initialState);
  });

  it('should handle input block tracker updates', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_INPUT_BLOCK_TRACKER',
        gridItemInputBlockDatasMap: [
          { gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 },
        ],
      });
    });

    // The state should remain unchanged since there are no widgets to update
    expect(result.current.state).toEqual(initialState);
  });

  it('should handle page type conversion', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({
        type: 'CONVERT_PAGES_TO_OVERFLOW',
        pageTypes: ['grid', 'overflow', 'overflow'],
        overflowParents: [null, 0, 0],
      });
    });

    expect(result.current.state.pageTypes).toEqual(['grid', 'overflow', 'overflow']);
    expect(result.current.state.overflowParents).toEqual([null, 0, 0]);
  });

  it('should handle page reset with overflow', () => {
    const { result } = renderHook(() => useCanvasState());

    const newLayouts = [[], []];
    const newWidgets = [[], []];
    const newPageTypes: ('grid' | 'overflow')[] = ['grid', 'overflow'];
    const newOverflowParents = [null, 0];

    act(() => {
      result.current.dispatch({
        type: 'RESET_PAGES_WITH_OVERFLOW',
        pageTypes: newPageTypes,
        overflowParents: newOverflowParents,
        layouts: newLayouts,
        widgets: newWidgets,
      });
    });

    expect(result.current.state.layouts).toEqual(newLayouts);
    expect(result.current.state.widgets).toEqual(newWidgets);
    expect(result.current.state.pageTypes).toEqual(newPageTypes);
    expect(result.current.state.overflowParents).toEqual(newOverflowParents);
  });

  it('should call navigateToNextStep with clearSessionStorage', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.navigateToNextStep('/next-step');
    });

    expect(mockClearSessionStorage).toHaveBeenCalled();
  });

  it('should handle URL synchronization when projectId and flow are present', () => {
    mockGetProjectIdAndFlowFromUrl.mockReturnValue({
      projectId: 'test-project',
      flow: 'test-flow',
    });

    renderHook(() => useCanvasState());

    // The hook should handle URL synchronization internally
    // We can't easily test the router.replace call without more complex mocking
    expect(mockGetProjectIdAndFlowFromUrl).toHaveBeenCalled();
  });

  it('should handle URL synchronization when projectId and flow are null', () => {
    mockGetProjectIdAndFlowFromUrl.mockReturnValue({
      projectId: null,
      flow: null,
    });

    renderHook(() => useCanvasState());

    expect(mockGetProjectIdAndFlowFromUrl).toHaveBeenCalled();
  });

  it('should maintain state consistency across multiple operations', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.dispatch({ type: 'ADD_NEW_PAGE' });
      result.current.dispatch({ type: 'SET_CURRENT_PAGE', pageIndex: 1 });
      result.current.dispatch({ type: 'TOGGLE_GRID' });
      result.current.dispatch({ type: 'ADD_OVERFLOW_PAGES', parentPageIndex: 0, count: 1 });
    });

    expect(result.current.state.layouts).toHaveLength(3);
    expect(result.current.state.widgets).toHaveLength(3);
    expect(result.current.state.pageTypes).toEqual(['grid', 'overflow', 'grid']);
    expect(result.current.state.overflowParents).toEqual([null, 0, null]);
    expect(result.current.state.currentPage).toBe(2);
    expect(result.current.state.showGrid).toBe(false);
  });
}); 