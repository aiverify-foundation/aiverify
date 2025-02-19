import { getMDXComponent } from 'mdx-bundler/client';
import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { hocAddTextEditFunctionality } from './hocAddTextEditFuncitonality';
type EditingOverlayProps = {
  widget: WidgetOnGridLayout;
  originalElement: HTMLElement | null;
  onClose: (updatedWidget: WidgetOnGridLayout) => void;
  pageIndex: number;
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
    return hocAddTextEditFunctionality(MDXComponent);
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
            frontmatter={widget.mdx.frontmatter}
          />
        </form>
      </div>
    </div>,
    document.body
  );
}

export { EditingOverlay };
