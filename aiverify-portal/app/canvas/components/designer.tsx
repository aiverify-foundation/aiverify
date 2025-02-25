'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  RiGridLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPrinterLine,
} from '@remixicon/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import {
  ParsedTestResults,
  PluginForGridLayout,
  WidgetOnGridLayout,
} from '@/app/canvas/types';
import { findTestResultById } from '@/app/canvas/utils/findTestResultsById';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { getWidgetInputBlocksFromPlugins } from '@/app/canvas/utils/getWidgetInputBlocksFromPlugins';
import { isPageContentOverflow } from '@/app/canvas/utils/isPageContentOverflow';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { Widget } from '@/app/types';
import { ProjectInfo } from '@/app/types';
import { cn } from '@/lib/utils/twmerge';
import {
  A4_MARGIN,
  GRID_ROWS,
  GRID_COLUMNS,
  GRID_WIDTH,
  GRID_ROW_HEIGHT,
  GRID_HEIGHT,
  CONTAINER_PAD,
  A4_HEIGHT,
  A4_WIDTH,
} from './dimensionsConstants';
import { ReportAlgorithmsDrawer } from './drawers/reportAlgorithms';
import { ReportInputBlocksDrawer } from './drawers/reportInputBlocks';
import { TestResultsDrawer } from './drawers/testResultsDrawer';
import { EditingOverlay } from './editingOverlay';
import { FreeFormDraggableArea } from './freeFormDraggableArea';
import { GridItemComponent } from './gridItemComponent';
import { GridLines } from './gridLines';
import {
  pagesDesignReducer,
  initialState,
  WidgetAlgoAndResultIdentifier,
} from './hooks/pagesDesignReducer';
import { useDragToScroll } from './hooks/useDragToScroll';
import { usePrintable } from './hooks/usePrintable';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PageNumber } from './pageNumber';
import { PluginsPanel } from './pluginsPanel';
import { ResizeHandle } from './resizeHandle';
import { ZoomControl } from './zoomControl';

type GridItemDivRequiredStyles =
  `grid-comp-wrapper relative group z-10${string}`; // mandatory to have relative and group

type DesignerProps = {
  project: ProjectInfo;
  allPluginsWithMdx: PluginForGridLayout[];
  allTestResults: ParsedTestResults[]; // ParsedTestResult should have value of 'output' property in the form of Javascript object
  selectedTestResultsFromUrlParams?: ParsedTestResults[];
};

type EventDataTransfer = Event & {
  dataTransfer: {
    getData: (type: 'application/json') => string;
  };
};

const pagesContentWrapperId = 'printableContent'; // element id for the pages wrapper (used for printing)

const gridItemDivRequiredStyles: GridItemDivRequiredStyles = `grid-comp-wrapper relative group z-10
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

function Designer(props: DesignerProps) {
  const {
    project,
    allPluginsWithMdx,
    allTestResults = [],
    selectedTestResultsFromUrlParams = [],
  } = props;
  console.log('project', project);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const freeFormAreaRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(pagesDesignReducer, initialState);
  const { layouts, currentPage, showGrid } = state;
  const [newDraggedWidget, setNewDraggedWidget] = useState<Widget | null>(null);
  const [draggingGridItemId, setDraggingGridItemId] = useState<string | null>(
    null
  );
  const [resizingGridItemId, setResizingGridItemId] = useState<string | null>(
    null
  );
  const [selectedGridItemId, setSelectedGridItemId] = useState<string | null>(
    null
  );
  const [editingGridItem, setEditingGridItem] = useState<
    [WidgetOnGridLayout, HTMLDivElement] | null
  >(null);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const { zoomLevel, resetZoom, zoomIn, zoomOut } = useZoom();
  const [selectedTestResults, setSelectedTestResults] = useState<
    ParsedTestResults[]
  >(selectedTestResultsFromUrlParams);
  const {
    isDragging: isDraggingFreeFormArea,
    handleMouseDown: handleFreeFormAreaMouseDown,
    handleMouseUp: handleFreeFormAreaMouseUp,
    handleMouseMove: handleFreeFormAreaMouseMove,
  } = useDragToScroll(freeFormAreaRef, canvasRef);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const canvasPrint = usePrintable({ printableId: pagesContentWrapperId });

  useEffect(() => {
    // position free form area horizontal - centered. Then flag initial mount as done.
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
        // Add a temporary scroll margin
        newPageElement.style.scrollMarginTop = `${zoomLevel + 100}px`; // Adjust this value as needed
        setTimeout(() => {
          newPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          newPageElement.style.scrollMarginTop = ''; // remove the temp margin
        }, 0);
      }
    }
  }, [layouts.length]);

  useEffect(() => {
    if (isInitialMount.current) return;

    setTimeout(() => {
      const { overflows, numOfRequiredPages } = isPageContentOverflow(
        layouts[currentPage],
        state.widgets[currentPage]
      );

      // Count existing overflow pages for current page
      const existingOverflowPages = state.pageTypes.filter(
        (type, idx) =>
          type === 'overflow' && state.overflowParents[idx] === currentPage
      ).length;

      if (overflows && existingOverflowPages < numOfRequiredPages - 1) {
        dispatch({
          type: 'ADD_OVERFLOW_PAGES',
          parentPageIndex: currentPage,
          count: numOfRequiredPages - 1 - existingOverflowPages,
        });
      } else if (!overflows && existingOverflowPages > 0) {
        dispatch({
          type: 'REMOVE_OVERFLOW_PAGES',
          parentPageIndex: currentPage,
        });
      }
    }, 0);
  }, [
    layouts[currentPage],
    state.widgets[currentPage],
    state.pageTypes,
    state.overflowParents,
  ]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.grid-comp-wrapper')) {
        // All grid items have 'group' class
        setSelectedGridItemId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWidgetDrop =
    (pageIndex: number) =>
    (_layout: Layout[], item: Layout, e: EventDataTransfer) => {
      console.log(
        `[handleWidgetDrop] Dropping widget at page ${pageIndex}, position: (${item.x}, ${item.y})`
      );
      setDraggingGridItemId(null);
      let data: unknown;
      try {
        data = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch (error) {
        console.error('Invalid widget item json', error);
        return;
      }
      const result = widgetItemSchema.safeParse(data);
      if (!result.success) {
        console.error('Invalid widget item data', result.error);
        return;
      }
      if (result.data.gridItemId) {
        // todo - for handling existing grid item id
        console.log(data);
        return;
      }
      const validData: WidgetCompositeId = result.data;
      const widget = findWidgetFromPluginsById(
        allPluginsWithMdx,
        validData.gid,
        validData.cid
      );
      if (!widget) {
        console.error(
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
      const algos = getWidgetAlgosFromPlugins(allPluginsWithMdx, widget);
      const gridItemToAlgosMap: WidgetAlgoAndResultIdentifier[] = algos.map(
        (algo) => {
          const matchSelectedResult = findTestResultById(
            selectedTestResults,
            algo.gid,
            algo.cid
          );
          return {
            gid: algo.gid,
            cid: algo.cid,
            testResultsCreatedAt: matchSelectedResult?.created_at,
          };
        }
      );

      const inputBlocks = getWidgetInputBlocksFromPlugins(
        allPluginsWithMdx,
        widgetWithGridItemId
      );

      dispatch({
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout,
        widget: widgetWithGridItemId,
        gridItemAlgosMap: gridItemToAlgosMap,
        algorithms: algos,
        inputBlocks,
        pageIndex,
      });
    };

  const handleGridItemResizeStart = (
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) => {
    console.log(
      `[handleGridItemResizeStart] Starting resize of item ${itemLayout.i}`
    );
    const { i } = itemLayout;
    setResizingGridItemId(i);
  };

  const handleGridItemResizeStop =
    (pageIndex: number) =>
    (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
      console.log(
        `[handleGridItemResizeStop] Finished resizing item ${itemLayout.i} to w:${itemLayout.w}, h:${itemLayout.h}`
      );
      setResizingGridItemId(null);
      const { x, y, w, h, minW, minH, maxW, maxH, i } = itemLayout;
      dispatch({
        type: 'RESIZE_WIDGET',
        itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
        pageIndex,
      });
    };

  const handleGridItemDragStart = (
    _layouts: Layout[],
    _: Layout,
    itemLayout: Layout
  ) => {
    console.log(
      `[handleGridItemDragStart] Starting drag of item ${itemLayout.i}`
    );
    setDraggingGridItemId(itemLayout.i);
  };

  const handleGridItemDragStop =
    (pageIndex: number) =>
    (_layouts: Layout[], oldItem: Layout, newItem: Layout) => {
      console.log(
        `[handleGridItemDragStop] Moving item ${newItem.i} from (${oldItem.x},${oldItem.y}) to (${newItem.x},${newItem.y})`
      );
      if (oldItem.x === newItem.x && oldItem.y === newItem.y) {
        setDraggingGridItemId(null);
        return; // Position didn't change, skip dispatch
      }
      const { x, y, w, h, minW, minH, maxW, maxH, i } = newItem;
      dispatch({
        type: 'CHANGE_WIDGET_POSITION',
        itemLayout: { x, y, w, h, minW, minH, maxW, maxH, i },
        pageIndex,
      });
      setDraggingGridItemId(null);
    };

  const handleDeleteGridItem =
    (pageIndex: number, widgetIndex: number) => () => {
      console.log(
        `[handleDeleteGridItem] Deleting widget at page ${pageIndex}, index ${widgetIndex}`
      );
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
      console.log(
        `[handleGridItemEditClick] Editing widget ${gridItemId} on page ${pageIndex}`
      );
      setEditingGridItem([widget, gridItemHtmlElement]);
      setEditingPageIndex(pageIndex);
    };

  function handleEditClose(updatedWidget: WidgetOnGridLayout) {
    console.log(
      `[handleEditClose] Saving changes to widget ${updatedWidget.gridItemId}`
    );
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
    console.log('[handleAddNewPage] Adding new page');
    dispatch({
      type: 'ADD_NEW_PAGE',
    });
  }

  function handlePageChange(pageIndex: number) {
    console.log(`[handlePageChange] Switching to page ${pageIndex}`);
    dispatch({
      type: 'SET_CURRENT_PAGE',
      pageIndex,
    });
    const pageElement = document.getElementById(`page-${pageIndex}`);
    pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleNextPage() {
    console.log('[handleNextPage] Moving to next page');
    if (currentPage < layouts.length - 1) {
      handlePageChange(currentPage + 1);
    }
  }

  function handlePreviousPage() {
    console.log('[handlePreviousPage] Moving to previous page');
    if (currentPage > 0) {
      handlePageChange(currentPage - 1);
    }
  }

  function handleDeletePage(pageIndex: number) {
    console.log(`[handleDeletePage] Attempting to delete page ${pageIndex}`);
    if (layouts.length > 1) {
      dispatch({
        type: 'DELETE_PAGE',
        pageIndex,
      });
    } else {
      console.warn('Cannot delete the last remaining page.');
    }
  }

  function handleSelectUploadedTestResults(results: ParsedTestResults[]) {
    console.log(
      `[handleSelectUploadedTestResults] Updating with ${results.length} test results`
    );
    if (results.length === 0) {
      setSelectedTestResults((prev) => {
        const updatedResults = prev.map((result) => ({
          gid: result.gid,
          cid: result.cid,
          testResultsCreatedAt: undefined,
        }));
        dispatch({
          type: 'UPDATE_ALGO_TRACKER',
          gridItemAlgosMap: updatedResults,
        });
        return [];
      });
      return;
    }
    setSelectedTestResults(results);
    dispatch({
      type: 'UPDATE_ALGO_TRACKER',
      gridItemAlgosMap: results.map((result) => ({
        gid: result.gid,
        cid: result.cid,
        testResultsCreatedAt:
          results.length > 0 ? result.created_at : undefined,
      })),
    });
  }

  const contentWrapperMinHeight = useMemo(() => {
    const totalPagesHeight = layouts.length * GRID_HEIGHT;
    const containerPadding = CONTAINER_PAD + CONTAINER_PAD;
    const totalHeight = totalPagesHeight + containerPadding;

    if (layouts.length === 1 && freeFormAreaRef.current) {
      const viewportHeight = freeFormAreaRef.current.clientHeight;
      return Math.max(viewportHeight, totalHeight);
    }

    return totalHeight;
  }, [layouts.length]);

  const pageControlsSection = (
    <section className="fixed right-[100px] top-[120px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
        <button
          className="disabled:opacity-50"
          title="Print"
          onClick={canvasPrint.print}>
          <RiPrinterLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
        </button>
      </div>
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
      <ReportAlgorithmsDrawer algorithms={state.algorithmsOnReport} />
      <ReportInputBlocksDrawer inputBlocks={state.inputBlocksOnReport} />
    </section>
  );

  const pluginsPanelSection = (
    <section
      className={cn(
        'absolute z-10 flex h-full flex-col bg-secondary-900 transition-all duration-300',
        isPanelOpen ? 'w-[300px]' : 'w-[40px]'
      )}>
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute -right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-900 text-white hover:bg-secondary-800">
        {isPanelOpen ? <RiArrowLeftLine /> : <RiArrowRightLine />}
      </button>

      {!isPanelOpen && (
        <div className="absolute left-3.5 top-[130px] origin-left -translate-y-1/2 -rotate-90 whitespace-nowrap text-sm text-white">
          Plugins / Widgets
        </div>
      )}

      <div className={cn('p-4', !isPanelOpen && 'hidden')}>
        <h4 className="mb-0 text-lg font-bold">{project.projectInfo.name}</h4>
        <p className="text-sm text-white">{project.projectInfo.description}</p>
        <PluginsPanel
          plugins={allPluginsWithMdx}
          className="custom-scrollbar w-full overflow-auto pr-[10px] pt-[50px]"
          onDragStart={(widget) => setNewDraggedWidget(widget)}
          onDragEnd={() => setNewDraggedWidget(null)}
        />
      </div>
    </section>
  );

  const droppingItemPlaceholder = newDraggedWidget
    ? {
        // makes the dropping red placeholder size of the widget
        i: '__dropping-elem__',
        w: newDraggedWidget.widgetSize.maxW,
        h: newDraggedWidget.widgetSize.minH,
      }
    : undefined;

  const pagesSection = (
    <FreeFormDraggableArea
      ref={freeFormAreaRef}
      pagesLength={layouts.length}
      zoomLevel={zoomLevel}
      contentWrapperMinHeight={contentWrapperMinHeight}
      onMouseDown={
        !draggingGridItemId && !resizingGridItemId
          ? handleFreeFormAreaMouseDown
          : undefined
      }
      onMouseUp={
        !draggingGridItemId && !resizingGridItemId
          ? handleFreeFormAreaMouseUp
          : undefined
      }
      onMouseMove={
        isDraggingFreeFormArea && !draggingGridItemId && !resizingGridItemId
          ? handleFreeFormAreaMouseMove
          : undefined
      }
      onMouseLeave={
        !draggingGridItemId && !resizingGridItemId
          ? handleFreeFormAreaMouseUp
          : undefined
      }>
      <div
        id={pagesContentWrapperId}
        ref={canvasPrint.contentRef}
        className="flex flex-col">
        {state.layouts.map((layout, pageIndex) => {
          const isOverflowPage = state.pageTypes[pageIndex] === 'overflow';
          const overflowParent = state.overflowParents[pageIndex];

          return (
            <div
              id={`page-${pageIndex}`}
              key={`page-${pageIndex}`}
              ref={canvasRef}
              className={cn(
                'standard-report-page',
                'relative bg-white text-black shadow',
                'cursor-default active:cursor-default',
                isOverflowPage && 'pointer-events-none',
                !isOverflowPage && 'mt-2'
              )}
              style={{
                height: isOverflowPage ? A4_HEIGHT : 'auto',
                width: isOverflowPage ? A4_WIDTH : 'auto',
              }}>
              {!isOverflowPage && showGrid && (
                <GridLines
                  columns={GRID_COLUMNS}
                  rows={GRID_ROWS}
                  padding={A4_MARGIN}
                  className="print:hidden"
                />
              )}
              <PageNumber
                pageNumber={pageIndex + 1}
                onDeleteClick={
                  !isOverflowPage
                    ? () => handleDeletePage(pageIndex)
                    : undefined
                }
                isOverflowPage={isOverflowPage}
                zoomLevel={zoomLevel}
                className="print:hidden"
              />
              {isOverflowPage && overflowParent !== null ? (
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    height: A4_HEIGHT,
                    width: A4_WIDTH,
                  }}>
                  <div className="text-sm text-gray-200">
                    Overflow content from page {overflowParent + 1}
                  </div>
                </div>
              ) : (
                <GridLayout
                  layout={layout}
                  width={GRID_WIDTH}
                  rowHeight={GRID_ROW_HEIGHT}
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
                  isBounded={true}
                  allowOverlap={false}
                  useCSSTransforms={!isInitialMount.current}
                  resizeHandle={<ResizeHandle />}
                  resizeHandles={['sw', 'nw', 'se', 'ne']}
                  style={{
                    height: GRID_HEIGHT,
                    width: GRID_WIDTH,
                    margin: `${A4_MARGIN}px`,
                  }}
                  className="[&>*]:text-inherit"
                  droppingItem={droppingItemPlaceholder}>
                  {state.widgets[pageIndex].map((widget, widgetIndex) => {
                    if (!widget.gridItemId) return null;
                    return (
                      <div
                        /*
                        Avoid adding onClick event handler to this grid item component wrapper.
                        If a handler function is required in the future, stop event proparation in that handler.
                      */
                        id={widget.gridItemId}
                        key={widget.gridItemId}
                        className={cn(
                          gridItemDivRequiredStyles,
                          selectedGridItemId === widget.gridItemId &&
                            'outline outline-2 outline-offset-2 outline-blue-500'
                        )}>
                        <GridItemComponent
                          allAvalaiblePlugins={allPluginsWithMdx}
                          widget={widget}
                          onDeleteClick={handleDeleteGridItem(
                            pageIndex,
                            widgetIndex
                          )}
                          onEditClick={handleGridItemEditClick(pageIndex)}
                          isDragging={draggingGridItemId === widget.gridItemId}
                          isResizing={resizingGridItemId === widget.gridItemId}
                          testResultsUsed={
                            state.gridItemToAlgosMap[widget.gridItemId]
                          }
                          testResults={allTestResults}
                          layout={state.layouts[pageIndex][widgetIndex]}
                        />
                      </div>
                    );
                  })}
                </GridLayout>
              )}
            </div>
          );
        })}
      </div>
    </FreeFormDraggableArea>
  );

  const testControlsSection = (
    <section
      className={cn(
        'fixed top-[90px] z-10 flex flex-col gap-4',
        isPanelOpen ? 'left-[340px]' : 'left-[100px]'
      )}>
      <TestResultsDrawer
        allTestResults={allTestResults}
        selectedTestResultsFromUrlParams={selectedTestResults}
        onOkClick={handleSelectUploadedTestResults}
      />
    </section>
  );

  console.log('state', state);
  // console.log('plugins', allPluginsWithMdx);

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
