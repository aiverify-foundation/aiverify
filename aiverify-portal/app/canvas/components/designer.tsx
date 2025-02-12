'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RiDeleteBinLine, RiGridLine } from '@remixicon/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import { ParsedTestResults, PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { Widget } from '@/app/types';
import { Tooltip } from '@/lib/components/tooltip';
import { cn } from '@/lib/utils/twmerge';
import { AlgosToRun } from './algosToRun';
import { EditingOverlay } from './editingOverlay';
import { GridItemComponent } from './gridItemComponent';
import { GridLines } from './gridLines';
import { initialState } from './hooks/pagesDesignReducer';
import { pagesDesignReducer } from './hooks/pagesDesignReducer';
import { useDragToScroll } from './hooks/useDragToScroll';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PlunginsPanel } from './pluginsPanel';
import { ResizeHandle } from './resizeHandle';
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
const GRID_ROWS = 36; // number of rows of the grid
const GRID_COLUMNS = 12; // number of columns of the grid
const GRID_WIDTH = A4_WIDTH; // width of the grid within the A4 page
const GRID_ROW_HEIGHT = A4_HEIGHT / GRID_ROWS; // calculated height of each row in the grid
const GRID_HEIGHT = A4_HEIGHT; // height of the grid within the A4 page
const PAGE_GAP = 128; // spacing between pages
const CONTAINER_PAD = 100; // padding used to calculate virtual space at top and bottom of the free from content

type GridItemDivRequiredStyles = `relative group${string}`; // mandatory to have relative and group

type DesignProps = {
  pluginsWithMdx: PluginForGridLayout[];
  testResults?: ParsedTestResults[];
  printMode?: boolean;
};

type EventDataTransfer = Event & {
  dataTransfer: {
    getData: (type: 'application/json') => string;
  };
};

const gridItemDivRequiredStyles: GridItemDivRequiredStyles = `relative group
  hover:outline hover:outline-2 
  hover:outline-blue-500 hover:outline-offset-2
  active:outline-none`;

const widgetItemSchema = z.object({
  gid: z.string(),
  cid: z.string(),
});

export type WidgetCompositeId = z.infer<typeof widgetItemSchema>;

function createGridItemId(widget: Widget, pageIndex: number) {
  return `${widget.gid}-${widget.cid}-p${pageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Designer({ pluginsWithMdx, testResults }: DesignProps) {
  console.log('testResults', testResults);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const [state, dispatch] = useReducer(pagesDesignReducer, initialState);
  const { layouts, currentPage, showGrid } = state;
  const [error, setError] = useState<string | undefined>();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isGridItemDragging, setIsGridItemDragging] = useState(false);
  const [editingElement, setEditingElement] = useState<HTMLDivElement | null>(
    null
  );
  const [editingWidget, setEditingWidget] = useState<WidgetOnGridLayout | null>(
    null
  );
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const { zoomLevel, resetZoom, startContinuousZoom, stopContinuousZoom } =
    useZoom();
  const freeFormAreaRef = useRef<HTMLDivElement>(null);
  const [newDraggedWidget, setNewDraggedWidget] = useState<Widget | null>(null);

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
      let data: unknown;
      try {
        data = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch (error) {
        console.error('Invalid widget item json', error);
        setError('Invalid widget item json');
        return;
      }
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
    setIsGridItemDragging(true);
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
      setIsGridItemDragging(false);
    };

  function handleGridItemDragStart(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    const { i } = itemLayout;
    setDraggingId(i);
    setIsGridItemDragging(true);
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
      setIsGridItemDragging(false);
    };

  const handleDeleteGridItem = (pageIndex: number, widgetIndex: number) => {
    dispatch({
      type: 'DELETE_WIDGET_FROM_CANVAS',
      index: widgetIndex,
      pageIndex,
    });
  };

  const handleGridItemEditClick =
    (pageIndex: number) =>
    (
      gridItemId: string,
      gridItemHtmlElement: HTMLDivElement | null,
      widget: WidgetOnGridLayout
    ) => {
      setEditingElement(gridItemHtmlElement);
      setEditingPageIndex(pageIndex);
      setEditingWidget(widget);
    };

  function handleEditClose(updatedWidget: WidgetOnGridLayout) {
    if (editingPageIndex === null) {
      console.error('Editing page index is not set');
      return;
    }
    dispatch({
      type: 'UPDATE_WIDGET',
      widget: updatedWidget,
      pageIndex: editingPageIndex,
    });
    setEditingElement(null);
    setEditingPageIndex(null);
    setEditingWidget(null);
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
  const [gridWidth, gridRowHeight, gridHeight] = useMemo(
    () => [
      GRID_WIDTH * zoomLevel,
      GRID_ROW_HEIGHT * zoomLevel,
      GRID_HEIGHT * zoomLevel,
    ],
    [zoomLevel]
  );

  const contentWrapperMinHeight = useMemo(() => {
    const totalPagesHeight = layouts.length * gridHeight;
    const totalGapsHeight = (layouts.length - 1) * (PAGE_GAP * zoomLevel);
    const containerPadding = (CONTAINER_PAD + CONTAINER_PAD) * zoomLevel;
    const totalHeight = totalPagesHeight + totalGapsHeight + containerPadding;

    // If single page and content smaller than viewport, center vertically
    if (layouts.length === 1 && freeFormAreaRef.current) {
      const viewportHeight = freeFormAreaRef.current.clientHeight;
      return `${Math.max(viewportHeight, totalHeight)}px`;
    }

    return `${totalHeight}px`;
  }, [layouts.length, gridHeight, zoomLevel]);

  const gridLayoutStyle = useMemo<React.CSSProperties>(
    () => ({
      height: gridHeight,
      width: gridWidth,
      transition: 'width 0.1s ease-out, height 0.1s ease-out',
      fontSize: `${zoomLevel}rem`,
      margin: `${A4_MARGIN}px`,
      background: 'transparent',
    }),
    [gridHeight, gridWidth, zoomLevel]
  );

  const controlsSection = (
    <section className="fixed right-[100px] top-[120px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
        <button
          className="disabled:opacity-50"
          title="Toggle Grid"
          onClick={() => dispatch({ type: 'TOGGLE_GRID' })}>
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
  );

  function handlePluginWidgetDragStart(widget: WidgetOnGridLayout) {
    setNewDraggedWidget(widget);
  }

  function handlePluginWidgetDragEnd() {
    setNewDraggedWidget(null);
  }

  const pluginsPanelSection = (
    <section className="absolute z-10 flex h-full w-[300px] flex-col bg-secondary-900 p-4">
      <div>
        <h4 className="mb-0 text-lg font-bold">Project Name</h4>
        <p className="text-sm text-white">Project Description</p>
      </div>
      <PlunginsPanel
        plugins={pluginsWithMdx}
        className="custom-scrollbar w-full overflow-auto pr-[10px] pt-[50px]"
        onDragStart={handlePluginWidgetDragStart}
        onDragEnd={handlePluginWidgetDragEnd}
      />
    </section>
  );

  const pagesSection = (
    <section className="relative flex h-full w-full flex-1 flex-col gap-2">
      <div
        id="freeFormArea"
        ref={freeFormAreaRef}
        className="custom-scrollbar relative h-full cursor-grab overflow-auto bg-slate-100 active:cursor-grabbing"
        onMouseDown={
          !isGridItemDragging ? handleFreeFormAreaMouseDown : undefined
        }
        onMouseUp={!isGridItemDragging ? handleFreeFormAreaMouseUp : undefined}
        onMouseMove={
          isDraggingFreeFormArea && !isGridItemDragging
            ? handleFreeFormAreaMouseMove
            : undefined
        }
        onMouseLeave={
          !isGridItemDragging ? handleFreeFormAreaMouseUp : undefined
        }>
        <div
          id="contentWrapper"
          className="flex min-w-[6000px] justify-center transition-all duration-200 ease-out"
          style={{
            minHeight: contentWrapperMinHeight,
            paddingTop:
              layouts.length === 1 ? 'auto' : `${CONTAINER_PAD * zoomLevel}px`,
            alignItems: layouts.length === 1 ? 'center' : 'flex-start',
          }}>
          <div
            id="pagesWrapper"
            className="flex flex-col gap-2">
            {layouts.map((layout, pageIndex) => (
              <div
                id={`page-${pageIndex}`}
                key={`page-${pageIndex}`}
                ref={canvasRef}
                className={cn(
                  'relative bg-white text-black shadow',
                  'cursor-default active:cursor-default'
                )}>
                {showGrid && (
                  <GridLines
                    columns={GRID_COLUMNS}
                    rows={GRID_ROWS}
                    padding={A4_MARGIN}
                  />
                )}
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
                  maxRows={GRID_ROWS}
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
                  useCSSTransforms={!isInitialMount.current}
                  resizeHandle={<ResizeHandle />}
                  resizeHandles={['sw', 'nw', 'se', 'ne']}
                  style={gridLayoutStyle}
                  className="[&>*]:text-inherit"
                  droppingItem={
                    newDraggedWidget
                      ? {
                          i: '__dropping-elem__',
                          w: newDraggedWidget.widgetSize.maxW,
                          h: newDraggedWidget.widgetSize.minH,
                        }
                      : undefined
                  }>
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
                          onEditClick={handleGridItemEditClick(pageIndex)}
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
  );

  return (
    <React.Fragment>
      {editingElement && editingPageIndex != null && editingWidget ? (
        <EditingOverlay
          widget={editingWidget}
          pageIndex={editingPageIndex}
          originalElement={editingElement}
          onClose={handleEditClose}
        />
      ) : null}
      <main className="relative h-full w-full">
        {pluginsPanelSection}
        {controlsSection}
        {pagesSection}
      </main>
    </React.Fragment>
  );
}

export { Designer };
