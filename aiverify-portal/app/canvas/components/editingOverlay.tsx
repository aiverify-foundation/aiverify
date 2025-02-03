import { getMDXComponent, MDXContentProps } from 'mdx-bundler/client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { cn } from '@/lib/utils/twmerge';
import styles from './styles/designer.module.css';
type EditingOverlayProps = {
  widget: WidgetOnGridLayout;
  originalElement: HTMLElement | null;
  onClose: () => void;
  onSave: (updatedWidget: WidgetOnGridLayout) => void;
};

/**
 * This is a higher-order component that allows developers to add modifications like styling to the MDX component.
 * It is currently not doing anything, but it is a placeholder for future use.
 * Currently it has placeholders for h2, h1, but no modifications are added.
 * @param WrappedComponent - The MDX component to wrap.
 * @returns A new component that adds text behavior to the MDX component.
 */
const withEditingBehavior = <P extends MDXContentProps>(
  WrappedComponent: React.FunctionComponent<P>
) => {
  return function EditableComponent(
    props: P & { onTextChange?: (path: string, value: string) => void }
  ) {
    return (
      <WrappedComponent
        {...props}
        components={{
          ...props.components,
          // Handle regular text nodes
          p: ({ children }: { children: React.ReactNode }) => {
            if (typeof children === 'string') {
              return (
                <input
                  type="text"
                  value={children}
                  onChange={(e) => props.onTextChange?.('p', e.target.value)}
                  className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              );
            }
            return <p>{children}</p>;
          },
          // Handle headings similarly
          h1: (h1Props: { children: React.ReactNode }) => {
            return (
              <input
                type="text"
                value={h1Props.children as string}
                onChange={(e) => props.onTextChange?.('h1', e.target.value)}
                className={cn(styles.h1TextInput, 'w-full focus:outline-none')}
              />
            );
          },
          // Add other heading levels as needed...
        }}
      />
    );
  };
};

function EditingOverlay({
  widget,
  originalElement,
  onClose,
  onSave,
}: EditingOverlayProps) {
  const [editedText, setEditedText] = useState<Record<string, string>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (originalElement && overlayRef.current) {
      const rect = originalElement.getBoundingClientRect();
      overlayRef.current.style.top = `${rect.top}px`;
      overlayRef.current.style.left = `${rect.left}px`;
      overlayRef.current.style.width = `${rect.width}px`;
      overlayRef.current.style.height = `${rect.height}px`;
    }
  }, [originalElement]);

  const EditableMDXComponent = useMemo(() => {
    if (!widget.mdx) {
      const MissingMdxMessage = () => (
        <div>{`${widget.name} - ${widget.cid} : Missing mdx`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    const MDXComponent = getMDXComponent(widget.mdx.code);
    return withEditingBehavior(MDXComponent);
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

  const handleTextChange = (path: string, value: string) => {
    setEditedText((prev) => ({
      ...prev,
      [path]: value,
    }));
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-40 bg-transparent bg-opacity-50"
      onClick={handleBackgroundClick}>
      <div
        ref={overlayRef}
        className="fixed z-50 rounded-md border-2 border-blue-500 bg-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
        <EditableMDXComponent
          properties={properties}
          onTextChange={handleTextChange}
          frontmatter={widget.mdx.frontmatter}
        />
      </div>
    </div>,
    document.body
  );
}

export { EditingOverlay };
