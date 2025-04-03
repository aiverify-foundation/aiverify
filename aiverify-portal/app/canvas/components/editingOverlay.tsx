'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WidgetOnGridLayout } from '@/app/canvas/types';

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
 * It places editable text areas directly over the content that needs to be edited.
 * Changes to these text areas update the corresponding widget properties.
 * The form is submitted when the user clicks outside of it.
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

      // Account for scroll position
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      overlayRef.current.style.top = `${rect.top + scrollTop}px`;
      overlayRef.current.style.left = `${rect.left + scrollLeft}px`;
      overlayRef.current.style.width = `${rect.width}px`;
      overlayRef.current.style.minHeight = `${rect.height}px`;
    }
  }, [originalElement]);

  // Find editable elements in the original element and create text areas for them
  useEffect(() => {
    if (!originalElement || !overlayRef.current || !widget.properties) return;

    // Clear any existing content
    const formElement = overlayRef.current.querySelector('form');
    if (formElement) {
      // Clear all existing content
      while (formElement.firstChild) {
        formElement.removeChild(formElement.firstChild);
      }

      // Find all elements with data-aivkey attribute
      const editableElements =
        originalElement.querySelectorAll('[data-aivkey]');

      // If no elements with data-aivkey are found, fall back to text elements
      if (editableElements.length === 0) {
        const textElements = originalElement.querySelectorAll(
          'p, h1, h2, h3, h4, h5, h6'
        );

        textElements.forEach((element, index) => {
          if (widget.properties && index < widget.properties.length) {
            createTextareaForElement(
              element,
              widget.properties[index].key,
              formElement
            );
          }
        });
      } else {
        // Create textareas for elements with data-aivkey
        editableElements.forEach((element) => {
          const key = element.getAttribute('data-aivkey');
          if (key) {
            createTextareaForElement(element, key, formElement);
          }
        });
      }
    }
  }, [originalElement, widget.properties]);

  // Helper function to create a textarea for an element
  const createTextareaForElement = (
    element: Element,
    propertyKey: string,
    formElement: Element
  ) => {
    // Create a textarea for the element
    const textarea = document.createElement('textarea');
    textarea.className = `overlay-textarea input-${element.tagName.toLowerCase()}`;
    textarea.value = propertyValues[propertyKey] || element.textContent || '';
    textarea.dataset.propertyKey = propertyKey;

    // Position the textarea over the original element
    const elementRect = element.getBoundingClientRect();
    const overlayRect = overlayRef.current!.getBoundingClientRect();

    textarea.style.position = 'absolute';
    textarea.style.top = `${elementRect.top - overlayRect.top}px`;
    textarea.style.left = `${elementRect.left - overlayRect.left}px`;
    textarea.style.width = `${elementRect.width}px`;
    textarea.style.minHeight = `${elementRect.height}px`;

    // Auto-resize the textarea
    textarea.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;

      // Update the corresponding property
      const key = target.dataset.propertyKey;
      if (key) {
        handlePropertyChange(key, target.value);
      }
    });

    // Add blur event to save changes when user clicks away from textarea
    textarea.addEventListener('blur', () => {
      // We don't need to do anything here as property values are already updated
      // through the input event handler
    });

    // Append the textarea to the form
    formElement.appendChild(textarea);

    // Trigger the input event to set the initial height
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);
  };

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
        className="fixed z-50 overflow-visible rounded-md border-2 border-blue-500 bg-transparent p-0 text-black">
        <form
          onSubmit={handleFormSubmit}
          className="relative h-full w-full">
          {/* No save button - changes are saved automatically when clicking outside */}
        </form>
      </div>
    </div>,
    document.body
  );
}

export { EditingOverlay };
