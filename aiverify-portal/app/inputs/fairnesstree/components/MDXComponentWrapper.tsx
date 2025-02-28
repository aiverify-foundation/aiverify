import React from 'react';

// This function will handle the conversion of HTML attributes to DOM properties
const convertAttributes = (props: any) => {
  const convertedProps = { ...props };

  // Convert common HTML attributes to their corresponding DOM properties
  if (props.class) {
    convertedProps.className = props.class;
    delete convertedProps.class;
  }
  if (props.for) {
    convertedProps.htmlFor = props.for;
    delete convertedProps.for;
  }

  // Add more conversions as necessary.  These are less common, but good to handle.
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

// This wrapper will convert the HTML attributes to DOM properties before rendering the component
const MDXComponentWrapper: React.FC<any> = ({
  component: Component,
  ...props
}) => {
  const convertedProps = convertAttributes(props);

  return <Component {...convertedProps} />;
};

export default MDXComponentWrapper;
