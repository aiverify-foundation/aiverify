import React from 'react';

type ResizeHandleProps = {
  ref?: React.RefObject<HTMLSpanElement>;
  [key: string]: unknown;
};

const mainHandleClasses =
  'react-resizable-handle invisible group-hover:visible group-active:visible no-print';

function ResizeHandle(props: ResizeHandleProps) {
  const { handleAxis, ref, ...rest } = props;
  const positionClasses = {
    sw: `${mainHandleClasses} react-resizable-handle-sw`,
    nw: `${mainHandleClasses} react-resizable-handle-nw`,
    se: `${mainHandleClasses} react-resizable-handle-se`,
    ne: `${mainHandleClasses} react-resizable-handle-ne`,
  };

  const className = positionClasses[handleAxis as keyof typeof positionClasses] || mainHandleClasses;

  return (
    <span
      ref={ref}
      className={className}
      {...rest}
    />
  );
}

export { ResizeHandle };
