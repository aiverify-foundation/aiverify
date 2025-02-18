import {
  RiDeleteBin5Line,
  RiFileEditLine,
  RiFlaskLine,
} from '@remixicon/react';
import { getMDXComponent, MDXContentProps } from 'mdx-bundler/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { InputBlockDataMapping, TestResultDataMapping, WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm, TestResultData, InputBlockData } from '@/app/types';

type GridItemComponentProps = {
  widget: WidgetOnGridLayout;
  inputBlockData?: unknown;
  testResultsMapping?: TestResultDataMapping | null;
  onDeleteClick: () => void;
  onEditClick: (
    gridItemId: string,
    gridItemHtmlElement: HTMLDivElement,
    widget: WidgetOnGridLayout
  ) => void;
  isDragging?: boolean;
  isResizing: boolean;
  algosMap: Record<string, Algorithm[]>;
};

type MdxComponentProps = MDXContentProps & {
  id: string;
  properties: Record<string, unknown>;
  results: TestResultData;
  inputBlockData: InputBlockData;
  // getContainerObserver: GetContainerObserver;
  getIBData: (cid: string) => InputBlockData;
  getResults: (cid: string) => TestResultData;
  width?: number;
  height?: number;
};

/**
 * This is a higher-order component that allows developers to add modifications like styling to the MDX component.
 * It is currently not doing anything, but it is a placeholder for future use.
 * Currently it has placeholders for h2, h1, but no modifications are added.
 * @param WrappedComponent - The MDX component to wrap.
 * @returns A new component that adds text behavior to the MDX component.
 */
const withTextBehavior = <P extends MDXContentProps>(
  WrappedComponent: React.FunctionComponent<P>
) => {
  return function EnhancedComponent(props: P) {
    return (
      <WrappedComponent
        {...props}
        components={{
          ...props.components,
          // h1: (h1Props: { children: React.ReactNode }) => (
          //   <h1>{h1Props.children}</h1>
          // ),
          // h2: (h2Props: { children: React.ReactNode }) => (
          //   <h2>{h2Props.children}</h2>
          // ),
          // p: ({ children }) => <div>{children}!!</div>,
        }}
      />
    );
  };
};

function GridItemComponent({ widget, onDeleteClick, onEditClick, isDragging, isResizing, algosMap, testResultsMapping }: GridItemComponentProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
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

  function handleMouseEnter() {
    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowContextMenu(true);
  }

  function handleMouseLeave() {
    isHoveringRef.current = false;
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowContextMenu(false);
      }
    }, 500); //delay before hiding
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
    // return withTextBehavior(MDXComponent);
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

  const mockResults = useMemo(() => {
    if (testResultsMapping) {
      return testResultsMapping;
    }

    if (widget.mockdata && widget.mockdata.length > 0) {
      return widget.mockdata.reduce<TestResultDataMapping>((acc, mock) => {
        if (mock.type === "Algorithm") {
          acc[`${widget.gid}:${mock.cid}`] = mock.data;
        }
        return acc;
      }, {});
    }
    return {};
  }, [widget, widget.mdx, testResultsMapping]);

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
  }, [widget, widget.mdx, testResultsMapping]);

  // console.log('mockResults', mockResults);
  // console.log('mockInputs', mockInputs);

  const contextMenu = showContextMenu && !isDragging
    ? createPortal(
      <div
        className="fixed flex flex-col gap-1"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}>
        <div className="max-w-[200px] break-words rounded bg-secondary-600 px-2 py-1 text-xs shadow-lg">
          {widget.name}
        </div>
        <div className="flex gap-1">
          <div
            className="cursor-pointer rounded bg-secondary-400 shadow-lg"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={(e) => {
              // Prevent grid drag from starting
              e.stopPropagation();
            }}
            onClick={handleEditClick}>
            <RiFileEditLine className="m-1 h-5 w-5 text-white hover:text-blue-800" />
          </div>
          <div
            className="cursor-pointer rounded bg-secondary-400 shadow-lg"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={(e) => {
              // Prevent grid drag from starting
              e.stopPropagation();
            }}
            onClick={onDeleteClick}>
            <RiDeleteBin5Line className="m-1 h-5 w-5 text-white hover:text-red-500" />
          </div>
        </div>
        {Object.keys(algosMap).length > 0 && (
          <section className="flex flex-col gap-1">
            {algosMap[widget.gridItemId] &&
              algosMap[widget.gridItemId].map((algo) => (
                <div
                  key={algo.cid}
                  className="mt-1 flex w-[250px] flex-col items-start gap-2 rounded bg-secondary-200 p-4 text-gray-500 shadow-md">
                  <div className="flex items-center gap-2">
                    <RiFlaskLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                    <h2 className="text-[0.9rem] font-semibold">Tests</h2>
                  </div>
                  <div className="mb-2 h-[1px] w-full bg-gray-500" />
                  <h3 className="text-[0.9rem] font-semibold">
                    {algo.name}
                  </h3>
                  <p className="text-[0.8rem]">{algo.description}</p>
                </div>
              ))}
          </section>
        )}
      </div>,
      document.body
    )
    : null;

  return (
    <React.Fragment>
      {contextMenu}
      <div
        ref={gridItemRef}
        className="relative h-full w-full"
        onMouseOver={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {isResizing ? (
          <div className="h-full w-full bg-gray-100" />
        ) : (
          <Component
            id={widget.gridItemId}
            properties={properties}
            results={mockResults}
            inputBlockData={mockInputs}
            getIBData={(cid) => mockInputs[`${widget.gid}:${cid}`]}
            getResults={(cid) => mockResults[`${widget.gid}:${cid}`]}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </div>
    </React.Fragment>
  );
}

export { GridItemComponent };
