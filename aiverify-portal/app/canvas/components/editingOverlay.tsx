'use client';

import { getMDXComponent } from 'mdx-bundler/client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { hocAddTextEditFunctionality } from './hocAddTextEditFuncitonality';

type EditingOverlayRequiredStyles = `editing-overlay ${string}`;

type EditingOverlayProps = {
  widget: WidgetOnGridLayout;
  originalElement: HTMLElement | null;
  onClose: (updatedWidget: WidgetOnGridLayout) => void;
  pageIndex: number;
};

/**
 * @file aiverify/aiverify-portal/app/canvas/components/editingOverlay.tsx
 * The editing overlay is a modal that allows the user to edit the properties of a widget.
 * There is a background overlay that is used to close the overlay when the user clicks outside of it.
 * The modal renders a form that contains the widget properties. It is rendered directly above the widget.
 * The form is submitted when the user clicks outside of it.
 *
 * @see {@link /app/canvas/components/hocAddTextEditFuncitonality.tsx} to see which components are editable.
 */

function EditingOverlay({
  widget,
  originalElement,
  onClose,
}: EditingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>(
    {}
  );

  // Initialize property values from widget properties
  useEffect(() => {
    if (widget.properties && widget.properties.length > 0) {
      const initialValues: Record<string, string> = {};
      widget.properties.forEach((prop) => {
        initialValues[prop.key] =
          prop.value !== undefined ? prop.value : prop.default || '';
      });
      setPropertyValues(initialValues);
    }
  }, [widget.properties]);

  useEffect(() => {
    // get the original element's bounding client rect for positioning and sizing the editing overlay
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
    // Add text edit functionality to the MDX component before returning it
    return hocAddTextEditFunctionality(MDXComponent);
  }, [widget, widget.mdx]);

  const properties = useMemo(() => {
    if (!widget.properties) return {};
    return widget.properties.reduce((props, property) => {
      return {
        ...props,
        [property.key]:
          propertyValues[property.key] ||
          property.value ||
          property.default ||
          property.helper,
      };
    }, {});
  }, [widget.properties, propertyValues]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!widget.properties) return;

    const updatedWidget: WidgetOnGridLayout = {
      ...widget,
      properties: widget.properties.map((prop) => ({
        ...prop,
        value: propertyValues[prop.key] || prop.value,
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

  const handlePropertyChange = (key: string, value: string) => {
    setPropertyValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const editingOverlayRequiredStyles: EditingOverlayRequiredStyles =
    'editing-overlay fixed inset-0 z-40 bg-transparent';

  return createPortal(
    <div
      className={editingOverlayRequiredStyles}
      onClick={handleBackgroundClick}>
      <div
        ref={overlayRef}
        className="fixed z-50 border border-blue-500 bg-white text-black">
        <form onSubmit={handleFormSubmit}>
          <EditableMDXComponent
            properties={properties}
            frontmatter={widget.mdx.frontmatter}
            onPropertyChange={handlePropertyChange}
          />
        </form>
      </div>
    </div>,
    document.body
  );
}

export { EditingOverlay };
