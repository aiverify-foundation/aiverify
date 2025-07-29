import { renderHook } from '@testing-library/react';
import { useDragToScroll } from '../useDragToScroll';

describe('useDragToScroll', () => {
  let containerRef: React.RefObject<HTMLDivElement>;
  let excludeRef: React.RefObject<HTMLElement>;

  beforeEach(() => {
    containerRef = { current: document.createElement('div') };
    excludeRef = { current: document.createElement('div') };
    
    // Mock container properties
    Object.defineProperty(containerRef.current, 'offsetLeft', { value: 0 });
    Object.defineProperty(containerRef.current, 'offsetTop', { value: 0 });
    Object.defineProperty(containerRef.current, 'scrollLeft', { value: 0, writable: true });
    Object.defineProperty(containerRef.current, 'scrollTop', { value: 0, writable: true });
  });

  it('returns isDraggingRef', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    expect(result.current.isDraggingRef).toBeDefined();
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('handles mouse down event', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });

    // Mock pageX and pageY properties
    Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
    Object.defineProperty(mouseDownEvent, 'pageY', { value: 100 });

    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(true);
  });

  it('handles mouse move event when dragging', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    // Start dragging
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
    Object.defineProperty(mouseDownEvent, 'pageY', { value: 100 });
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(true);
    
    // Move mouse
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150,
    });
    Object.defineProperty(mouseMoveEvent, 'pageX', { value: 150 });
    Object.defineProperty(mouseMoveEvent, 'pageY', { value: 150 });
    window.dispatchEvent(mouseMoveEvent);
    
    expect(containerRef.current?.scrollLeft).toBe(-75);
    expect(containerRef.current?.scrollTop).toBe(-75);
  });

  it('handles mouse up event', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    // Start dragging
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
    Object.defineProperty(mouseDownEvent, 'pageY', { value: 100 });
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(true);
    
    // Stop dragging
    const mouseUpEvent = new MouseEvent('mouseup');
    window.dispatchEvent(mouseUpEvent);
    
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('handles mouse leave event', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    // Start dragging
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
    Object.defineProperty(mouseDownEvent, 'pageY', { value: 100 });
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(true);
    
    // Mouse leave
    const mouseLeaveEvent = new MouseEvent('mouseleave');
    containerRef.current?.dispatchEvent(mouseLeaveEvent);
    
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('excludes elements from dragging', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef, excludeRef));
    
    // Mock excludeRef to contain the target
    const targetElement = document.createElement('div');
    excludeRef.current = targetElement;
    
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    
    // Mock the target to be inside excludeRef
    Object.defineProperty(mouseDownEvent, 'target', { value: targetElement });
    
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('excludes grid items from dragging', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    // Create a target element that is a grid item
    const gridItem = document.createElement('div');
    gridItem.className = 'grid-comp-wrapper';
    
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    
    // Mock the target to be a grid item
    Object.defineProperty(mouseDownEvent, 'target', { value: gridItem });
    
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('excludes resize handles from dragging', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef));
    
    // Create a target element that is a resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'react-resizable-handle';
    
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    
    // Mock the target to be a resize handle
    Object.defineProperty(mouseDownEvent, 'target', { value: resizeHandle });
    
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('handles custom speed multiplier', () => {
    const { result } = renderHook(() => useDragToScroll(containerRef, undefined, { speedMultiplier: 2 }));
    
    // Start dragging
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
    Object.defineProperty(mouseDownEvent, 'pageY', { value: 100 });
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    // Move mouse
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150,
    });
    Object.defineProperty(mouseMoveEvent, 'pageX', { value: 150 });
    Object.defineProperty(mouseMoveEvent, 'pageY', { value: 150 });
    window.dispatchEvent(mouseMoveEvent);
    
    // With speedMultiplier of 2, the scroll should be doubled
    expect(containerRef.current?.scrollLeft).toBe(-100);
    expect(containerRef.current?.scrollTop).toBe(-100);
  });

  it('does not move when not dragging', () => {
    renderHook(() => useDragToScroll(containerRef));
    
    // Move mouse without starting drag
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150,
    });
    window.dispatchEvent(mouseMoveEvent);
    
    expect(containerRef.current?.scrollLeft).toBe(0);
    expect(containerRef.current?.scrollTop).toBe(0);
  });

  it('handles null container ref', () => {
    const nullRef = { current: null };
    const { result } = renderHook(() => useDragToScroll(nullRef));
    
    expect(result.current.isDraggingRef).toBeDefined();
    expect(result.current.isDraggingRef.current).toBe(false);
  });

  it('prevents default on mouse move when dragging', () => {
    renderHook(() => useDragToScroll(containerRef));
    
    // Start dragging
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });
    Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
    Object.defineProperty(mouseDownEvent, 'pageY', { value: 100 });
    containerRef.current?.dispatchEvent(mouseDownEvent);
    
    // Move mouse
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150,
    });
    
    const preventDefaultSpy = jest.spyOn(mouseMoveEvent, 'preventDefault');
    window.dispatchEvent(mouseMoveEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
}); 