'use client';

import { MDXContentProps } from 'mdx-bundler/client';
import React from 'react';

/**
 * IMPORTANT: dataKeyName value is used to identify the data key in the properties object.
 * This key name must match the key name used in the mdx parser/bundler in aiverify-apigw-node
 * @see {@link /aiverify/aiverify-apigw-node/bundler.ts} for the correct value.
 */
const dataKeyName = 'data-aivkey';

export const editorInputClassName = 'editor-input';

/**
 * This is a higher-order component that allows developers to add modifications the MDX component.
 * Currently, it adds text edit functionality to the MDX component.
 * The following components are editable:
 * - p
 * - h1
 * - h2
 * - h3
 *
 * @param WrappedComponent - The MDX component to wrap.
 * @returns A new component that adds text behavior to the MDX component.
 *
 * @see {@link /app/canvas/components/editingOverlay.tsx} to see how this component is used.
 */

export const hocAddTextEditFunctionality = <P extends MDXContentProps>(
  WrappedComponent: React.FunctionComponent<P>
) => {
  return function EditableComponent(props: P) {
    const h1Ref = React.useRef<HTMLTextAreaElement>(null);
    const h2Ref = React.useRef<HTMLTextAreaElement>(null);
    const h3Ref = React.useRef<HTMLTextAreaElement>(null);
    const pRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      // Set the cursor to the end of the text area
      [h1Ref, h2Ref, h3Ref, pRef].forEach((ref) => {
        if (ref.current) {
          const length = ref.current.value.length;
          ref.current.setSelectionRange(length, length);
        }
      });
    }, []);

    // Create a ref to capture the rendered output
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Process the rendered content after mounting
    React.useEffect(() => {
      if (!contentRef.current) return;

      // Find all elements with the data-aivkey attribute
      const editableElements = contentRef.current.querySelectorAll(
        `[${dataKeyName}]`
      );

      // Track the first textarea to give it focus
      let firstTextarea: HTMLTextAreaElement | null = null;

      editableElements.forEach((element) => {
        const key = element.getAttribute(dataKeyName);
        const content = element.textContent || '';
        const tagName = element.tagName.toLowerCase();

        // Create a textarea to replace the element
        const textarea = document.createElement('textarea');
        textarea.name = key || '';
        textarea.value = content;
        textarea.className = `input-${tagName} ${editorInputClassName}`;

        // Add input handler for auto-resizing
        textarea.addEventListener('input', (e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
        });

        // Add click handler to prevent event propagation
        textarea.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        // Replace the original element with the textarea
        element.parentNode?.replaceChild(textarea, element);

        // Auto-adjust height
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;

        // Store the first textarea we find
        if (!firstTextarea) {
          firstTextarea = textarea;
        }

        // Set cursor position at the end of the text
        const length = content.length;
        textarea.setSelectionRange(length, length);
      });

      // Focus the first textarea if one exists
      if (firstTextarea) {
        (firstTextarea as HTMLTextAreaElement).focus();
      }
    }, []);

    return (
      <div ref={contentRef}>
        <WrappedComponent {...props} />
      </div>
    );
  };
};
