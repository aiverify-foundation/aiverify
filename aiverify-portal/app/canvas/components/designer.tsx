'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import clsx from 'clsx';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { Widget } from '@/app/types';
import { cn } from '@/lib/utils/twmerge';
import { GridItemComponent } from './gridItemComponent';
import { initialState } from './hooks/designReducer';
import { designReducer } from './hooks/designReducer';
import { PlunginsPanel } from './pluginsPanel';
import styles from './styles/designer.module.css';

const GRID_WIDTH = 774;
const GRID_ROW_HEIGHT = 30;
const GRID_MAX_ROWS = 36;
const GRID_STRICT_STYLE: React.CSSProperties = {
  height: '1080px',
  width: '774px',
};

type DesignProps = {
  plugins: PluginForGridLayout[];
};

type EventDataTransfer = Event & {
  dataTransfer: {
    getData: (type: 'application/json') => string;
  };
};

type GridItemDivRequiredStyles = `relative${string}`;
const gridItemDivRequiredStyles: GridItemDivRequiredStyles =
  'relative hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-offset-2';

const widgetItemSchema = z.object({
  gid: z.string(),
  cid: z.string(),
});

export type WidgetCompositeId = z.infer<typeof widgetItemSchema>;

function createGridItemId(widget: Widget) {
  return `${widget.gid}-${widget.cid}-${Date.now()}`;
}

function Designer({ plugins }: DesignProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(designReducer, initialState);
  const [error, setError] = useState<string | undefined>();
  const { layouts, currentPage } = state;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isDraggingFreeFormArea, setIsDraggingFreeFormArea] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingFreeFormArea) {
        handleFreeFormAreaMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingFreeFormArea]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const totalWidth = containerRef.current.scrollWidth;
      const viewportWidth = containerRef.current.clientWidth;
      containerRef.current.scrollLeft = (totalWidth - viewportWidth) / 2;
      containerRef.current.scrollTop = 400;
    }
  }, []);

  function handleFreeFormAreaMouseDown(e: React.MouseEvent) {
    if (!containerRef.current) return;
    if (canvasRef.current?.contains(e.target as Node)) return;

    setIsDraggingFreeFormArea(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);

    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.userSelect = 'none';
  }

  function handleFreeFormAreaMouseUp() {
    if (!containerRef.current) return;

    setIsDraggingFreeFormArea(false);
    containerRef.current.style.cursor = 'grab';
    containerRef.current.style.removeProperty('user-select');
  }

  function handleFreeFormAreaMouseMove(e: React.MouseEvent) {
    if (!isDraggingFreeFormArea || !containerRef.current) return;

    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5; // Adjust multiplier for speed
    const walkY = (y - startY) * 1.5;

    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  }

  function handleWidgetDrop(
    layout: Layout[],
    item: Layout,
    e: EventDataTransfer
  ) {
    const data: unknown = JSON.parse(
      e.dataTransfer.getData('application/json')
    );
    const result = widgetItemSchema.safeParse(data);
    if (!result.success) {
      console.error('Invalid widget item data', result.error);
      setError(result.error?.message);
      return;
    }
    const validData: WidgetCompositeId = result.data;
    const widget = findWidgetFromPluginsById(
      plugins,
      validData.gid,
      validData.cid
    );
    if (!widget) {
      console.error(
        `Widget not found - gid: ${validData.gid} - cid: ${validData.cid}`
      );
      setError(
        `Widget not found - gid: ${validData.gid} - cid: ${validData.cid}`
      );
      return;
    }
    const gridItemId = createGridItemId(widget);
    const { x, y, w, h, minW, minH, maxW, maxH, i } = item;
    const itemLayout = { x, y, w, h, minW, minH, maxW, maxH, i: gridItemId };
    const widgetWithGridItemId: WidgetOnGridLayout = {
      ...widget,
      gridItemId,
    };
    dispatch({
      type: 'ADD_WIDGET_TO_CANVAS',
      itemLayout,
      widget: widgetWithGridItemId,
    });
  }

  function handleGridItemResizeStart(layout: Layout[]) {
    const { i } = layout[0];
    setDraggingId(i);
  }

  function handleGridItemResizeStop(layout: Layout[]) {
    const { x, y, w, h, minW, minH, maxW, maxH, i } = layout[0];
    dispatch({
      type: 'RESIZE_WIDGET',
      itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
    });
    setDraggingId(null);
  }

  function handleGridItemDragStart(layout: Layout[]) {
    const { i } = layout[0];
    setDraggingId(i);
  }

  function handleGridItemDragStop(layout: Layout[]) {
    const { x, y, w, h, minW, minH, maxW, maxH, i } = layout[0];
    dispatch({
      type: 'CHANGE_WIDGET_POSITION',
      itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
    });
    setDraggingId(null);
  }

  function handleDeleteGridItem(index: number) {
    dispatch({
      type: 'DELETE_WIDGET_FROM_CANVAS',
      index,
    });
  }

  return (
    <div className="relative h-full w-full">
      <section className="absolute z-10 flex h-full w-[300px] flex-col bg-secondary-900 p-4">
        <div>
          <h4 className="mb-0 text-lg font-bold">Project Name</h4>
          <p className="text-sm text-white">Project Description</p>
        </div>
        <PlunginsPanel
          plugins={plugins}
          className="custom-scrollbar w-full overflow-auto"
        />
      </section>
      <section className="relative flex h-full w-full flex-1 flex-col gap-2">
        <div className="absolute left-[340px] top-[30px]">
          <h4 className="text-lg font-bold">Design the report</h4>
          <p className="text-sm font-light text-white">
            Drag report widgets from the left panel onto the design canvas
          </p>
        </div>
        <div
          ref={containerRef}
          className="custom-scrollbar relative h-full cursor-grab overflow-auto active:cursor-grabbing"
          onMouseDown={handleFreeFormAreaMouseDown}
          onMouseUp={handleFreeFormAreaMouseUp}
          onMouseMove={handleFreeFormAreaMouseMove}
          onMouseLeave={handleFreeFormAreaMouseUp}>
          <div className="flex min-h-[2000px] min-w-[6000px] justify-center pt-[500px]">
            <div
              ref={canvasRef}
              className={cn(
                styles.canvas,
                styles.reportRoot,
                styles.reportContainer,
                styles.reportHeight,
                'cursor-default active:cursor-default'
              )}>
              <div className={styles.canvas_grid} />
              <GridLayout
                layout={layouts[currentPage]}
                width={GRID_WIDTH}
                rowHeight={GRID_ROW_HEIGHT}
                maxRows={GRID_MAX_ROWS}
                margin={[0, 0]}
                compactType={null}
                onDrop={handleWidgetDrop}
                onDragStart={handleGridItemDragStart}
                onDragStop={handleGridItemDragStop}
                onResizeStop={handleGridItemResizeStop}
                onResizeStart={handleGridItemResizeStart}
                preventCollision
                isResizable={true}
                isDroppable={true}
                isDraggable={true}
                isBounded
                useCSSTransforms={true}
                resizeHandles={['sw', 'nw', 'se', 'ne']}
                style={GRID_STRICT_STYLE}>
                {state.widgets[state.currentPage].map((widget, index) => {
                  if (!widget.gridItemId) return null;
                  return (
                    <div
                      key={widget.gridItemId}
                      className={gridItemDivRequiredStyles}>
                      <GridItemComponent
                        widget={widget}
                        onDeleteClick={() => handleDeleteGridItem(index)}
                        isDragging={draggingId === widget.gridItemId}
                      />
                    </div>
                  );
                })}
              </GridLayout>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export { Designer };
