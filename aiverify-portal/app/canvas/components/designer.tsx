'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RiGridLine } from '@remixicon/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import { ParsedTestResults, PluginForGridLayout, WidgetOnGridLayout, TestResultDataMapping } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { TestResultData, Widget } from '@/app/types';
import { cn } from '@/lib/utils/twmerge';
import { AlgosToRun } from './algosToRun';
import { EditingOverlay } from './editingOverlay';
import { FreeFormArea } from './freeFormArea';
import { GridItemComponent } from './gridItemComponent';
import { GridLines } from './gridLines';
import { initialState } from './hooks/pagesDesignReducer';
import { pagesDesignReducer } from './hooks/pagesDesignReducer';
import { useDragToScroll } from './hooks/useDragToScroll';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PageNumber } from './pageNumber';
import { PluginsPanel } from './pluginsPanel';
import { ResizeHandle } from './resizeHandle';
import { TestResultsPicker } from './testResultsPicker';
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
  testResults: ParsedTestResults[];
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
  gridItemId: z.string().optional(),
  gid: z.string(),
  cid: z.string(),
});

export type WidgetCompositeId = z.infer<typeof widgetItemSchema>;

function createGridItemId(widget: Widget, pageIndex: number) {
  return `${widget.gid}-${widget.cid}-p${pageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Designer({ pluginsWithMdx, testResults = [] }: DesignProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const freeFormAreaRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(pagesDesignReducer, initialState);
  const { layouts, currentPage, showGrid } = state;
  const [error, setError] = useState<string | undefined>();
  const [newDraggedWidget, setNewDraggedWidget] = useState<Widget | null>(null);
  const [draggingGridItemId, setDraggingGridItemId] = useState<string | null>(null);
  const [resizingGridItemId, setResizingGridItemId] = useState<string | null>(null);
  const [editingGridItem, setEditingGridItem] = useState<[WidgetOnGridLayout, HTMLDivElement] | null>(null)
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const { zoomLevel, resetZoom, startContinuousZoom, stopContinuousZoom } =
    useZoom();
  const [testResultsMapping, setTestResultsMapping] = useState<TestResultDataMapping | null>(null);
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
        setDraggingGridItemId(null);
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
        if (result.data.gridItemId) {
          // todo - for handling existing grid item id
          console.log(data)
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
    setResizingGridItemId(i);
  };

  const handleGridItemResizeStop =
    (pageIndex: number) =>
      (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
        setResizingGridItemId(null);
        const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
        dispatch({
          type: 'RESIZE_WIDGET',
          itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
          pageIndex,
        });
      };

  function handleGridItemDragStart(
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) {
    setDraggingGridItemId(itemLayout.i);
  }

  const handleGridItemDragStop =
    (pageIndex: number) =>
      (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
        console.log('handleGridItemDragStop', itemLayout);
        const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;

        // Get the element being dragged
        const element = document.getElementById(i);
        if (!element) return;

        // Find which page the element is currently over
        const pages = Array.from(document.querySelectorAll('[id^="page-"]'));
        const targetPage = pages.find(page => {
          const rect = page.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          return (
            elementRect.top >= rect.top &&
            elementRect.bottom <= rect.bottom
          );
        });

        if (!targetPage) {
          // If not over any page, return to original position
          dispatch({
            type: 'CHANGE_WIDGET_POSITION',
            itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
            pageIndex,
          });
        } else {
          const targetPageIndex = parseInt(targetPage.id.split('-')[1]);

          if (targetPageIndex !== pageIndex) {
            // Move to different page
            dispatch({
              type: 'MOVE_WIDGET_TO_PAGE',
              itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
              fromPageIndex: pageIndex,
              toPageIndex: targetPageIndex,
              widgetId: i
            });
          } else {
            // Same page movement
            dispatch({
              type: 'CHANGE_WIDGET_POSITION',
              itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
              pageIndex,
            });
          }
        }

        setDraggingGridItemId(null);
      };

  const handleDeleteGridItem =
    (pageIndex: number, widgetIndex: number) => () => {
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
        gridItemHtmlElement: HTMLDivElement,
        widget: WidgetOnGridLayout
      ) => {
        setEditingGridItem([widget, gridItemHtmlElement])
        setEditingPageIndex(pageIndex);
      };

  const handleGridItemDrag = (
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout,
    placeholder: Layout,
    event: MouseEvent,
    element: HTMLElement
  ) => {
    if (!element) return;

    const gridElement = element.closest('.react-grid-layout');
    if (!gridElement) return;

    const gridRect = gridElement.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const isOutsideGrid =
      elementRect.top > gridRect.bottom ||
      elementRect.bottom < gridRect.top ||
      elementRect.left > gridRect.right ||
      elementRect.left < gridRect.left;

    element.style.opacity = isOutsideGrid ? '0.5' : '1';
    // element.querySelector('div')?.setAttribute('draggable', isOutsideGrid ? 'true' : 'false');
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
    setEditingGridItem(null);
    setEditingPageIndex(null);
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

  function handleSelectUploadedTestResults(selectedResults: ParsedTestResults[]) {
    if (selectedResults.length === 0) {
      setTestResultsMapping(null);
      return;
    }
    const testResultsMapping = selectedResults.reduce((acc, result) => {
      acc[`${result.gid}:${result.cid}`] = result.output;
      return acc;
    }, {} as Record<string, TestResultData>);

    setTestResultsMapping(testResultsMapping);
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

  const contentWrapperMinHeight = useMemo(() => {
    const totalPagesHeight = layouts.length * gridHeight;
    const totalGapsHeight = (layouts.length - 1) * (PAGE_GAP * zoomLevel);
    const containerPadding = (CONTAINER_PAD + CONTAINER_PAD) * zoomLevel;
    const totalHeight = totalPagesHeight + totalGapsHeight + containerPadding;

    // If single page and content smaller than viewport, center vertically
    if (layouts.length === 1 && freeFormAreaRef.current) {
      const viewportHeight = freeFormAreaRef.current.clientHeight;
      return Math.max(viewportHeight, totalHeight);
    }

    return totalHeight;
  }, [layouts.length, gridHeight, zoomLevel]);

  const pageControlsSection = (
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
        algos={state.algos}
      />
    </section>
  );

  const pluginsPanelSection = (
    <section className="absolute z-10 flex h-full w-[300px] flex-col bg-secondary-900 p-4">
      <div>
        <h4 className="mb-0 text-lg font-bold">Project Name</h4>
        <p className="text-sm text-white">Project Description</p>
      </div>
      <PluginsPanel
        plugins={pluginsWithMdx}
        className="custom-scrollbar w-full overflow-auto pr-[10px] pt-[50px]"
        onDragStart={(widget) => setNewDraggedWidget(widget)}
        onDragEnd={() => setNewDraggedWidget(null)}
      />
    </section>
  );

  const pagesSection = (
    <FreeFormArea
      ref={freeFormAreaRef}
      pagesLength={layouts.length}
      zoomLevel={zoomLevel}
      contentWrapperMinHeight={contentWrapperMinHeight}
      onMouseDown={!draggingGridItemId && !resizingGridItemId ? handleFreeFormAreaMouseDown : undefined}
      onMouseUp={!draggingGridItemId && !resizingGridItemId ? handleFreeFormAreaMouseUp : undefined}
      onMouseMove={isDraggingFreeFormArea && !draggingGridItemId && !resizingGridItemId
        ? handleFreeFormAreaMouseMove
        : undefined}
      onMouseLeave={!draggingGridItemId && !resizingGridItemId ? handleFreeFormAreaMouseUp : undefined}>
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
          <PageNumber
            pageNumber={pageIndex + 1}
            onDeleteClick={() => handleDeletePage(pageIndex)}
          />
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
            isBounded={false}
            allowOverlap={false}
            useCSSTransforms={!isInitialMount.current}
            resizeHandle={<ResizeHandle />}
            resizeHandles={['sw', 'nw', 'se', 'ne']}
            style={gridLayoutStyle}
            className="[&>*]:text-inherit"
            droppingItem={
              newDraggedWidget
                ? {
                  // makes the dropping red placeholder size of the widget
                  i: '__dropping-elem__',
                  w: newDraggedWidget.widgetSize.maxW,
                  h: newDraggedWidget.widgetSize.minH,
                } : undefined
            }>
            {state.widgets[pageIndex].map((widget, widgetIndex) => {
              if (!widget.gridItemId) return null;
              return (
                <div
                  id={widget.gridItemId}
                  key={widget.gridItemId}
                  className={gridItemDivRequiredStyles}>
                  <GridItemComponent
                    widget={widget}
                    onDeleteClick={handleDeleteGridItem(pageIndex, widgetIndex)}
                    onEditClick={handleGridItemEditClick(pageIndex)}
                    isDragging={draggingGridItemId === widget.gridItemId}
                    isResizing={resizingGridItemId === widget.gridItemId}
                    algosMap={state.algos}
                    testResultsMapping={testResultsMapping}
                  />
                </div>
              );
            })}
          </GridLayout>
        </div>
      ))}
    </FreeFormArea>
  );

  const testControlsSection = (
    <section className="fixed left-[420px] top-[90px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
      <TestResultsPicker
        testResults={testResults}
        onOkClick={handleSelectUploadedTestResults}
      />
    </section>
  );

  // console.log('state', state);

  return (
    <React.Fragment>
      {editingGridItem && editingPageIndex != null ? (
        <EditingOverlay
          pageIndex={editingPageIndex}
          widget={editingGridItem[0]}
          originalElement={editingGridItem[1]}
          onClose={handleEditClose}
        />
      ) : null}
      <main className="relative h-full w-full">
        {pluginsPanelSection}
        {testControlsSection}
        {pageControlsSection}
        {pagesSection}
      </main>
    </React.Fragment>
  );
}

export { Designer };
