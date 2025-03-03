import { getMDXComponent, MDXContentProps } from 'mdx-bundler/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { Layout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
  WidgetAction,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import {
  ArtifactsMapping,
  InputBlockDataMapping,
  ParsedTestResults,
  TestResultDataMapping,
  WidgetOnGridLayout,
} from '@/app/canvas/types';
import { findInputBlockDataById } from '@/app/canvas/utils/findInputBlockDataById';
import { findMockDataByTypeAndCid } from '@/app/canvas/utils/findMockDataByTypeAndCid';
import { findTestResultById } from '@/app/canvas/utils/findTestResultById';
import {
  TestResultData,
  InputBlockData,
  Plugin,
  InputBlockDataPayload,
} from '@/app/types';
import { WidgetPropertiesDrawer } from './drawers/widgetPropertiesDrawer';
import { GridItemContextMenu } from './gridItemContextMenu';
import { editorInputClassName } from './hocAddTextEditFuncitonality';
import { WidgetErrorBoundary } from './widgetErrorBoundary';

/*
  Refer to React.memo code block below for more details on the memoization logic.
  This component will only re-render if the memo logic detects a change.
  This is to prevent unnecessary re-renders and improve performance.
*/

export const gridItemRootClassName = 'grid-item-root';
type requiredStyles =
  `grid-item-root relative h-auto w-full min-h-full${string}`; // strictly required styles

type GridItemComponentProps = {
  /** Array of all available plugins in the system, used for finding dependencies and metadata */
  allAvalaiblePlugins: Plugin[];

  /** React-grid-layout Layout object containing position and dimension information */
  layout: Layout;

  /** Widget configuration with MDX code, properties, and metadata */
  widget: WidgetOnGridLayout;

  /** Test results used by this widget, linking algorithm CIDs to result IDs */
  testResultsUsed?: WidgetAlgoAndResultIdentifier[];

  /** Input block datas used by this widget, linking input block CIDs to input block IDs */
  inputBlockDatasUsed?: WidgetInputBlockIdentifier[];

  /** All test results available in the system that widgets can access */
  allTestResultsOnSystem: ParsedTestResults[];

  /** All input block datas available in the system that widgets can access */
  allInputBlockDatasOnSystem: InputBlockData[];

  /** Optional data from input blocks that the widget might need */
  inputBlockData?: unknown;

  /** Whether the grid item is currently being dragged */
  isDragging?: boolean;

  /** Whether the grid item is currently being resized */
  isResizing: boolean;

  /** Callback triggered when delete button is clicked */
  onDeleteClick: () => void;

  /**
   * Callback triggered when edit button is clicked
   * @param gridItemId - ID of the grid item
   * @param gridItemHtmlElement - Reference to the DOM element
   * @param widget - The widget configuration object
   */
  onEditClick: (
    gridItemId: string,
    gridItemHtmlElement: HTMLDivElement,
    widget: WidgetOnGridLayout
  ) => void;

  /** Callback triggered when info button is clicked */
  onInfoClick: () => void;

  /** Callback triggered when widget properties drawer is closed */
  onWidgetPropertiesClose: () => void;

  /** Dispatch function for updating widget properties */
  dispatch: React.Dispatch<WidgetAction>;

  /** Index of the page this widget is on */
  pageIndex: number;
};

type MdxComponentProps = MDXContentProps & {
  id: string;
  properties: Record<string, unknown>;
  testResult: TestResultData;
  inputBlockData: InputBlockDataPayload;
  getIBData: (cid: string) => InputBlockDataPayload;
  getResults: (cid: string) => TestResultData;
  getArtifacts: (cid: string) => string[];
  width?: number;
  height?: number;
};

const itemStyle: requiredStyles =
  'grid-item-root relative h-auto w-full min-h-full';

function GridItemMain({
  allAvalaiblePlugins,
  allTestResultsOnSystem,
  allInputBlockDatasOnSystem,
  layout,
  widget,
  isDragging,
  isResizing,
  testResultsUsed,
  inputBlockDatasUsed,
  onDeleteClick,
  onEditClick,
  onInfoClick,
  onWidgetPropertiesClose,
  dispatch,
  pageIndex,
}: GridItemComponentProps) {
  /**
   * Controls visibility of the context menu that appears when hovering over a widget
   * Contains edit, delete, and info buttons
   */
  const [showContextMenu, setShowContextMenu] = useState(false);

  /**
   * Controls visibility of the widget properties drawer
   * Shows detailed information about the widget and its test results
   */
  const [showWidgetProperties, setShowWidgetProperties] = useState(false);

  /**
   * Tracks the position of the context menu relative to the widget
   * Updated when the widget moves or the window scrolls
   */
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  /**
   * Reference to the grid item's DOM element
   * Used for positioning the context menu and measuring dimensions
   */
  const gridItemRef = useRef<HTMLDivElement>(null);

  /**
   * Stores the timeout ID for delayed hiding of the context menu
   * Used to prevent the menu from disappearing immediately when mouse leaves
   */
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Tracks whether the mouse is currently hovering over the widget or its menu
   * Used to prevent the menu from hiding when moving between the widget and menu
   */
  const isHoveringRef = useRef<boolean>(false);

  /**
   * Stores the current width and height of the widget
   * Updated by ResizeObserver when the widget's size changes
   */
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  /**
   * Determines if the widget has editable properties
   * Controls whether the edit button is shown in the context menu
   */
  const enableEditing = widget.properties && widget.properties.length > 0;

  /**
   * Prepares the list of test results used by this widget for display in the properties drawer
   * Filters the full test results list to only include those relevant to this widget
   */
  const testResultsListForDrawer = useMemo(() => {
    // prepare list of test results that are used by this widget, for the widget properties drawer
    if (testResultsUsed && testResultsUsed.length > 0) {
      return testResultsUsed.reduce<ParsedTestResults[]>((acc, result) => {
        if (result.testResultId !== undefined) {
          const testResult = findTestResultById(
            allTestResultsOnSystem,
            result.testResultId
          );
          if (testResult) {
            acc.push(testResult);
          }
        }
        return acc;
      }, []);
    }
    return [];
  }, [testResultsUsed]);

  /**
   * Prepares the list of input block datas used by this widget for display in the properties drawer
   * Filters the full input block datas list to only include those relevant to this widget
   */
  const inputBlockDatasListForDrawer = useMemo(() => {
    // prepare list of input block datas that are used by this widget, for the widget properties drawer
    if (inputBlockDatasUsed && inputBlockDatasUsed.length > 0) {
      return inputBlockDatasUsed.reduce<InputBlockData[]>((acc, ibData) => {
        if (ibData.inputBlockDataId !== undefined) {
          const inputBlockData = findInputBlockDataById(
            allInputBlockDatasOnSystem,
            ibData.inputBlockDataId
          );
          if (inputBlockData) {
            acc.push(inputBlockData);
          }
        }
        return acc;
      }, []);
    }
    return [];
  }, [inputBlockDatasUsed]);

  /**
   * Prepares test result data for the widget to consume and display
   * Maps algorithm IDs to their corresponding test results or mock data
   * If no test result is found for an algorithm, falls back to mock data
   */
  const testResultWidgetData = useMemo(() => {
    // prepare test result data for the widget to consume and display data (draw graphs, etc),
    // based on test results that are used by this widget. If no test result is found for an algo,
    // the mock data is used instead.
    if (testResultsUsed && testResultsUsed.length > 0) {
      return testResultsUsed.reduce<TestResultDataMapping>((acc, result) => {
        if (result.testResultId !== undefined) {
          const testResult = findTestResultById(
            allTestResultsOnSystem,
            result.testResultId
          );
          if (testResult) {
            acc[`${widget.gid}:${result.cid}`] = testResult.output;
          } else {
            const mockData = findMockDataByTypeAndCid(
              widget.mockdata || [],
              'Algorithm',
              result.cid
            );
            if (mockData) {
              acc[`${widget.gid}:${result.cid}`] = mockData.data;
            }
          }
        } else {
          const mockData = findMockDataByTypeAndCid(
            widget.mockdata || [],
            'Algorithm',
            result.cid
          );
          if (mockData) {
            acc[`${widget.gid}:${result.cid}`] = mockData.data;
          }
        }
        return acc;
      }, {});
    }
    return {};
  }, [testResultsUsed]);

  /**
   * Prepares artifact data for the widget to consume
   * Maps algorithm IDs to their corresponding artifacts or mock artifacts
   * If no test result is found for an algorithm, falls back to mock data
   */
  const widgetArtifacts = useMemo(() => {
    // prepare artifacts data for the widget to consume, based on test results used by this widget
    // If no test result is found for an algo, the mock data artifacts are used instead
    if (testResultsUsed && testResultsUsed.length > 0) {
      return testResultsUsed.reduce<ArtifactsMapping>((acc, result) => {
        if (result.testResultId !== undefined) {
          const testResult = findTestResultById(
            allTestResultsOnSystem,
            result.testResultId
          );
          if (testResult && testResult.artifacts) {
            // Transform artifact paths into full URLs
            console.log("host", process.env.NEXT_PUBLIC_APIGW_HOST)
            console.log("testResult", testResult.artifacts)
            const artifactUrls = testResult.artifacts.map(artifactPath => 
              `${process.env.NEXT_PUBLIC_APIGW_HOST}/test_results/${result.testResultId}/artifacts/${artifactPath}`
            );
            acc[`${widget.gid}:${result.cid}`] = artifactUrls;
          } else {
            const mockData = findMockDataByTypeAndCid(
              widget.mockdata || [],
              'Algorithm',
              result.cid
            );
            if (mockData && mockData.artifacts) {
              acc[`${widget.gid}:${result.cid}`] = mockData.artifacts;
            }
          }
        } else {
          const mockData = findMockDataByTypeAndCid(
            widget.mockdata || [],
            'Algorithm',
            result.cid
          );
          if (mockData && mockData.artifacts) {
            acc[`${widget.gid}:${result.cid}`] = mockData.artifacts;
          }
        }
        return acc;
      }, {});
    }
    return {};
  }, [testResultsUsed]);

  /**
   * Prepares input block data for the widget to consume
   * Maps input block IDs to their corresponding data or mock data
   * If no input block data is found, falls back to mock data
   */
  const inputBlocksWidgetData = useMemo(() => {
    if (inputBlockDatasUsed && inputBlockDatasUsed.length > 0) {
      // Group input block datas by their type (process checklist or fairness tree)
      const groupedData = inputBlockDatasUsed.reduce<{
        processChecklists: { [key: string]: InputBlockData[] };
        fairnessTrees: { [key: string]: InputBlockData[] };
      }>((acc, data) => {
        if (data.inputBlockDataId !== undefined) {
          const inputBlockData = allInputBlockDatasOnSystem.find(
            (ib) => ib.id === data.inputBlockDataId
          );
          if (inputBlockData) {
            // Check if it's a process checklist (has group property)
            if (inputBlockData.group) {
              // Group by gid and group only (ignoring cid)
              const key = `${inputBlockData.gid}:${inputBlockData.group}`;
              if (!acc.processChecklists[key]) {
                acc.processChecklists[key] = [];
              }
              acc.processChecklists[key].push(inputBlockData);
            } else {
              // For fairness trees, group by gid and cid since they share same gid/cid
              const key = `${inputBlockData.gid}:${inputBlockData.cid}`;
              if (!acc.fairnessTrees[key]) {
                acc.fairnessTrees[key] = [];
              }
              acc.fairnessTrees[key].push(inputBlockData);
            }
          }
        }
        return acc;
      }, { processChecklists: {}, fairnessTrees: {} });

      // Convert grouped data into a mapping
      const result: InputBlockDataMapping = {};

      // Add one fairness tree if available
      const fairnessTreeGroups = Object.values(groupedData.fairnessTrees);
      if (fairnessTreeGroups.length > 0) {
        // Take the first fairness tree from the first group
        const fairnessTree = fairnessTreeGroups[0][0];
        result[`${widget.gid}:${fairnessTree.cid}`] = fairnessTree.data;
      } else {
        // Fallback to mock data for fairness tree
        const mockData = findMockDataByTypeAndCid(
          widget.mockdata || [],
          'InputBlock',
          'fairness_tree'
        );
        if (mockData && mockData.data) {
          result[`${widget.gid}:fairness_tree`] = mockData.data;
        }
      }

      // Add one group of process checklists if available
      const checklistGroups = Object.values(groupedData.processChecklists);
      if (checklistGroups.length > 0) {
        // Take the first group of checklists (should contain all 12 checklists)
        checklistGroups[0].forEach(checklist => {
          result[`${widget.gid}:${checklist.cid}`] = checklist.data;
        });
      } else {
        // Fallback to mock data for process checklists
        const mockData = findMockDataByTypeAndCid(
          widget.mockdata || [],
          'InputBlock',
          'explainability_process_checklist'
        );
        if (mockData && mockData.data) {
          result[`${widget.gid}:explainability_process_checklist`] = mockData.data;
        }
      }

      return result;
    }
    return {};
  }, [inputBlockDatasUsed, allInputBlockDatasOnSystem, widget.gid, widget.mockdata]);

  /**
   * Sets up a ResizeObserver to track the widget's dimensions
   * Updates the dimensions state when the widget is resized
   */
  useEffect(() => {
    if (!gridItemRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(gridItemRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  /**
   * Cleanup function for the hide timeout
   * Ensures no memory leaks from lingering timeouts
   */
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Hides the context menu when the widget is being dragged
   * Prevents the menu from appearing in the wrong position during drag
   */
  useEffect(() => {
    if (isDragging) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setShowContextMenu(false);
      isHoveringRef.current = false;
    }
  }, [isDragging]);

  /**
   * Updates the position of the context menu when it's visible
   * Ensures the menu stays aligned with the widget when scrolling or resizing
   */
  useEffect(() => {
    if (!showContextMenu) return;

    const updatePosition = () => {
      if (gridItemRef.current) {
        const rect = gridItemRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.right + 8,
        });
      }
    };

    // Initial position
    updatePosition();

    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showContextMenu]);

  /**
   * Handles clicks outside the widget to hide the context menu
   * Special case to prevent hiding when clicking in an editor input field
   */
  useEffect(() => {
    if (!showContextMenu) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        (event.target as HTMLElement).classList.contains(editorInputClassName)
      ) {
        return;
      }
      if (
        gridItemRef.current &&
        !gridItemRef.current.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  /**
   * Calls the onWidgetPropertiesClose callback when the properties drawer is closed
   * Allows parent components to react to the drawer closing
   */
  useEffect(() => {
    if (showWidgetProperties === false) {
      onWidgetPropertiesClose();
    }
  }, [showWidgetProperties]);

  /**
   * Handles clicks on the info button in the context menu
   * Shows both the context menu and properties drawer
   */
  function handleInfoClick() {
    setShowContextMenu(true);
    setShowWidgetProperties(true);
    onInfoClick();
  }

  /**
   * Handles clicks on the edit button in the context menu
   * Calls the parent's onEditClick with the widget and its DOM element
   */
  function handleEditClick() {
    if (gridItemRef.current !== null)
      onEditClick(widget.gridItemId, gridItemRef.current, widget);
  }

  /**
   * Shows the context menu when mouse enters the widget
   * Clears any pending hide timeout
   */
  function handleMouseEnter() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    isHoveringRef.current = true;
    setShowContextMenu(true);
  }

  /**
   * Sets up delayed hiding of the context menu when mouse leaves
   * Uses a timeout to allow moving the mouse to the menu without it disappearing
   */
  function handleMouseLeave() {
    isHoveringRef.current = false;
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowContextMenu(false);
      }
    }, 300); // 300ms delay before hiding
  }

  /**
   * Creates the MDX component for the widget
   * Falls back to a placeholder if MDX code is missing
   */
  const Component: React.ComponentType<MdxComponentProps> = useMemo(() => {
    if (!widget.mdx) {
      const MissingMdxMessage = () => (
        <div>{`${widget.name} - ${widget.cid} : Missing mdx`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    const MDXComponent = getMDXComponent(widget.mdx.code);
    return MDXComponent;
  }, [widget, widget.mdx]);

  /**
   * Transforms the widget's property definitions into a props object
   * Used to pass configuration to the MDX component
   */
  const properties = useMemo(() => {
    if (!widget.properties) return {};
    return widget.properties.reduce((props, property) => {
      return {
        ...props,
        [property.key]: property.value || property.default || property.helper,
      };
    }, {});
  }, [widget.properties]);

  return (
    <React.Fragment>
      {/* Context menu that appears when hovering over the widget */}
      {showContextMenu && !isDragging ? (
        <GridItemContextMenu
          widget={widget}
          hideEditIcon={!enableEditing}
          menuPosition={menuPosition}
          onDeleteClick={onDeleteClick}
          onInfoClick={handleInfoClick}
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
            }
            isHoveringRef.current = true;
          }}
          onMouseLeave={handleMouseLeave}
          onEditClick={handleEditClick}
        />
      ) : null}

      {/* Properties drawer that shows detailed widget information */}
      {showWidgetProperties ? (
        <WidgetPropertiesDrawer
          layout={layout}
          allAvailablePlugins={allAvalaiblePlugins}
          widget={widget}
          testResultsUsed={testResultsListForDrawer}
          inputBlocksDataUsed={inputBlockDatasListForDrawer}
          open={showWidgetProperties}
          setOpen={setShowWidgetProperties}
          onOkClick={() => setShowWidgetProperties(false)}
          onDeleteClick={onDeleteClick}
          dispatch={dispatch}
          pageIndex={pageIndex}
        />
      ) : null}

      {/* The widget container element */}
      <div
        ref={gridItemRef}
        className={itemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {isResizing || isDragging ? (
          // Show a placeholder during resize and dragging for better ux. Resizing charts is laggy
          // because of observer responsiveness.
          <div className="h-auto w-full bg-gray-100" />
        ) : (
          // Render the actual widget content with error boundary protection
          <WidgetErrorBoundary widgetName={widget.name || widget.cid}>
            <Component
              id={widget.gridItemId}
              properties={properties}
              artifacts={widgetArtifacts}
              testResult={testResultWidgetData}
              inputBlockData={inputBlocksWidgetData}
              getIBData={(cid: string) =>
                inputBlocksWidgetData[`${widget.gid}:${cid}`]
              }
              getResults={(cid: string) =>
                testResultWidgetData[`${widget.gid}:${cid}`]
              }
              getArtifacts={(cid: string) => {
                const urls = widgetArtifacts[`${widget.gid}:${cid}`];
                return Array.isArray(urls) ? urls : [];
              }}
              width={dimensions.width}
              height={dimensions.height}
            />
          </WidgetErrorBoundary>
        )}
      </div>
    </React.Fragment>
  );
}

// Use custom comparison function to prevent unnecessary re-renders
export const GridItemComponent = React.memo(
  GridItemMain,
  (prevProps, nextProps) => {
    // Only re-render if widget data changed, it's being dragged/resized, or selection state changed
    return (
      prevProps.widget === nextProps.widget &&
      prevProps.isDragging === nextProps.isDragging &&
      prevProps.isResizing === nextProps.isResizing &&
      prevProps.layout === nextProps.layout &&
      JSON.stringify(prevProps.testResultsUsed) ===
        JSON.stringify(nextProps.testResultsUsed) &&
      JSON.stringify(prevProps.inputBlockDatasUsed) ===
        JSON.stringify(nextProps.inputBlockDatasUsed)
    );
  }
);
