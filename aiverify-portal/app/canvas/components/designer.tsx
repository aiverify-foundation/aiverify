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
import { isPageContentOverflow } from '@/app/canvas/utils/isPageContentOverflow';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { TestResultData, Widget } from '@/app/types';
import { cn } from '@/lib/utils/twmerge';
import { AlgosToRun } from './algosToRun';
import {
  A4_MARGIN,
  GRID_ROWS,
  GRID_COLUMNS,
  GRID_WIDTH,
  GRID_ROW_HEIGHT,
  GRID_HEIGHT,
  PAGE_GAP,
  CONTAINER_PAD,
  A4_HEIGHT,
  A4_WIDTH
} from './dimensionsConstants';
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

type GridItemDivRequiredStyles = `relative group z-10${string}`; // mandatory to have relative and group

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


const gridItemDivRequiredStyles: GridItemDivRequiredStyles = `relative group z-10
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
  const { zoomLevel, resetZoom, zoomIn, zoomOut } = useZoom();
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

  useEffect(() => {
    if (isInitialMount.current) return;

    setTimeout(() => {
      const { overflows, numOfRequiredPages } = isPageContentOverflow(layouts[currentPage], state.widgets[currentPage]);

      // Count existing overflow pages for current page
      const existingOverflowPages = state.pageTypes.filter(
        (type, idx) => type === 'overflow' && state.overflowParents[idx] === currentPage
      ).length;

      if (overflows && existingOverflowPages < numOfRequiredPages - 1) {
        dispatch({
          type: 'ADD_OVERFLOW_PAGES',
          parentPageIndex: currentPage,
          count: (numOfRequiredPages - 1) - existingOverflowPages
        });
      } else if (!overflows && existingOverflowPages > 0) {
        dispatch({
          type: 'REMOVE_OVERFLOW_PAGES',
          parentPageIndex: currentPage
        });
      }
    }, 0)
  }, [layouts[currentPage], state.widgets[currentPage], state.pageTypes, state.overflowParents]);

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

  const handleGridItemDrag = (
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) => {
    setDraggingGridItemId(itemLayout.i);
  };

  const handleGridItemDragStop =
    (pageIndex: number) =>
      (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
        const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
        dispatch({
          type: 'CHANGE_WIDGET_POSITION',
          itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
          pageIndex,
        });
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
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
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

  const droppingItemPlaceholder = newDraggedWidget
    ? {
      // makes the dropping red placeholder size of the widget
      i: '__dropping-elem__',
      w: newDraggedWidget.widgetSize.maxW,
      h: newDraggedWidget.widgetSize.minH,
    } : undefined

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
      {state.layouts.map((layout, pageIndex) => {
        const isOverflowPage = state.pageTypes[pageIndex] === 'overflow';
        const overflowParent = state.overflowParents[pageIndex];

        return (
          <div
            id={`page-${pageIndex}`}
            key={`page-${pageIndex}`}
            ref={canvasRef}
            className={cn(
              'relative bg-white text-black shadow',
              'cursor-default active:cursor-default',
              isOverflowPage && 'pointer-events-none',
              !isOverflowPage && 'mt-2'
            )}
            style={{
              height: isOverflowPage ? A4_HEIGHT * zoomLevel : 'auto',
              width: isOverflowPage ? A4_WIDTH * zoomLevel : 'auto',
            }}>
            {!isOverflowPage && showGrid && (
              <GridLines
                columns={GRID_COLUMNS}
                rows={GRID_ROWS}
                padding={A4_MARGIN}
              />
            )}
            <PageNumber
              pageNumber={pageIndex + 1}
              onDeleteClick={!isOverflowPage ? () => handleDeletePage(pageIndex) : undefined}
              isOverflowPage={isOverflowPage}
            />
            {isOverflowPage && overflowParent !== null ? (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{
                  height: A4_HEIGHT * zoomLevel,
                  width: A4_WIDTH * zoomLevel
                }}>
                <div className="text-gray-200 text-sm">
                  Overflow content from page {overflowParent + 1}
                </div>
              </div>
            ) : (
              <GridLayout
                layout={layout}
                width={gridWidth}
                rowHeight={gridRowHeight}
                maxRows={GRID_ROWS}
                margin={[0, 0]}
                compactType={null}
                onDrop={handleWidgetDrop(pageIndex)}
                onDragStart={handleGridItemDrag}
                onDragStop={handleGridItemDragStop(pageIndex)}
                onResizeStop={handleGridItemResizeStop(pageIndex)}
                onResizeStart={handleGridItemResizeStart}
                preventCollision
                isResizable={true}
                isDroppable={true}
                isDraggable={true}
                isBounded={true}
                allowOverlap={false}
                useCSSTransforms={!isInitialMount.current}
                resizeHandle={<ResizeHandle />}
                resizeHandles={['sw', 'nw', 'se', 'ne']}
                style={gridLayoutStyle}
                className="[&>*]:text-inherit"
                droppingItem={droppingItemPlaceholder}>
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
            )}
          </div>
        );
      })}
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

  console.log('state', state);

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
