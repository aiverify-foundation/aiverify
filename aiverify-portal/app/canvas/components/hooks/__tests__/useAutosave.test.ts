import { renderHook } from '@testing-library/react';
import { useAutosave } from '../useAutosave';
import { debouncedSaveStateToDatabase } from '@/app/canvas/utils/saveStateToDatabase';
import { State } from '../pagesDesignReducer';

// Mock the debounced save function
jest.mock('@/app/canvas/utils/saveStateToDatabase', () => ({
  debouncedSaveStateToDatabase: jest.fn(),
}));

const mockDebouncedSave = debouncedSaveStateToDatabase as jest.MockedFunction<typeof debouncedSaveStateToDatabase>;

describe('useAutosave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockState: State = {
    layouts: [[]],
    widgets: [[]],
    algorithmsOnReport: [],
    gridItemToAlgosMap: {},
    gridItemToInputBlockDatasMap: {},
    currentPage: 0,
    showGrid: true,
    pageTypes: ['grid'],
    overflowParents: [null],
    inputBlocksOnReport: [],
    useRealData: false,
  };

  it('should not save on initial render', () => {
    renderHook(() => useAutosave(mockState));

    expect(mockDebouncedSave).not.toHaveBeenCalled();
  });

  it('should not save when state has not changed', () => {
    const { rerender } = renderHook(() => useAutosave(mockState));

    // Rerender with the same state
    rerender();

    expect(mockDebouncedSave).not.toHaveBeenCalled();
  });

  it('should save when state has changed', async () => {
    // Create a component that uses the hook and can change state
    const { result, rerender } = renderHook(
      ({ state }) => useAutosave(state),
      { initialProps: { state: mockState } }
    );

    // Change the state
    const newState: State = {
      ...mockState,
      currentPage: 1,
    };

    // Re-render with new state
    rerender({ state: newState });

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockDebouncedSave).toHaveBeenCalledWith(newState);
    expect(mockDebouncedSave).toHaveBeenCalledTimes(1);
  });

  it('should save when layouts have changed', async () => {
    const { result, rerender } = renderHook(
      ({ state }) => useAutosave(state),
      { initialProps: { state: mockState } }
    );

    const newState: State = {
      ...mockState,
      layouts: [[], []],
      widgets: [[], []],
      pageTypes: ['grid', 'grid'],
      overflowParents: [null, null],
    };

    // Re-render with new state
    rerender({ state: newState });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockDebouncedSave).toHaveBeenCalledWith(newState);
  });

  it('should save when widgets have changed', async () => {
    const { result, rerender } = renderHook(
      ({ state }) => useAutosave(state),
      { initialProps: { state: mockState } }
    );

    const newState: State = {
      ...mockState,
      widgets: [[{ gridItemId: 'test-widget' } as any]],
    };

    // Re-render with new state
    rerender({ state: newState });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockDebouncedSave).toHaveBeenCalledWith(newState);
  });

  it('should handle deep state changes', async () => {
    const { rerender } = renderHook(
      ({ state }) => useAutosave(state),
      { initialProps: { state: mockState } }
    );

    const newState: State = {
      ...mockState,
      layouts: [[{ i: 'widget-1', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1, maxW: 12, maxH: 12 }]],
      gridItemToAlgosMap: {
        'widget-1': [{ gid: 'test-plugin', cid: 'test-algo', testResultId: 1 }],
      },
    };

    rerender({ state: newState });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockDebouncedSave).toHaveBeenCalledWith(newState);
  });

  it('should handle complex nested state changes', async () => {
    const { rerender } = renderHook(
      ({ state }) => useAutosave(state),
      { initialProps: { state: mockState } }
    );

    const newState: State = {
      ...mockState,
      layouts: [[], []],
      widgets: [[], []],
      pageTypes: ['grid', 'overflow'],
      overflowParents: [null, 0],
      algorithmsOnReport: [{ gid: 'test-plugin', cid: 'test-algo' } as any],
      inputBlocksOnReport: [{ gid: 'test-plugin', cid: 'test-input' } as any],
      useRealData: true,
    };

    rerender({ state: newState });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockDebouncedSave).toHaveBeenCalledWith(newState);
  });
}); 