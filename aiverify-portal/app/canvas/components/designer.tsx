'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RiDeleteBinLine } from '@remixicon/react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { Widget } from '@/app/types';
import { Tooltip } from '@/lib/components/tooltip';
import { cn } from '@/lib/utils/twmerge';
import { AlgosToRun } from './algosToRun';
import { EditingOverlay } from './editingOverlay';
import { GridItemComponent } from './gridItemComponent';
import { initialState } from './hooks/designReducer';
import { designReducer } from './hooks/designReducer';
import { useDragToScroll } from './hooks/useDragToScroll';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PlunginsPanel } from './pluginsPanel';
import { ZoomControl } from './zoomControl';
const A4_WIDTH = 794;
const A4_HEIGHT = 1100;
const A4_MARGIN = 10;
const GRID_MAX_ROWS = 36;
const BASE_GRID_WIDTH = A4_WIDTH - A4_MARGIN * 2;
const BASE_GRID_ROW_HEIGHT = Math.floor(A4_HEIGHT / GRID_MAX_ROWS); // ~30.5px
const BASE_PAGE_HEIGHT = A4_HEIGHT - A4_MARGIN * 2;
const PAGE_GAP = 128;
const CONTAINER_PAD = 100;

type DesignProps = {
  pluginsWithMdx: PluginForGridLayout[];
  printMode?: boolean;
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

function createGridItemId(widget: Widget, pageIndex: number) {
  return `${widget.gid}-${widget.cid}-p${pageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Designer({ pluginsWithMdx }: DesignProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const [state, dispatch] = useReducer(designReducer, initialState);
  const { layouts, currentPage } = state;
  const [error, setError] = useState<string | undefined>();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingGridItemId, setEditingGridItemId] = useState<string | null>(
    null
  );
  const [editingElement, setEditingElement] = useState<HTMLDivElement | null>(
    null
  );
  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    startContinuousZoom,
    stopContinuousZoom,
  } = useZoom();
  const freeFormAreaRef = useRef<HTMLDivElement>(null);

  const {
    isDragging: isDraggingFreeFormArea,
    handleMouseDown: handleFreeFormAreaMouseDown,
    handleMouseUp: handleFreeFormAreaMouseUp,
    handleMouseMove: handleFreeFormAreaMouseMove,
  } = useDragToScroll(freeFormAreaRef, canvasRef);

  useEffect(() => {
    if (freeFormAreaRef.current) {
      const totalWidth = freeFormAreaRef.current.scrollWidth;
      const viewportWidth = freeFormAreaRef.current.clientWidth;
      freeFormAreaRef.current.scrollLeft = (totalWidth - viewportWidth) / 2;
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
    }
  }, []);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (layouts.length > 0) {
      const newPageElement = document.getElementById(
        `page-${layouts.length - 1}`
      );
      if (newPageElement) {
        setTimeout(() => {
          const scrollPadding = CONTAINER_PAD;
          const elementTop = newPageElement.offsetTop;
          freeFormAreaRef.current?.scrollTo({
            top: elementTop - scrollPadding,
            behavior: 'smooth',
          });
        }, 0);
      }
    }
  }, [layouts.length]);

  const handleWidgetDrop =
    (pageIndex: number) =>
    (_layout: Layout[], item: Layout, e: EventDataTransfer) => {
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
        pluginsWithMdx,
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

      const widgetWithInitialData: WidgetOnGridLayout =
        populateInitialWidgetResult(widget);
      const gridItemId = createGridItemId(widget, pageIndex);
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
        ...widgetWithInitialData,
        gridItemId,
      };
      const algos = getWidgetAlgosFromPlugins(pluginsWithMdx, widget);
      dispatch({
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout,
        widget: widgetWithGridItemId,
        algos,
        pageIndex,
      });
    };

  const handleGridItemResizeStart = (
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) => {
    const { i } = itemLayout;
    setDraggingId(i);
  };

  const handleGridItemResizeStop =
    (pageIndex: number) =>
    (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
      const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
      dispatch({
        type: 'RESIZE_WIDGET',
        itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
        pageIndex,
      });
      setDraggingId(null);
    };

  function handleGridItemDragStart(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    const { i } = itemLayout;
    setDraggingId(i);
  }

  const handleGridItemDragStop =
    (pageIndex: number) =>
    (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
      const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
      dispatch({
        type: 'CHANGE_WIDGET_POSITION',
        itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
        pageIndex,
      });
      setDraggingId(null);
    };

  const handleDeleteGridItem = (pageIndex: number, widgetIndex: number) => {
    dispatch({
      type: 'DELETE_WIDGET_FROM_CANVAS',
      index: widgetIndex,
      pageIndex,
    });
  };

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

  function handleDeletePage(pageIndex: number) {
    if (layouts.length > 1) {
      dispatch({
        type: 'DELETE_PAGE',
        pageIndex,
      });
    } else {
      console.warn('Cannot delete the last remaining page.');
    }
  }

  // Calculate actual dimensions based on zoom
  const gridWidth = Math.round(BASE_GRID_WIDTH * zoomLevel);
  const gridRowHeight = Math.round(BASE_GRID_ROW_HEIGHT * zoomLevel);
  const pageHeight = Math.round(BASE_PAGE_HEIGHT * zoomLevel);

  const gridStyle: React.CSSProperties = {
    height: `${pageHeight}px`,
    width: `${gridWidth}px`,
  };

  function calculateMinHeight() {
    const totalPagesHeight = layouts.length * pageHeight;
    const totalGapsHeight = (layouts.length - 1) * (PAGE_GAP * zoomLevel);
    const totalHeight =
      totalPagesHeight +
      totalGapsHeight +
      (CONTAINER_PAD + CONTAINER_PAD) * zoomLevel; // containerpadding top and bottom
    return `${totalHeight}px`;
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
      <main className="relative h-full w-full">
        <section className="absolute z-10 flex h-full w-[300px] flex-col bg-secondary-900 p-4">
          <div>
            <h4 className="mb-0 text-lg font-bold">Project Name</h4>
            <p className="text-sm text-white">Project Description</p>
          </div>
          <PlunginsPanel
            plugins={pluginsWithMdx}
            className="custom-scrollbar w-full overflow-auto pr-[10px] pt-[50px]"
          />
        </section>
        <section className="fixed right-[100px] top-[120px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
          <ZoomControl
            zoomLevel={zoomLevel}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomReset={resetZoom}
            startContinuousZoom={startContinuousZoom}
            stopContinuousZoom={stopContinuousZoom}
          />
          <PageNavigation
            totalPages={layouts.length}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onAddPage={handleAddNewPage}
          />
          <AlgosToRun
            onClick={() => null}
            algos={state.algos}
          />
        </section>
        <section className="relative flex h-full w-full flex-1 flex-col gap-2">
          <div
            id="freeFormArea"
            ref={freeFormAreaRef}
            className="custom-scrollbar relative h-full cursor-grab overflow-auto bg-slate-100 active:cursor-grabbing"
            onMouseDown={handleFreeFormAreaMouseDown}
            onMouseUp={handleFreeFormAreaMouseUp}
            onMouseMove={
              isDraggingFreeFormArea ? handleFreeFormAreaMouseMove : undefined
            }
            onMouseLeave={handleFreeFormAreaMouseUp}>
            <div
              id="freeFormAreaContent"
              className="flex min-w-[6000px] justify-center pt-[500px]"
              style={{
                minHeight: calculateMinHeight(),
                transition: 'all 0.2s ease-out',
              }}>
              <div
                id="pagesLayout"
                className="flex flex-col gap-2">
                {layouts.map((layout, pageIndex) => (
                  <div
                    id={`page-${pageIndex}`}
                    key={`page-${pageIndex}`}
                    ref={canvasRef}
                    style={
                      {
                        '--zoom-level': zoomLevel,
                        padding: `${A4_MARGIN * zoomLevel}px`,
                      } as React.CSSProperties
                    }
                    className={cn(
                      'relative mb-[50px] bg-white text-sm text-black shadow',
                      'cursor-default active:cursor-default',
                      `scroll-mt-[${100 * zoomLevel}px]`,
                      `w-[${A4_WIDTH * zoomLevel}px]`,
                      `h-[${A4_HEIGHT * zoomLevel}px]`
                    )}>
                    <div
                      className={cn(
                        `absolute`,
                        `left-[calc(${A4_MARGIN}px*var(--zoom-level))]`,
                        `top-[calc(${A4_MARGIN}px*var(--zoom-level))]`,
                        `w-[calc(${A4_WIDTH - 20}px*var(--zoom-level))]`,
                        `h-[calc(${A4_HEIGHT - 19}px*var(--zoom-level))]`
                      )}
                      style={{
                        backgroundImage: `repeating-linear-gradient(#d9d8d8 0 1px, transparent 1px 100%), 
                                         repeating-linear-gradient(90deg, #d9d8d8 0 1px, transparent 1px 100%)`,
                        backgroundSize: `calc((100% - 0.03em) / 12) ${30 * zoomLevel}px`,
                      }}
                    />
                    <div className="absolute right-[-65px] top-0 m-2 flex flex-col text-xs text-gray-500">
                      Page {pageIndex + 1}
                      <Tooltip
                        sideOffset={-10}
                        content="Delete Page"
                        side="right">
                        <RiDeleteBinLine
                          className="mt-2 cursor-pointer rounded bg-gray-300 p-1 text-gray-500 shadow-sm hover:text-red-500"
                          onClick={() => handleDeletePage(pageIndex)}
                        />
                      </Tooltip>
                    </div>
                    <GridLayout
                      layout={layout}
                      width={gridWidth}
                      rowHeight={gridRowHeight}
                      maxRows={GRID_MAX_ROWS}
                      margin={[0, 0]}
                      compactType={null}
                      onDrop={handleWidgetDrop(pageIndex)}
                      onDragStart={handleGridItemDragStart}
                      onDragStop={handleGridItemDragStop(pageIndex)}
                      onResizeStop={handleGridItemResizeStop(pageIndex)}
                      onResizeStart={handleGridItemResizeStart}
                      preventCollision
                      isResizable={true}
                      isDroppable={true}
                      isDraggable={true}
                      isBounded
                      useCSSTransforms={true}
                      resizeHandles={['sw', 'nw', 'se', 'ne']}
                      style={gridStyle}>
                      {state.widgets[pageIndex].map((widget, widgetIndex) => {
                        if (!widget.gridItemId) return null;
                        return (
                          <div
                            key={widget.gridItemId}
                            className={gridItemDivRequiredStyles}>
                            <GridItemComponent
                              widget={widget}
                              onDeleteClick={() =>
                                handleDeleteGridItem(pageIndex, widgetIndex)
                              }
                              onEditClick={handleGridItemEditClick}
                              isDragging={draggingId === widget.gridItemId}
                              algosMap={state.algos}
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
      </main>
    </React.Fragment>
  );
}

export { Designer };
