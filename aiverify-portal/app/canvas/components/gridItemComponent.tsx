import { RiDeleteBin5Line } from '@remixicon/react';
import { getMDXComponent } from 'mdx-bundler/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { EditableText } from './EditableText';

type GridItemComponentProps = {
  widget: WidgetOnGridLayout;
  inputBlockData?: unknown;
  testData?: unknown;
  onDeleteClick: () => void;
  isDragging?: boolean;
};

type EditableComponentWrapperProps = {
  children: React.ReactNode;
  onTextChange?: (newText: string) => void;
};

const EditableComponentWrapper = ({
  children,
}: EditableComponentWrapperProps) => {
  const wrapTextNodes = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string' || typeof node === 'number') {
      return (
        <EditableText
          value={String(node)}
          onChange={(value) => console.log('Text changed:', value)}
        />
      );
    }

    if (React.isValidElement(node)) {
      const children = React.Children.toArray(node.props.children);

      if (children.length === 0) return node;

      const wrappedChildren = children.map((child) => wrapTextNodes(child));

      return React.cloneElement(node, {
        ...node.props,
        children: wrappedChildren,
      });
    }

    return node;
  };

  return <>{wrapTextNodes(children)}</>;
};

function GridItemComponent(props: GridItemComponentProps) {
  const { widget, onDeleteClick, isDragging } = props;
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
      {showContextMenu && !isDragging
        ? createPortal(
            <div
              className="fixed flex flex-col gap-1"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}>
              <div className="rounded bg-secondary-600 px-2 py-1 text-xs shadow-lg">
                {widget.name}
              </div>
              <div className="flex">
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
            </div>,
            document.body
          )
        : null}
      <div
        ref={gridItemRef}
        className="relative h-full w-full"
        onMouseOver={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <EditableComponentWrapper>
          <Component
            properties={properties}
            frontmatter={widget.mdx ? widget.mdx.frontmatter : {}}
          />
        </EditableComponentWrapper>
      </div>
    </React.Fragment>
  );
}

export { GridItemComponent };
