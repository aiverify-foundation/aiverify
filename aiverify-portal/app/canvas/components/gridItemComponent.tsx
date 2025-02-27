import { getMDXComponent, MDXContentProps } from 'mdx-bundler/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { Layout } from 'react-grid-layout';
import { WidgetAlgoAndResultIdentifier } from '@/app/canvas/components/hooks/pagesDesignReducer';
import {
  InputBlockDataMapping,
  ParsedTestResults,
  TestResultDataMapping,
  WidgetOnGridLayout,
} from '@/app/canvas/types';
import { findMockDataByTypeAndCid } from '@/app/canvas/utils/findMockDataByTypeAndCid';
import { findTestResultById } from '@/app/canvas/utils/findTestResultById';
import { TestResultData, InputBlockData, Plugin } from '@/app/types';
import { WidgetPropertiesDrawer } from './drawers/widgetPropertiesDrawer';
import { GridItemContextMenu } from './gridItemContextMenu';
import { editorInputClassName } from './hocAddTextEditFuncitonality';
import { WidgetErrorBoundary } from './widgetErrorBoundary';
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

  /** All test results available in the system that widgets can access */
  allTestResultsOnSystem: ParsedTestResults[];

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
};

type MdxComponentProps = MDXContentProps & {
  id: string;
  properties: Record<string, unknown>;
  testResult: TestResultData;
  inputBlockData: InputBlockData;
  getIBData: (cid: string) => InputBlockData;
  getResults: (cid: string) => TestResultData;
  width?: number;
  height?: number;
};

const itemStyle: requiredStyles =
  'grid-item-root relative h-auto w-full min-h-full';

function GridItemComponent({
  allAvalaiblePlugins,
  allTestResultsOnSystem,
  layout,
  widget,
  isDragging,
  isResizing,
  testResultsUsed,
  onDeleteClick,
  onEditClick,
}: GridItemComponentProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showWidgetProperties, setShowWidgetProperties] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const gridItemRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const enableEditing = widget.properties && widget.properties.length > 0;

  const testResultsListForDrawer = useMemo(() => {
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

  const testResultWidgetData = useMemo(() => {
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

  //   if (widget.mockdata && widget.mockdata.length > 0) {
  //     return widget.mockdata.reduce<TestResultDataMapping>((acc, mock) => {
  //       if (mock.type === 'Algorithm') {
  //         acc[`${widget.gid}:${mock.cid}`] = mock.data;
  //       }
  //       return acc;
  //     }, {});
  //   }
  //   return {};
  // }, [widget, widget.mdx, testResultsUsed]);

  useEffect(() => {
    if (!gridItemRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(gridItemRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isDragging) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setShowContextMenu(false);
      isHoveringRef.current = false;
    }
  }, [isDragging]);

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

  function handleInfoClick() {
    setShowContextMenu(true);
    setShowWidgetProperties(true);
  }

  function handleEditClick() {
    if (gridItemRef.current !== null)
      onEditClick(widget.gridItemId, gridItemRef.current, widget);
  }

  function handleMouseEnter() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    isHoveringRef.current = true;
    setShowContextMenu(true);
  }

  function handleMouseLeave() {
    isHoveringRef.current = false;
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowContextMenu(false);
      }
    }, 300); // 300ms delay before hiding
  }

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

  const properties = useMemo(() => {
    if (!widget.properties) return {};
    return widget.properties.reduce((props, property) => {
      return {
        ...props,
        [property.key]: property.value || property.default || property.helper,
      };
    }, {});
  }, [widget.properties]);

  const mockInputs = useMemo(() => {
    if (widget.mockdata && widget.mockdata.length > 0) {
      return widget.mockdata.reduce<InputBlockDataMapping>((acc, mock) => {
        if (mock.type === 'InputBlock') {
          acc[`${widget.gid}:${mock.cid}`] = mock.data;
        }
        return acc;
      }, {});
    }
    return {};
  }, [widget, widget.mdx]);

  return (
    <React.Fragment>
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
      {showWidgetProperties ? (
        <WidgetPropertiesDrawer
          layout={layout}
          allAvailablePlugins={allAvalaiblePlugins}
          widget={widget}
          testResultsUsed={testResultsListForDrawer}
          open={showWidgetProperties}
          setOpen={setShowWidgetProperties}
          onOkClick={() => setShowWidgetProperties(false)}
          onDeleteClick={onDeleteClick}
        />
      ) : null}
      <div
        ref={gridItemRef}
        className={itemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {isResizing ? (
          <div className="h-auto w-full bg-gray-100" />
        ) : (
          <WidgetErrorBoundary widgetName={widget.name || widget.cid}>
            <Component
              id={widget.gridItemId}
              properties={properties}
              testResult={testResultWidgetData}
              inputBlockData={mockInputs}
              getIBData={(cid) => mockInputs[`${widget.gid}:${cid}`]}
              getResults={(cid) => testResultWidgetData[`${widget.gid}:${cid}`]}
              width={dimensions.width}
              height={dimensions.height}
            />
          </WidgetErrorBoundary>
        )}
      </div>
    </React.Fragment>
  );
}

export { GridItemComponent };
