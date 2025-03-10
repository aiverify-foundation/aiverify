'use client';
import { MouseEvent, useState } from 'react';
import { CONTAINER_PAD } from './dimensionsConstants';

type FreeFormDraggableAreaProps = {
  ref: React.RefObject<HTMLDivElement | null>;
  pagesLength: number;
  zoomLevel: number;
  contentWrapperMinHeight: number;
  children: React.ReactNode;
  onMouseDown?: ((e: MouseEvent) => void) | undefined;
  onMouseUp?: (() => void) | undefined;
  onMouseMove?: ((e: MouseEvent) => void) | undefined;
  onMouseLeave?: (() => void) | undefined;
};

function FreeFormDraggableArea(props: FreeFormDraggableAreaProps) {
  const {
    pagesLength,
    zoomLevel,
    contentWrapperMinHeight,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onMouseLeave,
    children,
    ref,
  } = props;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.react-grid-item') ||
      target.closest('.grid-comp-wrapper')
    ) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onMouseDown?.(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
    onMouseMove?.(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onMouseUp?.();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    onMouseLeave?.();
  };

  return (
    <section className="relative flex h-full w-full flex-1 flex-col gap-2">
      <div
        id="freeFormArea"
        ref={ref}
        className="custom-scrollbar relative h-full cursor-grab overflow-auto bg-slate-100"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}>
        <div
          id="contentWrapper"
          className="flex w-full justify-center transition-all duration-200 ease-out"
          style={{
            minHeight: contentWrapperMinHeight,
            paddingTop: pagesLength === 1 ? 'auto' : `${CONTAINER_PAD}px`,
            alignItems: pagesLength === 1 ? 'center' : 'flex-start',
            transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center',
            willChange: 'transform',
            touchAction: 'none',
            contain: 'none',
            width: '100%',
            maxWidth: '100%',
            overflow: 'visible',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}>
          {children}
        </div>
      </div>
    </section>
  );
}

export { FreeFormDraggableArea };
