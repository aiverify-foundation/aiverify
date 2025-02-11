import React from 'react';

type ResizeHandleProps = {
  ref?: React.RefObject<HTMLSpanElement>;
  [key: string]: unknown;
};

function ResizeHandle(props: ResizeHandleProps) {
  const { handleAxis, ref, ...rest } = props;
  const positionClasses = {
    sw: 'react-resizable-handle react-resizable-handle-sw invisible group-hover:visible group-active:visible',
    nw: 'react-resizable-handle react-resizable-handle-nw invisible group-hover:visible group-active:visible',
    se: 'react-resizable-handle react-resizable-handle-se invisible group-hover:visible group-active:visible',
    ne: 'react-resizable-handle react-resizable-handle-ne invisible group-hover:visible group-active:visible',
  };

  return (
    <span
      ref={ref}
      className={positionClasses[handleAxis as keyof typeof positionClasses]}
      {...rest}
    />
  );
}

export { ResizeHandle };
