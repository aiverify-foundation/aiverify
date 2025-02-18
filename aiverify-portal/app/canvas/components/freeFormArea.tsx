import { MouseEvent } from "react";
import { CONTAINER_PAD } from "./dimensionsConstants";

type FreeFormAreaProps = {
  ref: React.RefObject<HTMLDivElement | null>;
  pagesLength: number;
  zoomLevel: number;
  contentWrapperMinHeight: number;
  children: React.ReactNode;
  onMouseDown: ((e: MouseEvent) => void) | undefined;
  onMouseUp: (() => void) | undefined;
  onMouseMove: ((e: MouseEvent) => void) | undefined;
  onMouseLeave: (() => void) | undefined;
};

function FreeFormArea(props: FreeFormAreaProps) {
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
  return <section className="relative flex h-full w-full flex-1 flex-col gap-2">
    <div
      id="freeFormArea"
      ref={ref}
      className="custom-scrollbar relative h-full cursor-grab overflow-auto bg-slate-100 active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}>
      <div
        id="contentWrapper"
        className="flex min-w-[6000px] justify-center transition-all duration-200 ease-out"
        style={{
          minHeight: contentWrapperMinHeight,
          paddingTop:
            pagesLength === 1 ? 'auto' : `${CONTAINER_PAD * zoomLevel}px`,
          alignItems: pagesLength === 1 ? 'center' : 'flex-start',
        }}>
        <div
          id="pagesWrapper"
          className="flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  </section>;
}

export { FreeFormArea };
