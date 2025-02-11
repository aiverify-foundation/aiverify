import React from 'react';

const ResizeHandle = React.forwardRef<HTMLSpanElement, { handleAxis: string }>(
  (props, ref) => {
    const positionClasses = {
      sw: 'react-resizable-handle react-resizable-handle-sw invisible group-hover:visible group-active:visible',
      nw: 'react-resizable-handle react-resizable-handle-nw invisible group-hover:visible group-active:visible',
      se: 'react-resizable-handle react-resizable-handle-se invisible group-hover:visible group-active:visible',
      ne: 'react-resizable-handle react-resizable-handle-ne invisible group-hover:visible group-active:visible',
    };
    const { handleAxis, ...rest } = props;

    return (
      <span
        ref={ref}
        className={positionClasses[handleAxis as keyof typeof positionClasses]}
        {...rest}
      />
    );
  }
);

ResizeHandle.displayName = 'ResizeHandle';

export { ResizeHandle };
