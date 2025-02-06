'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RiFileAddLine, RiDeleteBinLine } from '@remixicon/react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { Widget } from '@/app/types';
import { Tooltip } from '@/lib/components/tooltip';
import { cn } from '@/lib/utils/twmerge';
import { EditingOverlay } from './editingOverlay';
import { GridItemComponent } from './gridItemComponent';
import { initialState } from './hooks/designReducer';
import { designReducer } from './hooks/designReducer';
import { useDragToScroll } from './hooks/useDragToScroll';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PlunginsPanel } from './pluginsPanel';
import styles from './styles/designer.module.css';
import { ZoomControl } from './zoomControl';
const BASE_GRID_WIDTH = 774;
const BASE_GRID_ROW_HEIGHT = 30;
const BASE_PAGE_HEIGHT = 1080;
const GRID_MAX_ROWS = 36;
const PAGE_GAP = 128; // equivalent to gap-32 (32 * 4 = 128px)
const PADDING_TOP = 100; // matches pt-[100px]
const PADDING_BOTTOM = 100; // extra padding at bottom

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
  console.log('pluginsWithMdx:', pluginsWithMdx);
  const canvasRef = useRef<HTMLDivElement>(null);
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
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isDragging: isDraggingFreeFormArea,
    handleMouseDown: handleFreeFormAreaMouseDown,
    handleMouseUp: handleFreeFormAreaMouseUp,
    handleMouseMove: handleFreeFormAreaMouseMove,
  } = useDragToScroll(containerRef, canvasRef);

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
          newPageElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
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
      dispatch({
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout,
        widget: widgetWithGridItemId,
        pageIndex,
      });
    };

  const handleGridItemResizeStart =
    (pageIndex: number) =>
    (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
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
      (PADDING_TOP + PADDING_BOTTOM) * zoomLevel;
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
      <div className="relative h-full w-full">
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
        <div className="fixed right-[100px] top-[120px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
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
                transition: 'all 0.2s ease-out',
              }}>
              <div className="flex flex-col gap-2">
                {layouts.map((layout, pageIndex) => (
                  <div
                    id={`page-${pageIndex}`}
                    key={`page-${pageIndex}`}
                    ref={canvasRef}
                    style={{ '--zoom-level': zoomLevel } as React.CSSProperties}
                    className={cn(
                      styles.canvas,
                      styles.reportRoot,
                      styles.reportContainer,
                      styles.reportHeight,
                      'cursor-default active:cursor-default'
                    )}>
                    <div className={styles.canvas_grid} />
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
                      onResizeStart={handleGridItemResizeStart(pageIndex)}
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
