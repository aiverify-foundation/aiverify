'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RiDeleteBinLine, RiGridLine } from '@remixicon/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { initialState } from './hooks/pagesDesignReducer';
import { pagesDesignReducer } from './hooks/pagesDesignReducer';
import { useDragToScroll } from './hooks/useDragToScroll';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PlunginsPanel } from './pluginsPanel';
import { ZoomControl } from './zoomControl';

/*
  Designer component has 3 sections:
  - The plugins panel section
  - The controls section
  - The design section

  The design section has 3 key nested areas (nested divs):
  - The free form area
    - This area is the largest area and takes up the entire width of the screen and full height below page header.
  - The content area
    - This is a container wrapping the main content. It has large overflowing excess width and height to allow dragging and scrolling.
  - The pages wrapper
    - This is a container wrapping all the pages.
*/

const A4_WIDTH = 794; // ideal width of A4 page
const A4_HEIGHT = 1100; // ideal height of A4 page
const A4_MARGIN = 12; // margin of A4 page
const GRID_MAX_ROWS = 36; // max rows of the grid
const GRID_WIDTH = A4_WIDTH - A4_MARGIN * 2; // width of the grid within the A4 page
const GRID_ROW_HEIGHT = Math.floor(A4_HEIGHT / GRID_MAX_ROWS); // calculated height of each row in the grid
const GRID_HEIGHT = A4_HEIGHT - A4_MARGIN * 2; // height of the grid within the A4 page
const PAGE_GAP = 128; // spacing between pages
const CONTAINER_PAD = 100; // padding used to calculate virtual space at top and bottom of the free from content

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
  const [state, dispatch] = useReducer(pagesDesignReducer, initialState);
  const [showGrid, setShowGrid] = useState(true);
  const { layouts, currentPage } = state;
  const [error, setError] = useState<string | undefined>();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingGridItemId, setEditingGridItemId] = useState<string | null>(
    null
  );
  const [editingElement, setEditingElement] = useState<HTMLDivElement | null>(
    null
  );
  const { zoomLevel, resetZoom, startContinuousZoom, stopContinuousZoom } =
    useZoom();
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

  useEffect(() => {
    if (freeFormAreaRef.current) {
      const element = freeFormAreaRef.current;
      const currentScrollTop = element.scrollTop;
      const scrollableWidth = element.scrollWidth - element.clientWidth;
      const horizontalCenter =
        scrollableWidth * (element.scrollLeft / (scrollableWidth || 1));

      element.scrollLeft = horizontalCenter;
      element.scrollTop = currentScrollTop; // Maintain the same vertical scroll position
    }
  }, [zoomLevel]);

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
  const [gridWidth, gridRowHeight, pageHeight] = useMemo(
    () => [
      GRID_WIDTH * zoomLevel,
      GRID_ROW_HEIGHT * zoomLevel,
      GRID_HEIGHT * zoomLevel,
    ],
    [zoomLevel]
  );

  const gridLayoutStyle: React.CSSProperties = {
    height: `${pageHeight}px`,
    width: `${gridWidth}px`,
    transition: 'width 0.1s ease-out, height 0.1s ease-out',
  };

  const contentWrapperMinHeight = useMemo(() => {
    const totalPagesHeight = layouts.length * pageHeight;
    const totalGapsHeight = (layouts.length - 1) * (PAGE_GAP * zoomLevel);
    const totalHeight =
      totalPagesHeight +
      totalGapsHeight +
      (CONTAINER_PAD + CONTAINER_PAD) * zoomLevel; // container spacings at top and bottom
    return `${totalHeight}px`;
  }, [layouts.length, pageHeight, zoomLevel]);

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
          <div
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg'
            )}>
            <button
              className="disabled:opacity-50"
              title="Toggle Grid"
              onClick={() => setShowGrid(!showGrid)}>
              <RiGridLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
            </button>
          </div>
          <ZoomControl
            zoomLevel={zoomLevel}
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
              id="contentWrapper"
              className="flex min-w-[6000px] justify-center"
              style={{
                minHeight: contentWrapperMinHeight,
                paddingTop: `${CONTAINER_PAD * zoomLevel}px`,
                transition: 'all 0.2s ease-out',
              }}>
              <div
                id="pagesWrapper"
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
                      'cursor-default active:cursor-default'
                    )}>
                    <div
                      id={`gridOverlay-${pageIndex}`}
                      className="absolute"
                      style={{
                        display: showGrid ? 'block' : 'none',
                        top: `${A4_MARGIN * zoomLevel}px`,
                        left: `${A4_MARGIN * zoomLevel}px`,
                        right: `${A4_MARGIN * zoomLevel}px`,
                        bottom: `${A4_MARGIN * zoomLevel}px`,
                        backgroundImage: `radial-gradient(circle at 0 0, black 1.5px, transparent 0.2px)`,
                        backgroundSize: `${((A4_WIDTH - A4_MARGIN * 2) * zoomLevel) / 12}px ${30 * zoomLevel}px`,
                        backgroundPosition: '0 0',
                        transition: 'all 0.1s ease-out',
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
                      style={gridLayoutStyle}>
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
