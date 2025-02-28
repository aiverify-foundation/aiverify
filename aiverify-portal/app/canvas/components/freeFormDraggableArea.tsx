import { MouseEvent } from 'react';
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
  return (
    <section className="relative flex h-full w-full flex-1 flex-col gap-2">
      <div
        id="freeFormArea"
        ref={ref}
        className="custom-scrollbar relative h-full cursor-grab overflow-auto bg-slate-100"
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}>
        <div
          id="contentWrapper"
          className="flex min-w-[3000px] justify-center transition-all duration-200 ease-out"
          style={{
            minHeight: contentWrapperMinHeight,
            paddingTop: pagesLength === 1 ? 'auto' : `${CONTAINER_PAD}px`,
            alignItems: pagesLength === 1 ? 'center' : 'flex-start',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            willChange: 'transform',
            touchAction: 'pan-x pan-y',
            contain: 'content',
          }}>
          {children}
        </div>
      </div>
    </section>
  );
}

export { FreeFormDraggableArea };
