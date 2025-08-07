import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '../useAutosave';
import { debouncedSaveStateToDatabase } from '@/app/canvas/utils/saveStateToDatabase';
import { State } from '../pagesDesignReducer';

// Mock dependencies
jest.mock('@/app/canvas/utils/saveStateToDatabase');

const mockDebouncedSaveStateToDatabase = debouncedSaveStateToDatabase as jest.MockedFunction<typeof debouncedSaveStateToDatabase>;

describe('useAutosave', () => {
  const mockState: State = {
    layouts: [[{ i: '1', x: 0, y: 0, w: 1, h: 1 }]],
    widgets: [[{
      cid: 'test-widget',
      gid: 'test-plugin',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
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
      mdx: {
        code: 'test code',
        frontmatter: {},
      },
      gridItemId: 'grid-item-1',
    }]],
    pageTypes: ['grid'],
    overflowParents: [null],
    algorithmsOnReport: [],
    inputBlocksOnReport: [],
    gridItemToAlgosMap: {},
    gridItemToInputBlockDatasMap: {},
    currentPage: 0,
    showGrid: true,
    useRealData: false,
  };

  const mockChangedState: State = {
    ...mockState,
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call debouncedSaveStateToDatabase when state changes', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // Change state
    rerender({ state: mockChangedState });

    expect(mockDebouncedSaveStateToDatabase).toHaveBeenCalledWith(mockChangedState);
  });

  it('should not call debouncedSaveStateToDatabase when state is the same', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // Rerender with same state
    rerender({ state: mockState });

    expect(mockDebouncedSaveStateToDatabase).not.toHaveBeenCalled();
  });

  it('should not call debouncedSaveStateToDatabase on initial render', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    expect(mockDebouncedSaveStateToDatabase).not.toHaveBeenCalled();
  });

  it('should handle debouncedSaveStateToDatabase throwing an error', () => {
    const error = new Error('Save failed');
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {
      throw error;
    });

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // Change state to trigger save
    rerender({ state: mockChangedState });

    expect(console.error).toHaveBeenCalledWith('Failed to save state:', error);
  });

  it('should handle multiple save failures and retry', () => {
    const error = new Error('Save failed');
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {
      throw error;
    });

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // First failure
    rerender({ state: mockChangedState });
    expect(console.error).toHaveBeenCalledWith('Failed to save state:', error);
    expect(console.warn).toHaveBeenCalledWith('Save attempt failed. Retrying...');

    // Second failure
    rerender({ state: { ...mockChangedState, currentPage: 2 } });
    expect(console.warn).toHaveBeenCalledWith('Save attempt failed. Retrying...');

    // Third failure (max attempts reached)
    rerender({ state: { ...mockChangedState, currentPage: 3 } });
    expect(console.error).toHaveBeenCalledWith('Max save attempts reached. Please try again or contact support.');
  });

  it('should reset save attempts on successful save', () => {
    let shouldThrow = true;
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {
      if (shouldThrow) {
        throw new Error('Save failed');
      }
    });

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // First failure
    rerender({ state: mockChangedState });
    expect(console.warn).toHaveBeenCalledWith('Save attempt failed. Retrying...');

    // Successful save
    shouldThrow = false;
    rerender({ state: { ...mockChangedState, currentPage: 2 } });

    // Next failure should start from attempt 1 again
    shouldThrow = true;
    rerender({ state: { ...mockChangedState, currentPage: 3 } });
    expect(console.warn).toHaveBeenCalledWith('Save attempt failed. Retrying...');
  });

  it('should handle state with different object references but same content', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // Create new state object with same content
    const sameContentState: State = {
      ...mockState,
      layouts: [[{ i: '1', x: 0, y: 0, w: 1, h: 1 }]],
      widgets: [[{
        cid: 'test-widget',
        gid: 'test-plugin',
        name: 'Test Widget',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Description',
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
        mdx: {
          code: 'test code',
          frontmatter: {},
        },
        gridItemId: 'grid-item-1',
      }]],
      pageTypes: ['grid' as const],
      overflowParents: [null],
      algorithmsOnReport: [],
      inputBlocksOnReport: [],
      gridItemToAlgosMap: {},
      gridItemToInputBlockDatasMap: {},
      currentPage: 0,
      showGrid: true,
      useRealData: false,
    };

    rerender({ state: sameContentState });

    expect(mockDebouncedSaveStateToDatabase).not.toHaveBeenCalled();
  });

  it('should handle state with deeply nested changes', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: mockState },
    });

    // Change deeply nested property
    const stateWithNestedChange = {
      ...mockState,
      widgets: [[{
        ...mockState.widgets[0][0],
        mdx: {
          code: 'modified test code',
          frontmatter: { modified: true },
        },
      }]],
    };

    rerender({ state: stateWithNestedChange });

    expect(mockDebouncedSaveStateToDatabase).toHaveBeenCalledWith(stateWithNestedChange);
  });

  it('should handle empty state', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    const emptyState: State = {
      layouts: [],
      widgets: [],
      pageTypes: [],
      overflowParents: [],
      algorithmsOnReport: [],
      inputBlocksOnReport: [],
      gridItemToAlgosMap: {},
      gridItemToInputBlockDatasMap: {},
      currentPage: 0,
      showGrid: true,
      useRealData: false,
    };

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: emptyState },
    });

    // Change to non-empty state
    rerender({ state: mockState });

    expect(mockDebouncedSaveStateToDatabase).toHaveBeenCalledWith(mockState);
  });

  it('should handle null state values', () => {
    mockDebouncedSaveStateToDatabase.mockImplementation(() => {});

    const stateWithNulls: State = {
      layouts: [[{ i: '1', x: 0, y: 0, w: 1, h: 1 }]],
      widgets: [[{
        cid: 'test-widget',
        gid: 'test-plugin',
        name: 'Test Widget',
        version: null,
        author: null,
        description: null,
        widgetSize: {
          minW: 1,
          minH: 1,
          maxW: 12,
          maxH: 12,
        },
        properties: null,
        tags: null,
        dependencies: [],
        mockdata: null,
        dynamicHeight: false,
        mdx: {
          code: 'test code',
          frontmatter: {},
        },
        gridItemId: 'grid-item-1',
      }]],
      pageTypes: ['grid'],
      overflowParents: [null],
      algorithmsOnReport: [],
      inputBlocksOnReport: [],
      gridItemToAlgosMap: {},
      gridItemToInputBlockDatasMap: {},
      currentPage: 0,
      showGrid: true,
      useRealData: false,
    };

    const { rerender } = renderHook(({ state }) => useAutosave(state), {
      initialProps: { state: stateWithNulls },
    });

    // Change state
    const changedStateWithNulls = {
      ...stateWithNulls,
      currentPage: 1,
    };

    rerender({ state: changedStateWithNulls });

    expect(mockDebouncedSaveStateToDatabase).toHaveBeenCalledWith(changedStateWithNulls);
  });
}); 