import { getMDXComponent, MDXContentProps } from 'mdx-bundler/client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { WidgetProperty } from '@/app/types';
type EditingOverlayProps = {
  widget: WidgetOnGridLayout;
  originalElement: HTMLElement | null;
  onClose: (updatedWidget: WidgetOnGridLayout) => void;
  pageIndex: number;
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
  return function EditableComponent(props: P) {
    return (
      <WrappedComponent
        {...props}
        components={{
          p: ({
            children,
            ...props
          }: { children: React.ReactNode } & Record<string, any>) => {
            console.log('props for P tag!', props);
            if ('data-aivkey' in props) {
              return (
                <input
                  type="text"
                  name={props['data-aivkey']}
                  defaultValue={children as string}
                  className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              );
            }
            return <div {...props}>{children}</div>;
          },
          h1: ({
            children,
            ...props
          }: { children: React.ReactNode } & Record<string, any>) => {
            console.log('props for H1 tag!', props);
            if ('data-aivkey' in props) {
              return (
                <input
                  type="text"
                  name={props['data-aivkey']}
                  defaultValue={children as string}
                  className="w-full text-[1rem] font-bold text-black focus:outline-none"
                />
              );
            }
            return <h1 {...props}>{children}</h1>;
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
}: EditingOverlayProps) {
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
        [property.key]: property.value || property.default || property.helper,
      };
    }, {});
  }, [widget, widget.properties]);

  const handleTextChange = (value: string) => {};

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const values = Object.fromEntries(formData);
    const updatedWidget: WidgetOnGridLayout = {
      ...widget,
      properties: widget.properties?.map((prop) => ({
        ...prop,
        value: values[prop.key] || prop.value,
      })),
    };

    onClose(updatedWidget);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const form = overlayRef.current?.querySelector('form');
      form?.requestSubmit();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-40 bg-transparent"
      onClick={handleBackgroundClick}>
      <div
        ref={overlayRef}
        className="fixed z-50 border border-blue-500 bg-white">
        <form onSubmit={handleFormSubmit}>
          <EditableMDXComponent
            properties={properties}
            onTextChange={handleTextChange}
            frontmatter={widget.mdx.frontmatter}
          />
        </form>
      </div>
    </div>,
    document.body
  );
}

export { EditingOverlay };
