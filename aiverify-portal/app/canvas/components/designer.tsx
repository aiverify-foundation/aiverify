'use client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  RiGridLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPrinterLine,
} from '@remixicon/react';
import { debounce } from 'lodash';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { z } from 'zod';
import {
  ParsedTestResults,
  PluginForGridLayout,
  WidgetOnGridLayout,
} from '@/app/canvas/types';
import { findInputBlockDatasByGidCidAndGroup } from '@/app/canvas/utils/findInputBlockDatasByGidCidAndGroup';
import { findTestResultByAlgoGidAndCid } from '@/app/canvas/utils/findTestResultByAlgoGidAndCid';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { getWidgetInputBlocksFromPlugins } from '@/app/canvas/utils/getWidgetInputBlocksFromPlugins';
import { isPageContentOverflow } from '@/app/canvas/utils/isPageContentOverflow';
import { populateInitialWidgetResult } from '@/app/canvas/utils/populateInitialWidgetResult';
import { InputBlockData, Widget } from '@/app/types';
import { ProjectInfo } from '@/app/types';
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
  pagesDesignReducer,
  initialState,
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
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
  /** Identifies the user flow/journey context in which the designer is being used */
  flow: UserFlows;

  /** Contains information about the current project including id, name, and description */
  project: ProjectInfo;

  /** Collection of all available plugins with their MDX source code that can be used in the designer */
  allPluginsWithMdx: PluginForGridLayout[];

  /** All test results available in the system that can be applied to widgets */
  allTestResultsOnSystem: ParsedTestResults[]; // ParsedTestResult should have value of 'output' property in the form of Javascript object

  /** All input block datas available in the system that can be applied to widgets */
  allInputBlockDatasOnSystem: InputBlockData[];

  /** Pre-selected test results based on URL parameters */
  selectedTestResultsFromUrlParams?: ParsedTestResults[];

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
  active:outline-none`;

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
    allPluginsWithMdx,
    allTestResultsOnSystem = [],
    allInputBlockDatasOnSystem = [],
    selectedTestResultsFromUrlParams = [],
    disabled = false,
    disableNextButton = false,
    disablePreviousButton = false,
    pageNavigationMode = 'multi',
  } = props;

  // Reference to the canvas element for positioning and measurements
  const canvasRef = useRef<HTMLDivElement>(null);

  // Flag to track initial component mount for initialization logic
  const isInitialMount = useRef(true);

  // Reference to the draggable area that contains all pages
  const freeFormAreaRef = useRef<HTMLDivElement>(null);

  // Main state management using reducer pattern for complex canvas state
  const [state, dispatch] = useReducer(pagesDesignReducer, initialState);

  // Destructured values from the main state for convenient access
  const { layouts, currentPage, showGrid } = state;

  // Tracks the widget currently being dragged from the plugins panel
  const [newDraggedWidget, setNewDraggedWidget] = useState<Widget | null>(null);

  // Tracks the ID of a grid item currently being dragged within the canvas
  const [draggingGridItemId, setDraggingGridItemId] = useState<string | null>(
    null
  );

  // Tracks the ID of a grid item currently being resized
  const [resizingGridItemId, setResizingGridItemId] = useState<string | null>(
    null
  );

  // Tracks the ID of the currently selected grid item for highlighting
  const [selectedGridItemId, setSelectedGridItemId] = useState<string | null>(
    null
  );

  // Stores the widget and its HTML element when being edited
  const [editingGridItem, setEditingGridItem] = useState<
    [WidgetOnGridLayout, HTMLDivElement] | null
  >(null);

  // Tracks which page contains the widget being edited
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);

  // Zoom functionality for the canvas view
  const { zoomLevel, resetZoom, zoomIn, zoomOut } = useZoom();

  // Currently selected test results to be applied to widgets
  const [selectedTestResults, setSelectedTestResults] = useState<
    ParsedTestResults[]
  >(selectedTestResultsFromUrlParams);

  // Currently selected input block datas to be applied to widgets
  const [selectedInputBlockDatas, setSelectedInputBlockDatas] = useState<
    InputBlockData[]
  >([]);

  // Drag-to-scroll functionality for navigating the canvas
  const { isDraggingRef: isDraggingFreeFormAreaRef } = useDragToScroll(
    freeFormAreaRef,
    canvasRef
  );

  // Controls visibility of the plugins panel sidebar
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Printing functionality for the canvas content
  const canvasPrint = usePrintable({ printableId: pagesContentWrapperId });

  // Determines the back button link based on the current user flow
  let updatedBackFlow = flow;
  if (flow === UserFlows.NewProjectWithExistingTemplateAndResults) {
    updatedBackFlow = UserFlows.NewProjectWithExistingTemplate;
  } else if (flow === UserFlows.NewProjectWithNewTemplateAndResults) {
    updatedBackFlow = UserFlows.NewProjectWithNewTemplate;
  }

  let backButtonLink = `/results?flow=${updatedBackFlow}&projectId=${project?.id}`;
  if (
    flow === UserFlows.NewProjectWithExistingTemplateAndRunNewTests ||
    flow === UserFlows.NewProjectWithNewTemplateAndRunNewTests
  ) {
    backButtonLink = `/project/usermenu?flow=${flow}&projectId=${project?.id}`;
  }

  /**
   * Centers the free form area horizontally on initial load
   * This ensures the canvas is properly positioned in the viewport when first rendered
   */
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

  /**
   * Scrolls to newly added pages when layouts change
   * When a new page is added, this automatically scrolls the view to show that page
   * Uses a temporary scroll margin to account for zoom level
   */
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce the scroll to new page functionality
    const debouncedScrollToNewPage = debounce(() => {
      if (layouts.length > 0) {
        const newPageElement = document.getElementById(
          `page-${layouts.length - 1}`
        );
        if (newPageElement) {
          // Add a temporary scroll margin
          newPageElement.style.scrollMarginTop = `${zoomLevel + 100}px`; // Adjust this value as needed
          newPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          newPageElement.style.scrollMarginTop = ''; // remove the temp margin
        }
      }
    }, 200); // 200ms debounce time

    debouncedScrollToNewPage();

    return () => {
      debouncedScrollToNewPage.cancel(); // Clean up the debounce on unmount
    };
  }, [layouts.length, zoomLevel]);

  /**
   * Manages overflow pages based on content size
   * Automatically adds or removes overflow pages when content exceeds page boundaries
   * Checks if widgets on the current page need additional pages to display properly
   */
  useEffect(() => {
    if (isInitialMount.current) return;

    // Debounce the overflow check to avoid excessive calculations
    const debouncedOverflowCheck = debounce(() => {
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
    }, 300); // 300ms debounce time

    debouncedOverflowCheck();

    return () => {
      debouncedOverflowCheck.cancel(); // Clean up the debounce on unmount
    };
  }, [
    layouts[currentPage],
    state.widgets[currentPage],
    state.pageTypes,
    state.overflowParents,
  ]);

  /**
   * Handles deselection of grid items when clicking outside
   * When user clicks anywhere outside a grid item, this clears the current selection
   * Sets up and cleans up the document-level click event listener
   */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${criticalGridItemWrapperClass}`)) {
        // All grid items have <criticalGridItemWrapperClass> class
        // if the target is not a grid item, clear the selected grid item id
        setSelectedGridItemId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles dropping a widget onto the canvas grid
   * Creates a new widget instance at the drop location with proper sizing and configuration
   *
   * @param pageIndex - The page where the widget is being dropped
   * @returns A callback function that processes the drop event
   */
  const handleWidgetDrop = useMemo(() => {
    return (pageIndex: number) => {
      // Return a function that captures the event data immediately
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
          // This connects the widget to any relevant test data that should be displayed
          const algos = getWidgetAlgosFromPlugins(allPluginsWithMdx, widget);
          const gridItemToAlgosMap: WidgetAlgoAndResultIdentifier[] = algos.map(
            (algo) => {
              // Find matching test results for this algorithm by gid and cid
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
              // Find matching input block data for this input block by gid, cid and group
              const matchSelectedInputBlockData =
                findInputBlockDatasByGidCidAndGroup(
                  selectedInputBlockDatas,
                  inputBlock.gid,
                  inputBlock.cid,
                  inputBlock.group
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
  }, [allPluginsWithMdx, selectedTestResults]);

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
   * Handles the completion of a resize operation
   * Updates the widget's dimensions in the state
   *
   * @param pageIndex - The page containing the resized widget
   * @returns A callback function that processes the resize completion
   */
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
   * Handles the completion of a drag operation
   * Updates the widget's position in the state if it has changed
   *
   * @param pageIndex - The page containing the dragged widget
   * @returns A callback function that processes the drag completion
   */
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
    pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    dispatch({
      type: 'UPDATE_INPUT_BLOCK_TRACKER',
      gridItemInputBlockDatasMap: inputBlockDatas.map((inputBlockData) => ({
        gid: inputBlockData.gid,
        cid: inputBlockData.cid,
        inputBlockDataId: inputBlockData.id,
      })) as WidgetInputBlockIdentifier[],
    });
  }

  /**
   * Calculates the minimum height required for the content wrapper
   * This ensures proper scrolling and display of all pages in the canvas
   *
   * The calculation works as follows:
   * 1. Computes total height needed for all pages (pages × page height)
   * 2. Adds container padding (top and bottom)
   * 3. For single-page layouts, ensures the height is at least as tall as the viewport
   *    to prevent unnecessary scrollbars while still allowing content to expand
   *
   * This value is recalculated whenever the number of pages changes
   */
  const contentWrapperMinHeight = useMemo(() => {
    // Calculate height needed for all pages
    const totalPagesHeight = layouts.length * GRID_HEIGHT;

    // Account for padding at top and bottom of container
    const containerPadding = CONTAINER_PAD + CONTAINER_PAD;

    // Total height needed for all content
    const totalHeight = totalPagesHeight + containerPadding;

    // Special case for single page: ensure it fills at least the viewport height
    // This prevents unnecessary scrolling while still allowing content to expand
    if (layouts.length === 1 && freeFormAreaRef.current) {
      const viewportHeight = freeFormAreaRef.current.clientHeight;
      return Math.max(viewportHeight, totalHeight);
    }

    return totalHeight;
  }, [layouts.length]);

  const mainControlsSection = (
    <section className="fixed right-[100px] top-[120px] z-50 flex w-[50px] max-w-[50px] flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
        <button
          className="disabled:opacity-50"
          title="Print"
          onClick={canvasPrint.print}>
          <RiPrinterLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
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
        {disabled ? null : pluginsPanelSection}
        {disabled ? null : dataDrawers}
        {mainControlsSection}
        {pagesSection}
      </main>
      <section className="fixed bottom-[-10] right-[200px] h-[100px] bg-transparent">
        <div className="flex items-center justify-center gap-4">
          {flow !== undefined &&
          flow !== UserFlows.EditExistingProject &&
          !disablePreviousButton ? (
            <Link href={backButtonLink}>
              <Button
                className="w-[130px] gap-4 p-2 text-white"
                variant="secondary">
                <RiArrowLeftLine /> Back
              </Button>
            </Link>
          ) : null}
          {!disableNextButton ? (
            <Button className="w-[130px] gap-4 p-2 text-white">
              Next <RiArrowRightLine />
            </Button>
          ) : null}
        </div>
      </section>
    </React.Fragment>
  );
}

export { Designer };
