import { getMDXComponent, MDXContentProps } from 'mdx-bundler/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { InputBlockDataMapping, TestResultDataMapping, WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm, TestResultData, InputBlockData, Plugin } from '@/app/types';
import { WidgetPropertiesDrawer } from './drawers/widgetPropertiesDrawer';
import { GridItemContextMenu } from './gridItemContextMenu';
import { editorInputClassName } from './hocAddTextEditFuncitonality';

export const gridItemRootClassName = 'grid-item-root';
type requiredStyles = `grid-item-root relative h-auto w-full min-h-full${string}`; // strictly required styles

type GridItemComponentProps = {
  plugins: Plugin[];
  widget: WidgetOnGridLayout;
  inputBlockData?: unknown;
  isDragging?: boolean;
  isResizing: boolean;
  onDeleteClick: () => void;
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

const itemStyle: requiredStyles = 'grid-item-root relative h-auto w-full min-h-full';

function GridItemComponent({ plugins, widget, onDeleteClick, onEditClick, isDragging, isResizing }: GridItemComponentProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showWidgetProperties, setShowWidgetProperties] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const gridItemRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isHoveringRef = useRef<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!gridItemRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
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
      if ((event.target as HTMLElement).classList.contains(editorInputClassName)) {
        return;
      }
      if (gridItemRef.current && !gridItemRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  function handleClick() {
    setShowContextMenu(true);
    setShowWidgetProperties(true);
  }

  function handleEditClick() {
    if (gridItemRef.current !== null)
      onEditClick(widget.gridItemId, gridItemRef.current, widget);
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

  const testResult = useMemo(() => {
    // if (testResultsMapping) {
    //   return testResultsMapping;
    // }

    if (widget.mockdata && widget.mockdata.length > 0) {
      return widget.mockdata.reduce<TestResultDataMapping>((acc, mock) => {
        if (mock.type === "Algorithm") {
          acc[`${widget.gid}:${mock.cid}`] = mock.data;
        }
        return acc;
      }, {});
    }
    return {};
  }, [widget, widget.mdx]);

  const mockInputs = useMemo(() => {
    // if (testResultsMapping) {
    //   if (widget.mockdata && widget.mockdata.length > 0) {
    //     return widget.mockdata.reduce<InputBlockDataMapping>((acc, mock) => {
    //       if (mock.type === "InputBlock") {
    //         acc[`${widget.gid}:${mock.cid}`] = mock.data;
    //         mock.data.metrics = getRandomFairnessMetrics();
    //       }
    //       return acc;
    //     }, {});
    //   }
    // }
    if (widget.mockdata && widget.mockdata.length > 0) {
      return widget.mockdata.reduce<InputBlockDataMapping>((acc, mock) => {
        if (mock.type === "InputBlock") {
          acc[`${widget.gid}:${mock.cid}`] = mock.data;
        }
        return acc;
      }, {});
    }
    return {};
  }, [widget, widget.mdx]);

  // console.log('mockResults', mockResults);
  // console.log('mockInputs', mockInputs);

  return (
    <React.Fragment>
      {showContextMenu && !isDragging ?
        <GridItemContextMenu
          widget={widget}
          menuPosition={menuPosition}
          onDeleteClick={onDeleteClick}
          onEditClick={handleEditClick} /> : null}
      {showWidgetProperties && <WidgetPropertiesDrawer
        plugins={plugins}
        widget={widget}
        open={showWidgetProperties}
        setOpen={setShowWidgetProperties}
        onOkClick={() => setShowWidgetProperties(false)}
        onDeleteClick={onDeleteClick}
      />}
      <div
        ref={gridItemRef}
        className={itemStyle}
        onClick={handleClick}>
        {isResizing ? (
          <div className="h-auto w-full bg-gray-100" />
        ) : (
          <Component
            id={widget.gridItemId}
            properties={properties}
            testResult={testResult}
            inputBlockData={mockInputs}
            getIBData={(cid) => mockInputs[`${widget.gid}:${cid}`]}
            getResults={(cid) => testResult[`${widget.gid}:${cid}`]}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </div>
    </React.Fragment>
  );
}

export { GridItemComponent };
