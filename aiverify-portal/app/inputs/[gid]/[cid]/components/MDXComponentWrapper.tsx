import React from 'react';

// Define a specific type for HTML attributes
interface HTMLAttributes {
  class?: string;
  for?: string;
  tabindex?: string | number;
  readonly?: boolean | string;
  accesskey?: string;
  autocomplete?: string;
  contenteditable?: string | boolean;
  contextmenu?: string;
  draggable?: boolean | 'true' | 'false';
  dropzone?: string;
  spellcheck?: boolean | 'true' | 'false';
  [key: string]: unknown; // Allow for other attributes we haven't explicitly defined
}

// This function will handle the conversion of HTML attributes to DOM properties
const convertAttributes = (props: HTMLAttributes): Record<string, unknown> => {
  const convertedProps: Record<string, unknown> = { ...props };

  // Convert common HTML attributes to their corresponding DOM properties
  if (props.class !== undefined) {
    convertedProps.className = props.class;
    delete convertedProps.class;
  }

  if (props.for !== undefined) {
    convertedProps.htmlFor = props.for;
    delete convertedProps.for;
  }

  if (props.tabindex) {
    convertedProps.tabIndex = props.tabindex;
    delete convertedProps.tabindex;
  }

  if (props.readonly !== undefined) {
    // Convert string "true"/"false" to boolean
    if (typeof props.readonly === 'string') {
      convertedProps.readOnly = props.readonly === 'true';
    } else {
      convertedProps.readOnly = props.readonly;
    }
    delete convertedProps.readonly;
  }

  // Add more conversions as necessary. These are less common, but good to handle.
  if (props.accesskey) {
    convertedProps.accessKey = props.accesskey;
    delete convertedProps.accesskey;
  }

  if (props.autocomplete) {
    convertedProps.autoComplete = props.autocomplete;
    delete convertedProps.autocomplete;
  }

  if (props.contenteditable) {
    convertedProps.contentEditable = props.contenteditable;
    delete convertedProps.contenteditable;
  }

  if (props.contextmenu) {
    convertedProps.contextMenu = props.contextmenu;
    delete convertedProps.contextmenu;
  }

  if (props.draggable) {
    convertedProps.draggable = props.draggable;
    delete convertedProps.draggable;
  }

  if (props.dropzone) {
    // Note: dropzone is now a DOM property
    // No conversion needed, but good to be aware of.
  }

  if (props.spellcheck) {
    convertedProps.spellCheck = props.spellcheck;
    delete convertedProps.spellcheck;
  }

  return convertedProps;
};

// Define props type for the wrapper component
interface MDXComponentWrapperProps {
  component: React.ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
}

// This wrapper will convert the HTML attributes to DOM properties before rendering the component
const MDXComponentWrapper: React.FC<MDXComponentWrapperProps> = ({
  component: Component,
  ...props
}) => {
  if (!Component) {
    throw new Error('MDXComponentWrapper: component prop is required');
  }
  const convertedProps = convertAttributes(props);
  return <Component {...convertedProps} />;
};

export default MDXComponentWrapper;
