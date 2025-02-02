import { RiDeleteBin5Line } from '@remixicon/react';
import { getMDXComponent } from 'mdx-bundler/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';

type GridItemComponentProps = {
  widget: WidgetOnGridLayout;
  inputBlockData?: unknown;
  testData?: unknown;
};

function GridItemComponent({ widget }: GridItemComponentProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const gridItemRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isHoveringRef = useRef<boolean>(false);

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
    }, 500); // 500ms delay before hiding
  }

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

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

  const Component = useMemo(() => {
    if (!widget.mdx) {
      const MissingMdxMessage = () => (
        <div>{`${widget.name} - ${widget.cid} : Missing mdx`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    return getMDXComponent(widget.mdx.code);
  }, [widget, widget.mdx]);

  const properties = useMemo(() => {
    if (!widget.properties) return {};
    return widget.properties.reduce((props, property) => {
      return {
        ...props,
        [property.key]: property.default || property.helper,
      };
    }, {});
  }, [widget.properties]);

  return (
    <React.Fragment>
      {showContextMenu &&
        createPortal(
          <div
            className="fixed cursor-pointer rounded bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}>
            <RiDeleteBin5Line className="m-2 h-5 w-5 text-red-500 hover:text-red-600" />
          </div>,
          document.body
        )}
      <div
        ref={gridItemRef}
        className="relative h-full w-full"
        onMouseOver={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <Component
          properties={properties}
          frontmatter={widget.mdx ? widget.mdx.frontmatter : {}}
        />
      </div>
    </React.Fragment>
  );
}

export { GridItemComponent };
