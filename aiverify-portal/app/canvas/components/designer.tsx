'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  RiFileAddLine,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiZoomOutLine,
  RiZoomInLine,
} from '@remixicon/react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducer } from 'react';
import { flushSync } from 'react-dom';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { Widget } from '@/app/types';
import { cn } from '@/lib/utils/twmerge';
import { EditingOverlay } from './editingOverlay';
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

const PAGE_HEIGHT = 1080; // matches GRID_STRICT_STYLE height
const PAGE_GAP = 128; // equivalent to gap-32 (32 * 4 = 128px)
const PADDING_TOP = 100; // matches pt-[100px]
const PADDING_BOTTOM = 100; // extra padding at bottom

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

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
  const [editingGridItemId, setEditingGridItemId] = useState<string | null>(
    null
  );
  const [editingElement, setEditingElement] = useState<HTMLDivElement | null>(
    null
  );
  const [zoomLevel, setZoomLevel] = useState(1);
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

  useEffect(() => {
    // Only scroll if layouts length has increased
    if (layouts.length > 0) {
      const newPageElement = document.getElementById(
        `page-${layouts.length - 1}`
      );
      if (newPageElement) {
        setTimeout(() => {
          newPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    }
  }, [layouts.length]);

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
    const { x, y } = item;
    const { minW, minH, maxH, maxW } = widget.widgetSize;
    const itemLayout = {
      x,
      y,
      w: maxW,
      h: minH,
      minW,
      minH,
      maxW,
      maxH,
      i: gridItemId,
    };
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

  function handleGridItemResizeStart(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    const { i } = itemLayout;
    setDraggingId(i);
  }

  function handleGridItemResizeStop(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
    dispatch({
      type: 'RESIZE_WIDGET',
      itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
    });
    setDraggingId(null);
  }

  function handleGridItemDragStart(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    const { i } = itemLayout;
    setDraggingId(i);
  }

  function handleGridItemDragStop(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
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

  function handleGridItemEditClick(
    gridItemId: string,
    gridItemHtmlElement: HTMLDivElement | null
  ) {
    setEditingGridItemId(gridItemId);
    setEditingElement(gridItemHtmlElement);
  }

  function handleEditingClose() {
    setEditingGridItemId(null);
    setEditingElement(null);
  }

  function handleEditingSave(updatedWidget: WidgetOnGridLayout) {
    dispatch({
      type: 'UPDATE_WIDGET',
      widget: updatedWidget,
    });
    setEditingGridItemId(null);
    setEditingElement(null);
  }

  function handleAddNewPage() {
    dispatch({
      type: 'ADD_NEW_PAGE',
    });
  }

  function handlePageChange(pageIndex: number) {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      pageIndex,
    });
    const pageElement = document.getElementById(`page-${pageIndex}`);
    pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleNextPage() {
    if (currentPage < layouts.length - 1) {
      handlePageChange(currentPage + 1);
    }
  }

  function handlePreviousPage() {
    if (currentPage > 0) {
      handlePageChange(currentPage - 1);
    }
  }

  function calculateMinHeight() {
    const totalPagesHeight = layouts.length * PAGE_HEIGHT;
    const totalGapsHeight = (layouts.length - 1) * PAGE_GAP;
    const totalHeight =
      totalPagesHeight + totalGapsHeight + PADDING_TOP + PADDING_BOTTOM;
    return `${totalHeight}px`;
  }

  function handleZoomIn() {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }

  function handleZoomOut() {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }

  function handleZoomReset() {
    setZoomLevel(1);
  }

  return (
    <React.Fragment>
      {editingGridItemId && editingElement ? (
        <EditingOverlay
          widget={
            state.widgets[state.currentPage].find(
              (w) => w.gridItemId === editingGridItemId
            )!
          }
          originalElement={editingElement}
          onClose={handleEditingClose}
          onSave={handleEditingSave}
        />
      ) : null}
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
        <div className="fixed right-[90px] top-[170px] z-50 -translate-x-1/2 transform">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 shadow-lg">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
              title="Previous page">
              <RiArrowUpSLine className="h-5 w-5 text-gray-900" />
            </button>

            <div className="flex flex-col gap-2">
              {layouts.map((_, index) => (
                <button
                  key={`page-nav-${index}`}
                  onClick={() => handlePageChange(index)}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
                    currentPage === index
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  )}
                  title={`Go to page ${index + 1}`}>
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === layouts.length - 1}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
              title="Next page">
              <RiArrowDownSLine className="h-5 w-5 text-gray-900" />
            </button>
          </div>
        </div>

        <div className="fixed right-[20px] top-[170px] z-50 -translate-x-1/2 transform">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 shadow-lg">
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= MAX_ZOOM}
              className="rounded p-1 hover:hover:bg-gray-200 disabled:opacity-50"
              title="Zoom in">
              <RiZoomInLine className="h-5 w-5 text-gray-900" />
            </button>
            <button
              onClick={handleZoomReset}
              className="rounded p-1 text-xs text-gray-900 hover:bg-gray-200"
              title="Reset zoom">
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= MIN_ZOOM}
              className="rounded p-1 hover:hover:bg-gray-200 disabled:opacity-50"
              title="Zoom out">
              <RiZoomOutLine className="h-5 w-5 text-gray-900" />
            </button>
          </div>
        </div>
        <div
          className="fixed right-[50px] top-[120px] z-50 mx-auto flex max-w-lg cursor-pointer"
          onClick={handleAddNewPage}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-300 shadow-sm">
              <RiFileAddLine className="m-1 h-5 w-5 text-secondary-950 hover:text-blue-500" />
            </div>
            <div className="text-shadow-xs text-sm text-gray-900">New Page</div>
          </div>
        </div>
        <section className="relative flex h-full w-full flex-1 flex-col gap-2">
          <div
            ref={containerRef}
            className="custom-scrollbar relative h-full cursor-grab overflow-auto bg-slate-100 active:cursor-grabbing"
            onMouseDown={handleFreeFormAreaMouseDown}
            onMouseUp={handleFreeFormAreaMouseUp}
            onMouseMove={
              isDraggingFreeFormArea ? handleFreeFormAreaMouseMove : undefined
            }
            onMouseLeave={handleFreeFormAreaMouseUp}>
            <div
              className="flex min-w-[6000px] justify-center pt-[500px]"
              style={{
                minHeight: calculateMinHeight(),
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center top',
                transition: 'transform 0.2s ease-out',
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`,
              }}>
              <div className="flex flex-col gap-2">
                {layouts.map((layout, pageIndex) => (
                  <div
                    id={`page-${pageIndex}`}
                    key={`page-${pageIndex}`}
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
                      layout={layouts[pageIndex]}
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
                              onEditClick={handleGridItemEditClick}
                              isDragging={draggingId === widget.gridItemId}
                            />
                          </div>
                        );
                      })}
                    </GridLayout>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </React.Fragment>
  );
}

export { Designer };
