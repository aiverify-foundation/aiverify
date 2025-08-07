import { renderHook, act } from '@testing-library/react';
import { useZoom } from '../useZoom';

describe('useZoom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default zoom level of 1', () => {
    const { result } = renderHook(() => useZoom());

    expect(result.current.zoomLevel).toBeCloseTo(1, 10);
    expect(typeof result.current.zoomIn).toBe('function');
    expect(typeof result.current.zoomOut).toBe('function');
    expect(typeof result.current.resetZoom).toBe('function');
  });

  it('should zoom in by 0.15 when zoomIn is called', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);
  });

  it('should zoom out by 0.15 when zoomOut is called', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBeCloseTo(0.85, 10);
  });

  it('should reset zoom to 1 when resetZoom is called', () => {
    const { result } = renderHook(() => useZoom());

    // First zoom in
    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);

    // Then reset
    act(() => {
      result.current.resetZoom();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1, 10);
  });

  it('should not zoom in beyond maximum zoom level (2.0)', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom in multiple times to reach maximum
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.zoomIn();
      }
    });

    expect(result.current.zoomLevel).toBe(2.0);

    // Try to zoom in again
    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBe(2.0);
  });

  it('should not zoom out below minimum zoom level (0.25)', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom out multiple times to reach minimum
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.zoomOut();
      }
    });

    expect(result.current.zoomLevel).toBe(0.25);

    // Try to zoom out again
    act(() => {
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBe(0.25);
  });

  it('should handle multiple zoom in operations', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomIn();
      result.current.zoomIn();
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1.45, 10);
  });

  it('should handle multiple zoom out operations', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomOut();
      result.current.zoomOut();
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBeCloseTo(0.55, 10);
  });

  it('should handle mixed zoom operations', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomIn();
      result.current.zoomOut();
      result.current.zoomIn();
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1, 10);
  });

  it('should handle zoom operations after reset', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom in first
    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);

    // Reset
    act(() => {
      result.current.resetZoom();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1, 10);

    // Zoom out after reset
    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBeCloseTo(0.85, 10);
  });

  it('should handle zoom operations near maximum limit', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom in to get close to maximum
    act(() => {
      for (let i = 0; i < 6; i++) {
        result.current.zoomIn();
      }
    });

    expect(result.current.zoomLevel).toBeCloseTo(1.9, 10);

    // One more zoom in should reach maximum
    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBe(2.0);
  });

  it('should handle zoom operations near minimum limit', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom out to get close to minimum
    act(() => {
      for (let i = 0; i < 4; i++) {
        result.current.zoomOut();
      }
    });

    expect(result.current.zoomLevel).toBeCloseTo(0.4, 10);

    // One more zoom out should reach minimum
    act(() => {
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBe(0.25);
  });

  it('should handle rapid zoom operations', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      // Rapid zoom in and out
      result.current.zoomIn();
      result.current.zoomIn();
      result.current.zoomOut();
      result.current.zoomIn();
      result.current.zoomOut();
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1.0, 10);
  });

  it('should maintain zoom level between renders', () => {
    const { result, rerender } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);

    // Rerender the hook
    rerender();

    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);
  });

  it('should handle zoom operations in sequence', () => {
    const { result } = renderHook(() => useZoom());

    const expectedLevels = [1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.0, 2.0];

    expectedLevels.forEach((expectedLevel, index) => {
      if (index > 0) {
        act(() => {
          result.current.zoomIn();
        });
      }
      if (expectedLevel === 1 || expectedLevel === 2.0) {
        expect(result.current.zoomLevel).toBe(expectedLevel);
      } else {
        expect(result.current.zoomLevel).toBeCloseTo(expectedLevel, 10);
      }
    });
  });

  it('should handle zoom out operations in sequence', () => {
    const { result } = renderHook(() => useZoom());

    const expectedLevels = [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.25];

    expectedLevels.forEach((expectedLevel, index) => {
      if (index > 0) {
        act(() => {
          result.current.zoomOut();
        });
      }
      if (expectedLevel === 1 || expectedLevel === 0.25) {
        expect(result.current.zoomLevel).toBe(expectedLevel);
      } else {
        expect(result.current.zoomLevel).toBeCloseTo(expectedLevel, 10);
      }
    });
  });

  it('should handle reset after reaching maximum zoom', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom to maximum
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.zoomIn();
      }
    });

    expect(result.current.zoomLevel).toBe(2.0);

    // Reset
    act(() => {
      result.current.resetZoom();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1, 10);
  });

  it('should handle reset after reaching minimum zoom', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom to minimum
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.zoomOut();
      }
    });

    expect(result.current.zoomLevel).toBe(0.25);

    // Reset
    act(() => {
      result.current.resetZoom();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1, 10);
  });

  it('should handle multiple resets', () => {
    const { result } = renderHook(() => useZoom());

    // Zoom in
    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);

    // Reset
    act(() => {
      result.current.resetZoom();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1, 10);

    // Zoom out
    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBeCloseTo(0.85, 10);

    // Reset again
    act(() => {
      result.current.resetZoom();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1, 10);
  });

  it('should handle zoom operations with decimal precision', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.3, 10);

    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);
  });

  it('should handle edge case of zooming in exactly to maximum', () => {
    const { result } = renderHook(() => useZoom());

    // Calculate how many zoom ins needed to reach exactly 2.0
    // Starting from 1.0, each zoom in adds 0.15
    // (2.0 - 1.0) / 0.15 = 6.67, so 7 zoom ins will reach 2.0
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.zoomIn();
      }
    });

    expect(result.current.zoomLevel).toBe(2.0);
  });

  it('should handle edge case of zooming out exactly to minimum', () => {
    const { result } = renderHook(() => useZoom());

    // Calculate how many zoom outs needed to reach exactly 0.25
    // Starting from 1.0, each zoom out subtracts 0.15
    // (1.0 - 0.25) / 0.15 = 5, so 5 zoom outs will reach 0.25
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.zoomOut();
      }
    });

    expect(result.current.zoomLevel).toBe(0.25);
  });

  it('should handle zoom operations after multiple resets', () => {
    const { result } = renderHook(() => useZoom());

    // Perform a series of zoom operations and resets
    act(() => {
      result.current.zoomIn();
      result.current.zoomIn();
      result.current.resetZoom();
      result.current.zoomOut();
      result.current.zoomOut();
      result.current.resetZoom();
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBeCloseTo(1.15, 10);
  });

  it('should maintain function references between renders', () => {
    const { result, rerender } = renderHook(() => useZoom());

    const initialZoomIn = result.current.zoomIn;
    const initialZoomOut = result.current.zoomOut;
    const initialResetZoom = result.current.resetZoom;

    rerender();

    expect(result.current.zoomIn).toBe(initialZoomIn);
    expect(result.current.zoomOut).toBe(initialZoomOut);
    expect(result.current.resetZoom).toBe(initialResetZoom);
  });
}); 