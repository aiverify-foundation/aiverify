import { renderHook } from '@testing-library/react';
import { useDragToScroll } from '../useDragToScroll';

describe('useDragToScroll', () => {
  it('should return isDraggingRef', () => {
    const containerRef = { current: null };
    const { result } = renderHook(() => useDragToScroll(containerRef));

    expect(result.current.isDraggingRef).toBeDefined();
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('should handle null container ref', () => {
    const nullRef = { current: null };
    const { result } = renderHook(() => useDragToScroll(nullRef));

    expect(result.current.isDraggingRef).toBeDefined();
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('should handle null exclude ref', () => {
    const containerRef = { current: null };
    const nullExcludeRef = { current: null };
    const { result } = renderHook(() => useDragToScroll(containerRef, nullExcludeRef));

    expect(result.current.isDraggingRef).toBeDefined();
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('should handle custom speed multiplier', () => {
    const containerRef = { current: null };
    const { result } = renderHook(() => useDragToScroll(containerRef, undefined, { speedMultiplier: 2.0 }));

    expect(result.current.isDraggingRef).toBeDefined();
    expect(result.current.isDraggingRef.current).toBe(false);
  });
}); 