'use client';
import { useEffect, useRef } from 'react';

interface DragToScrollOptions {
  speedMultiplier?: number;
}

export function useDragToScroll(
  containerRef: React.RefObject<HTMLDivElement | null>,
  excludeRef?: React.RefObject<HTMLElement | null>,
  options: DragToScrollOptions = {}
) {
  const { speedMultiplier = 1.5 } = options;

  // Use only refs, no state at all
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  // Store event handlers in refs so we can reference them in cleanup
  const handlersRef = useRef({
    handleMouseDown: null as ((e: MouseEvent) => void) | null,
    handleMouseMove: null as ((e: MouseEvent) => void) | null,
    handleMouseUp: null as ((e: MouseEvent) => void) | null,
  });

  // Set up all event handlers via a single effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Define handlers that close over the refs
    const handleMouseDown = (e: MouseEvent) => {
      if (!container) return;

      // Check if we should exclude this target
      if (excludeRef?.current?.contains(e.target as Node)) return;

      // Check if the click originated from a grid item or its children
      // This prevents conflicting with GridLayout drag/resize operations
      const target = e.target as HTMLElement;
      if (
        target.closest('.grid-comp-wrapper') ||
        target.closest('.react-resizable-handle')
      ) {
        return;
      }

      isDraggingRef.current = true;
      startXRef.current = e.pageX - container.offsetLeft;
      startYRef.current = e.pageY - container.offsetTop;
      scrollLeftRef.current = container.scrollLeft;
      scrollTopRef.current = container.scrollTop;

      /* Warning: The below simple cursor grabbing pointer codes is nice but it 
      invalidates css tree causing browser to be janky when dragging. So don't use it.
      leaving it here for future reference.
      */
      // container.style.cursor = 'grabbing';
      // container.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !container) return;

      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const walkX = (x - startXRef.current) * speedMultiplier;
      const walkY = (y - startYRef.current) * speedMultiplier;

      container.scrollLeft = scrollLeftRef.current - walkX;
      container.scrollTop = scrollTopRef.current - walkY;
    };

    const handleMouseUp = () => {
      if (!container) return;
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      /* Warning: The below simple cursor grabbing pointer codes is nice but it 
      invalidates css tree causing browser to be janky when dragging. So don't use it.
      leaving it here for future reference.
      */
      // container.style.cursor = 'grab';
      // container.style.removeProperty('user-select');
    };

    // Store handlers in ref for cleanup
    handlersRef.current = {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    };

    // Attach event listeners directly to DOM
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    // Clean up
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [containerRef, excludeRef, speedMultiplier]);

  return {
    // Return only the isDraggingRef for checking status
    // No event handlers are returned since they're attached directly
    isDraggingRef,
  };
}
