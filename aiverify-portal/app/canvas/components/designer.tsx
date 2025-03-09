'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  RiGridLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPrinterLine,
  RiEditLine,
  RiEyeLine,
  RiSaveLine,
} from '@remixicon/react';
import { debounce } from 'lodash';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout as GridLayoutType } from 'react-grid-layout';
import { z } from 'zod';
import {
  ParsedTestResults,
  PluginForGridLayout,
  WidgetOnGridLayout,
} from '@/app/canvas/types';
import { findInputBlockDataByGidAndCid } from '@/app/canvas/utils/findInputBlockDataByGidAndCid';
import { findTestResultByAlgoGidAndCid } from '@/app/canvas/utils/findTestResultByAlgoGidAndCid';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { getWidgetInputBlocksFromPlugins } from '@/app/canvas/utils/getWidgetInputBlocksFromPlugins';
import { isPageContentOverflow } from '@/app/canvas/utils/isPageContentOverflow';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { ProjectOutput } from '@/app/canvas/utils/transformProjectOutputToState';
import {
  InputBlockData,
  Widget,
  Project,
  ProjectInfo,
  Algorithm,
  InputBlock,
} from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Button } from '@/lib/components/TremurButton';
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
import { InputBlockDatasDrawer } from './drawers/inputBlockDatasDrawer';
import { ReportAlgorithmsDrawer } from './drawers/reportAlgorithms';
import { ReportInputBlocksDrawer } from './drawers/reportInputBlocks';
import { TestResultsDrawer } from './drawers/testResultsDrawer';
import { EditingOverlay } from './editingOverlay';
import { FreeFormDraggableArea } from './freeFormDraggableArea';
import { GridItemComponent } from './gridItemComponent';
import { GridLines } from './gridLines';
import {
  State,
  pagesDesignReducer,
  initialState,
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from './hooks/pagesDesignReducer';
import { useCanvasState } from './hooks/useCanvasState';
import { useDragToScroll } from './hooks/useDragToScroll';
import { usePrintable } from './hooks/usePrintable';
import { useZoom } from './hooks/useZoom';
import { PageNavigation } from './pageNavigation';
import { PageNumber } from './pageNumber';
import { PluginsPanel } from './pluginsPanel';
import { ResizeHandle } from './resizeHandle';
import { ZoomControl } from './zoomControl';
import { useRouter, useSearchParams } from 'next/navigation';
import { CanvasHeader } from './header';
import { Modal } from '@/lib/components/modal';

type GridItemDivRequiredStyles =
  `grid-comp-wrapper relative group z-10${string}`; // mandatory to have relative and group

type Layout = GridLayoutType & {
  widget?: WidgetOnGridLayout;
};

type ProjectPage = {
  layouts: Layout[];
  reportWidgets: WidgetOnGridLayout[];
};

type DesignerProps = {
  /** Identifies the user flow/journey context in which the designer is being used */
  flow: UserFlows;

  /** Contains information about the current project including pages, global vars, and other data */
  project: Project;

  /** Initial state for the canvas */
  initialState: State;

  /** Collection of all available plugins with their MDX source code that can be used in the designer */
  allPluginsWithMdx: PluginForGridLayout[];

  /** All test results available in the system that can be applied to widgets */
  allTestResultsOnSystem: ParsedTestResults[]; // ParsedTestResult should have value of 'output' property in the form of Javascript object

  /** All input block datas available in the system that can be applied to widgets */
  allInputBlockDatasOnSystem: InputBlockData[];

  /** Pre-selected test results based on URL parameters */
  selectedTestResultsFromUrlParams?: ParsedTestResults[];

  /** Pre-selected input block datas based on URL parameters */
  selectedInputBlockDatasFromUrlParams?: InputBlockData[];

  /** When true, disables editing functionality (view-only mode) */
  disabled?: boolean;

  /** When true, hides the Next button in the navigation */
  disableNextButton?: boolean;

  /** When true, hides the Back button in the navigation */
  disablePreviousButton?: boolean;

  /** Controls the page navigation mode: 'multi' shows all pages at once, 'single' shows only one page */
  pageNavigationMode?: 'multi' | 'single';
};

type EventDataTransfer = Event & {
  dataTransfer: {
    getData: (type: 'application/json') => string;
  };
};

const pagesContentWrapperId = 'printableContent'; // element id for the pages wrapper (used for printing)
const criticalGridItemWrapperClass = 'grid-comp-wrapper'; // class for the grid item wrapper used in some event handling
const gridItemDivRequiredStyles: GridItemDivRequiredStyles = `${criticalGridItemWrapperClass} relative group z-10
  hover:outline hover:outline-2 
  hover:outline-blue-500 hover:outline-offset-2
  active:outline-none
  w-full h-full
  [&>.react-grid-item]:w-full [&>.react-grid-item]:h-full`;

const widgetItemSchema = z.object({
  gridItemId: z.string().optional(),
  gid: z.string(),
  cid: z.string(),
});

export type WidgetCompositeId = z.infer<typeof widgetItemSchema>;

/**
 * Creates a unique identifier for a grid item by combining:
 * - The plugin's global ID (gid)
 * - The widget's component ID (cid)
 * - The page index
 * - Current timestamp
 * - Random string
 *
 * @param widget - The widget to create an ID for
 * @param pageIndex - The index of the page the widget is on
 * @returns A unique string ID in format: "{gid}-{cid}-p{pageIndex}-{timestamp}-{random}"
 */

function createGridItemId(widget: Widget, pageIndex: number) {
  return `${widget.gid}-${widget.cid}-p${pageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Designer(props: DesignerProps) {
  const {
    flow,
    project,
    initialState,
    allPluginsWithMdx,
    allTestResultsOnSystem = [],
    allInputBlockDatasOnSystem = [],
    selectedTestResultsFromUrlParams = [],
    selectedInputBlockDatasFromUrlParams = [],
    disabled = false,
    disableNextButton = false,
    disablePreviousButton = false,
    pageNavigationMode = 'multi',
  } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  // All hooks must be called before any conditional returns
  console.log('project', project);
  console.log('flow', flow);
  const canvasState = useCanvasState(initialState);
  console.log('initialState', canvasState);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const freeFormAreaRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = canvasState;
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
  const [selectedInputBlockDatas, setSelectedInputBlockDatas] = useState<
    InputBlockData[]
  >(selectedInputBlockDatasFromUrlParams);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const canvasPrint = usePrintable({ printableId: pagesContentWrapperId });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(
    null
  );

  // Calculate the minimum height required for the content wrapper
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

  // Create a memoized handler for widget drops
  const handleWidgetDrop = useMemo(() => {
    return (pageIndex: number) => {
      return (_layout: Layout[], item: Layout, e: EventDataTransfer) => {
        // Capture the data from the event immediately
        let jsonData: string;
        try {
          jsonData = e.dataTransfer.getData('application/json');
        } catch (error) {
          console.error('Failed to get data from event', error);
          return;
        }

        // Now debounce the processing of that data
        const processDroppedWidget = debounce(() => {
          console.log(
            `[handleWidgetDrop] Dropping widget at page ${pageIndex}, position: (${item.x}, ${item.y})`
          );
          setDraggingGridItemId(null);

          // Parse the JSON data we captured earlier
          let data: unknown;
          try {
            data = JSON.parse(jsonData);
          } catch (error) {
            console.error('Invalid widget item json', error);
            return;
          }

          // Validate the widget data structure using Zod schema
          const result = widgetItemSchema.safeParse(data);
          if (!result.success) {
            console.error('Invalid widget item data', result.error);
            return;
          }

          // Handle case where an existing widget is being moved (not implemented yet)
          if (result.data.gridItemId) {
            // todo - for handling existing grid item id
            console.log(data);
            return;
          }

          // Find the widget definition from available plugins
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

          // Initialize the widget with default data and create a unique ID
          const widgetWithInitialData: WidgetOnGridLayout =
            populateInitialWidgetResult(widget);
          const gridItemId = createGridItemId(widget, pageIndex);

          // Configure the layout properties for the new widget
          // Uses maximum width and minimum height as initial dimensions
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

          // Assign the grid item ID to the widget
          const widgetWithGridItemId: WidgetOnGridLayout = {
            ...widgetWithInitialData,
            gridItemId,
          };

          // Get algorithms associated with this widget and map them to test results
          const algos = getWidgetAlgosFromPlugins(allPluginsWithMdx, widget);
          const gridItemToAlgosMap: WidgetAlgoAndResultIdentifier[] = algos.map(
            (algo) => {
              const matchSelectedResult = findTestResultByAlgoGidAndCid(
                selectedTestResults,
                algo.gid,
                algo.cid
              );
              return {
                gid: algo.gid,
                cid: algo.cid,
                testResultId: matchSelectedResult?.id,
              };
            }
          );

          // Get input blocks associated with this widget
          const inputBlocks = getWidgetInputBlocksFromPlugins(
            allPluginsWithMdx,
            widgetWithGridItemId
          );

          // Map input block datas to input blocks based on matching gid, cid and group
          const gridItemToInputBlockDatasMap: WidgetInputBlockIdentifier[] =
            inputBlocks.map((inputBlock) => {
              const matchSelectedInputBlockData = findInputBlockDataByGidAndCid(
                selectedInputBlockDatas,
                inputBlock.gid,
                inputBlock.cid
              );
              return {
                gid: inputBlock.gid,
                cid: inputBlock.cid,
                inputBlockDataId: matchSelectedInputBlockData?.id,
              };
            });

          // Dispatch action to add the widget to the canvas state
          dispatch({
            type: 'ADD_WIDGET_TO_CANVAS',
            itemLayout,
            widget: widgetWithGridItemId,
            gridItemAlgosMap: gridItemToAlgosMap,
            gridItemInputBlockDatasMap: gridItemToInputBlockDatasMap,
            algorithms: algos,
            inputBlocks,
            pageIndex,
          });
        }, 100);

        // Execute the debounced function
        processDroppedWidget();
      };
    };
  }, [allPluginsWithMdx, selectedTestResults, selectedInputBlockDatas]);

  // Create a memoized handler for grid item drag stop
  const handleGridItemDragStop = useMemo(() => {
    return (pageIndex: number) => {
      return (_layouts: Layout[], oldItem: Layout, newItem: Layout) => {
        console.log(
          `[handleGridItemDragStop] Moving item ${newItem.i} from (${oldItem.x},${oldItem.y}) to (${newItem.x},${newItem.y})`
        );

        // Skip state update if position didn't actually change
        // This prevents unnecessary re-renders
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
    };
  }, []);

  // Create a memoized handler for grid item resize stop
  const handleGridItemResizeStop = useMemo(() => {
    return (pageIndex: number) => {
      return (_layouts: Layout[], _: Layout, itemLayout: Layout) => {
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
    };
  }, []);

  // Initialize the input block data tracker with the selected input block datas from URL params
  useEffect(() => {
    if (selectedInputBlockDatasFromUrlParams.length > 0) {
      dispatch({
        type: 'UPDATE_INPUT_BLOCK_TRACKER',
        gridItemInputBlockDatasMap: selectedInputBlockDatasFromUrlParams.map(
          (inputBlockData) => ({
            gid: inputBlockData.gid,
            cid: inputBlockData.cid,
            inputBlockDataId: inputBlockData.id,
          })
        ) as WidgetInputBlockIdentifier[],
      });
    }
  }, [selectedInputBlockDatasFromUrlParams]);

  // Initialize the test result tracker with the selected test results from URL params
  useEffect(() => {
    if (selectedTestResultsFromUrlParams.length > 0) {
      dispatch({
        type: 'UPDATE_ALGO_TRACKER',
        gridItemAlgosMap: selectedTestResultsFromUrlParams.map((result) => ({
          gid: result.gid,
          cid: result.cid,
          testResultId: result.id,
        })),
      });
    }
  }, [selectedTestResultsFromUrlParams]);

  // Initialize the state with template data
  /* useEffect(() => {
    if (project.pages && project.pages.length > 0) {
      // Convert template pages to layouts and widgets
      console.log('proj given before', project);

      // Process each page's widgets similar to handleWidgetDrop
      const layouts: Layout[][] = (
        (project as Project).pages as ProjectPage[]
      ).map((page: ProjectPage, pageIndex: number) =>
        page.reportWidgets.map((widget: WidgetOnGridLayout) => {
          // Create a unique grid item ID
          const gridItemId =
            widget.gridItemId || createGridItemId(widget, pageIndex);

          // Get the widget's size properties
          const { minW, minH, maxH, maxW } = widget.widgetSize;
          console.log('widget size creation', widget.widgetSize);

          // Find the corresponding layout for this widget
          const existingLayout = page.layouts[
            page.reportWidgets.indexOf(widget)
          ] || {
            x: 0,
            y: 0,
          };
          console.log('existing layout creation', existingLayout);

          // Create the layout item with proper sizing
          const itemLayout = {
            ...existingLayout,
            i: gridItemId,
            minW,
            minH,
            maxW,
            maxH,
            static: false,
            isDraggable: true,
            isResizable: true,
            isBounded: true,
          };

          console.log('Created layout for widget:', itemLayout);
          return itemLayout;
        })
      );

      const widgets: WidgetOnGridLayout[][] = (
        (project as Project).pages as ProjectPage[]
      ).map((page: ProjectPage, pageIndex: number) =>
        page.reportWidgets.map((widget: WidgetOnGridLayout) => ({
          ...widget,
          gridItemId: widget.gridItemId || createGridItemId(widget, pageIndex),
        }))
      );

      // Initialize page types and overflow parents
      const pageTypes: ('grid' | 'overflow')[] = (project as Project).pages.map(
        () => 'grid'
      );
      const overflowParents: Array<number | null> = (
        project as Project
      ).pages.map(() => null);

      // Initialize algorithms and input blocks
      const algorithmsOnReport: Algorithm[] = [];
      const inputBlocksOnReport: InputBlock[] = [];
      const gridItemToAlgosMap: Record<
        string,
        WidgetAlgoAndResultIdentifier[]
      > = {};
      const gridItemToInputBlockDatasMap: Record<
        string,
        WidgetInputBlockIdentifier[]
      > = {};

      // Process each widget to collect algorithms and input blocks
      ((project as Project).pages as ProjectPage[]).forEach(
        (page: ProjectPage, pageIndex: number) => {
          page.reportWidgets.forEach((widget: WidgetOnGridLayout) => {
            const gridItemId =
              widget.gridItemId || createGridItemId(widget, pageIndex);

            // Collect algorithms
            const algos = getWidgetAlgosFromPlugins(allPluginsWithMdx, widget);
            algorithmsOnReport.push(...algos);

            // Collect input blocks
            const inputBlocks = getWidgetInputBlocksFromPlugins(
              allPluginsWithMdx,
              widget
            );
            inputBlocksOnReport.push(...inputBlocks);

            // Map algorithms to grid items
            gridItemToAlgosMap[gridItemId] = algos.map((algo) => ({
              gid: algo.gid,
              cid: algo.cid,
            }));

            // Map input blocks to grid items
            gridItemToInputBlockDatasMap[gridItemId] = inputBlocks.map(
              (inputBlock) => ({
                gid: inputBlock.gid,
                cid: inputBlock.cid,
              })
            );
          });
        }
      );

      // Dispatch initialization action
      dispatch({
        type: 'INITIALIZE_WITH_TEMPLATE',
        layouts,
        widgets,
        algorithmsOnReport,
        inputBlocksOnReport,
        gridItemToAlgosMap,
        gridItemToInputBlockDatasMap,
        pageTypes,
        overflowParents,
      });
    }
  }, [project.pages, allPluginsWithMdx]); */

  // Drag-to-scroll functionality for navigating the canvas
  useDragToScroll(freeFormAreaRef, canvasRef);

  // Centers the free form area horizontally on initial load
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

  // Scrolls to newly added pages when layouts change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const debouncedScrollToNewPage = debounce(() => {
      if (layouts.length > 0) {
        const newPageElement = document.getElementById(
          `page-${layouts.length - 1}`
        );
        if (newPageElement) {
          newPageElement.style.scrollMarginTop = `${zoomLevel + 100}px`;
          newPageElement.scrollIntoView({ block: 'start' });
          newPageElement.style.scrollMarginTop = '';
        }
      }
    }, 200);

    debouncedScrollToNewPage();

    return () => {
      debouncedScrollToNewPage.cancel();
    };
  }, [layouts.length, zoomLevel]);

  // Manages overflow pages based on content size
  useEffect(() => {
    if (isInitialMount.current) return;

    const debouncedOverflowCheck = debounce(() => {
      layouts.forEach((layout, pageIndex) => {
        if (state.pageTypes[pageIndex] === 'overflow') return;

        const { overflows, numOfRequiredPages } = isPageContentOverflow(
          layouts[pageIndex],
          state.widgets[pageIndex]
        );

        const existingOverflowPages = state.pageTypes.filter(
          (type, idx) =>
            type === 'overflow' && state.overflowParents[idx] === pageIndex
        ).length;

        if (overflows && existingOverflowPages < numOfRequiredPages - 1) {
          dispatch({
            type: 'ADD_OVERFLOW_PAGES',
            parentPageIndex: pageIndex,
            count: numOfRequiredPages - 1 - existingOverflowPages,
          });
        } else if (!overflows && existingOverflowPages > 0) {
          dispatch({
            type: 'REMOVE_OVERFLOW_PAGES',
            parentPageIndex: pageIndex,
          });
        }
      });
    }, 300);

    debouncedOverflowCheck();

    return () => {
      debouncedOverflowCheck.cancel();
    };
  }, [layouts, state.widgets, state.pageTypes, state.overflowParents]);

  // Handles deselection of grid items when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${criticalGridItemWrapperClass}`)) {
        setSelectedGridItemId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  console.log('allPluginsWithMdx', allPluginsWithMdx);

  // Determines the back button link based on the current user flow
  let updatedBackFlow = flow;
  if (flow === UserFlows.NewProjectWithExistingTemplateAndResults) {
    updatedBackFlow = UserFlows.NewProjectWithExistingTemplate;
  } else if (flow === UserFlows.NewProjectWithNewTemplateAndResults) {
    updatedBackFlow = UserFlows.NewProjectWithNewTemplate;
  }

  let backButtonLink = `/project/select_data?flow=${updatedBackFlow}&projectId=${project?.id}`;

  /**
   * Handles the start of a resize operation on a grid item
   * Tracks which item is being resized to manage UI state
   */
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

  /**
   * Handles the start of a drag operation on a grid item
   * Tracks which item is being dragged to manage UI state
   */
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

  /**
   * Creates a handler function to delete a specific widget
   *
   * @param pageIndex - The page containing the widget to delete
   * @param widgetIndex - The index of the widget in the page's widgets array
   * @returns A callback function that deletes the widget when called
   */
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

  /**
   * Creates a handler function to edit a specific widget
   * Sets up the editing state with the widget and its HTML element
   *
   * @param pageIndex - The page containing the widget to edit
   * @returns A callback function that initiates editing for the widget
   */
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

  /**
   * Handles saving changes after editing a widget
   * Updates the widget in the state and clears the editing state
   *
   * @param updatedWidget - The widget with updated properties
   */
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

  /**
   * Adds a new blank page to the report
   * Dispatches an action to create the page in the state
   */
  function handleAddNewPage() {
    console.log('[handleAddNewPage] Adding new page');
    dispatch({
      type: 'ADD_NEW_PAGE',
    });
  }

  /**
   * Changes the current active page
   * Updates the state and scrolls to the selected page
   *
   * @param pageIndex - The index of the page to switch to
   */
  function handlePageChange(pageIndex: number) {
    console.log(`[handlePageChange] Switching to page ${pageIndex}`);
    dispatch({
      type: 'SET_CURRENT_PAGE',
      pageIndex,
    });
    const pageElement = document.getElementById(`page-${pageIndex}`);
    if (pageElement) {
      pageElement.style.scrollMarginTop = `${zoomLevel + 100}px`; // Adjust this value as needed
      pageElement.scrollIntoView({ block: 'start' });
      pageElement.style.scrollMarginTop = ''; // remove the temp margin
    }
  }

  /**
   * Navigates to the next page if available
   * Uses handlePageChange to perform the actual navigation
   */
  function handleNextPage() {
    console.log('[handleNextPage] Moving to next page');
    if (currentPage < layouts.length - 1) {
      handlePageChange(currentPage + 1);
    }
  }

  /**
   * Navigates to the previous page if available
   * Uses handlePageChange to perform the actual navigation
   */
  function handlePreviousPage() {
    console.log('[handlePreviousPage] Moving to previous page');
    if (currentPage > 0) {
      handlePageChange(currentPage - 1);
    }
  }

  /**
   * Deletes a page from the report
   * Prevents deletion of the last remaining page
   *
   * @param pageIndex - The index of the page to delete
   */
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

  /**
   * Updates the selected test results and applies them to widgets
   * Maps test results to algorithms based on matching gid and cid
   *
   * @param results - The array of test results selected by the user
   */
  function handleSelectUploadedTestResults(results: ParsedTestResults[]) {
    console.log(
      `[handleSelectUploadedTestResults] Updating with ${results.length} test results`
    );

    // Special case: when no results are selected, clear all test result associations
    if (results.length === 0) {
      // Create a map with undefined testResultId for all existing algorithms
      setSelectedTestResults((prev) => {
        const updatedResults = prev.map((result) => ({
          gid: result.gid,
          cid: result.cid,
          testResultId: undefined,
        }));
        dispatch({
          type: 'UPDATE_ALGO_TRACKER',
          gridItemAlgosMap: updatedResults,
        });
        return [];
      });
      return;
    }

    // Update selected results and create mapping for algorithms
    setSelectedTestResults(results);
    dispatch({
      type: 'UPDATE_ALGO_TRACKER',
      gridItemAlgosMap: results.map((result) => ({
        gid: result.gid,
        cid: result.cid,
        testResultId: result.id,
      })),
    });
  }

  /**
   * Updates the selected input block datas and applies them to widgets
   * Maps input block datas to input blocks based on matching gid and cid
   *
   * @param inputBlockDatas - The array of input block datas selected by the user
   */
  function handleSelectInputBlockDatas(inputBlockDatas: InputBlockData[]) {
    console.log(
      `[handleSelectInputBlockDatas] Updating with ${inputBlockDatas.length} input block datas`
    );

    // Special case: when no input block datas are selected, clear all input block data associations
    if (inputBlockDatas.length === 0) {
      setSelectedInputBlockDatas((prev) => {
        const updatedInputBlockDatas = prev.map((inputBlockData) => ({
          gid: inputBlockData.gid,
          cid: inputBlockData.cid,
          inputBlockDataId: undefined,
        }));
        dispatch({
          type: 'UPDATE_INPUT_BLOCK_TRACKER',
          gridItemInputBlockDatasMap:
            updatedInputBlockDatas as WidgetInputBlockIdentifier[],
        });
        return [];
      });
      return;
    }

    // Update selected input block datas and create mapping for input blocks
    setSelectedInputBlockDatas(inputBlockDatas);
    const updatedInputBlockDatasMap = inputBlockDatas.map((inputBlockData) => ({
      gid: inputBlockData.gid,
      cid: inputBlockData.cid,
      inputBlockDataId: inputBlockData.id,
    })) as WidgetInputBlockIdentifier[];
    dispatch({
      type: 'UPDATE_INPUT_BLOCK_TRACKER',
      gridItemInputBlockDatasMap: updatedInputBlockDatasMap,
    });
  }

  // Add function to toggle mode
  const toggleMode = () => {
    const currentMode = searchParams.get('mode') || 'edit';
    const newMode = currentMode === 'edit' ? 'view' : 'edit';

    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);

    router.push(`?${params.toString()}`);
  };

  // Add save as template function
  const handleSaveAsTemplate = async () => {
    try {
      const response = await fetch(
        `/api/projects/saveProjectAsTemplate/${project.id}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      setSaveStatus('success');
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveStatus('error');
    }
    setShowSaveModal(true);
  };

  const mainControlsSection = (
    <section className="fixed right-[100px] top-[105px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
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
          title="Save as Template"
          onClick={handleSaveAsTemplate}>
          <RiSaveLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
        <button
          className="disabled:opacity-50"
          title={disabled ? 'Switch to Edit Mode' : 'Switch to View Mode'}
          onClick={toggleMode}>
          {disabled ? (
            <RiEditLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
          ) : (
            <RiEyeLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
          )}
        </button>
      </div>
      {!disabled ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
          <button
            className="disabled:opacity-50"
            title="Toggle Grid"
            onClick={() => dispatch({ type: 'TOGGLE_GRID' })}>
            <RiGridLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
          </button>
        </div>
      ) : null}
      {pageNavigationMode === 'multi' && (
        <ZoomControl
          zoomLevel={zoomLevel}
          onZoomReset={resetZoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      )}
      <PageNavigation
        disableAddPage={disabled}
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

      <div className={cn('h-full p-4 pr-2', !isPanelOpen && 'hidden')}>
        <h4 className="mb-0 text-lg font-bold">{project.projectInfo.name}</h4>
        <p className="text-sm text-gray-500">
          {project.projectInfo.description}
        </p>
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

  /*
    The pages section has 3 critical nested div elements:
    - The free form draggable area
      - This area takes up the entire width of the screen and full height below page header.
    - The content area (contentWrapper within freeFormDraggableArea component)
      - This is a container wrapping the main content. It has large overflowing excess width and height to allow drag scrolling.
    - The pages wrapper (pagesContentWrapper defined below as a child of freeFormDraggableArea)
      - This is a container wrapping all the pages.
  */
  const pagesSection = (
    <FreeFormDraggableArea
      ref={freeFormAreaRef}
      pagesLength={layouts.length}
      zoomLevel={zoomLevel}
      contentWrapperMinHeight={contentWrapperMinHeight}>
      <div
        id={pagesContentWrapperId}
        ref={canvasPrint.contentRef}
        className="flex flex-col">
        {state.layouts.map((layout, pageIndex) => {
          const isOverflowPage = state.pageTypes[pageIndex] === 'overflow';
          const overflowParent = state.overflowParents[pageIndex];

          // In single mode, only render the current page
          if (pageNavigationMode === 'single' && pageIndex !== currentPage) {
            return null;
          }

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
                !isOverflowPage && pageNavigationMode === 'multi' && 'mt-2',
                pageNavigationMode === 'single' && 'mx-auto'
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
                disableDelete={disabled || layouts.length <= 1}
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
                  <div className="text-sm text-gray-200 print:hidden">
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
                  isResizable={!disabled}
                  isDroppable={!disabled}
                  isDraggable={!disabled}
                  isBounded={true}
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
                    console.log('mapping widgets', widget, widgetIndex);
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
                          allInputBlockDatasOnSystem={
                            allInputBlockDatasOnSystem
                          }
                          allTestResultsOnSystem={allTestResultsOnSystem}
                          widget={widget}
                          onDeleteClick={handleDeleteGridItem(
                            pageIndex,
                            widgetIndex
                          )}
                          onEditClick={handleGridItemEditClick(pageIndex)}
                          onInfoClick={() =>
                            setSelectedGridItemId(widget.gridItemId)
                          }
                          onWidgetPropertiesClose={() =>
                            setSelectedGridItemId(null)
                          }
                          dispatch={dispatch}
                          pageIndex={pageIndex}
                          isDragging={draggingGridItemId === widget.gridItemId}
                          isResizing={resizingGridItemId === widget.gridItemId}
                          testResultsUsed={
                            state.gridItemToAlgosMap[widget.gridItemId]
                          }
                          inputBlockDatasUsed={
                            state.gridItemToInputBlockDatasMap[
                              widget.gridItemId
                            ]
                          }
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

  const dataDrawers = (
    <section
      className={cn(
        'fixed top-[90px] z-10 flex flex-col items-start gap-2',
        isPanelOpen ? 'left-[340px]' : 'left-[100px]'
      )}>
      <h4 className="text-md font-semibold text-gray-800">Data In Use:</h4>
      <TestResultsDrawer
        allTestResultsOnSystem={allTestResultsOnSystem}
        selectedTestResultsFromUrlParams={selectedTestResults}
        onCheckboxClick={handleSelectUploadedTestResults}
      />
      <InputBlockDatasDrawer
        allInputBlockDatasOnSystem={allInputBlockDatasOnSystem}
        selectedInputBlockDatasFromUrlParams={selectedInputBlockDatas}
        onCheckboxClick={handleSelectInputBlockDatas}
      />
    </section>
  );

  console.log('state', state);

  // Update the Next button to use navigateToNextStep
  const handleNextClick = () => {
    if (flow === UserFlows.NewProjectWithExistingTemplate) {
      canvasState.navigateToNextStep(
        `/results?flow=${UserFlows.NewProjectWithExistingTemplateAndResults}&projectId=${project?.id}`
      );
    } else if (flow === UserFlows.NewProjectWithNewTemplate) {
      canvasState.navigateToNextStep(
        `/project/select_data?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=${project?.id}`
      );
    } else if (flow === UserFlows.NewProjectWithExistingTemplateAndResults) {
      canvasState.navigateToNextStep(
        `/project/usermenu?flow=${UserFlows.NewProjectWithExistingTemplateAndRunNewTests}&projectId=${project?.id}`
      );
    } else if (flow === UserFlows.NewProjectWithNewTemplateAndResults) {
      canvasState.navigateToNextStep(
        `/project/usermenu?flow=${UserFlows.NewProjectWithNewTemplateAndRunNewTests}&projectId=${project?.id}`
      );
    }
  };

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
      <CanvasHeader project={project} />
      <main className="relative h-full w-full">
        {disabled ? null : pluginsPanelSection}
        {disabled ? null : dataDrawers}
        {mainControlsSection}
        {pagesSection}
      </main>
      <section className="fixed bottom-[-10] right-[200px] h-[100px] bg-transparent">
        <div className="flex items-center justify-center gap-4">
          {flow === UserFlows.NewProjectWithExistingTemplateAndResults ||
          flow === UserFlows.NewProjectWithNewTemplateAndResults ? (
            <Link href={backButtonLink}>
              <Button
                className="w-[130px] gap-4 p-2 text-white"
                variant="secondary">
                <RiArrowLeftLine /> Back
              </Button>
            </Link>
          ) : null}
          {flow === UserFlows.NewProjectWithNewTemplate ? (
            <Button
              className="w-[130px] gap-4 p-2 text-white"
              onClick={handleNextClick}>
              Next <RiArrowRightLine />
            </Button>
          ) : null}
        </div>
      </section>
      {showSaveModal ? (
        <Modal
          heading={saveStatus === 'success' ? 'Success!' : 'Error'}
          enableScreenOverlay={true}
          onCloseIconClick={() => {
            setShowSaveModal(false);
            setSaveStatus(null);
          }}>
          <div className="flex h-full flex-col justify-between">
            <p className="text-white">
              {saveStatus === 'success'
                ? 'Project has been successfully saved as a template.'
                : 'Failed to save project as template. Please try again.'}
            </p>
          </div>
        </Modal>
      ) : null}
    </React.Fragment>
  );
}

export { Designer };
