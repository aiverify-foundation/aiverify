import clsx from 'clsx';
import styles from './styles/canvas.module.css';
import React, { MouseEventHandler, PropsWithChildren, forwardRef } from 'react';
import { GRID_ITEM_CLASSNAME } from './gridItemBoxOutline';

type ReportWidgetGridItemWrapperProps = {
  id: string;
  style?: React.CSSProperties; // reserved for react-grid-layout internals
  wrapperStyles?: React.CSSProperties; // reserved for report widget visual styles / formerly layou properties
  className?: string;
  onClick: MouseEventHandler;
  onRightClick?: MouseEventHandler;
  onMouseDown?: MouseEventHandler;
  onMouseUp?: MouseEventHandler;
};

const ReportWidgetGridItemWrapper = forwardRef<
  HTMLDivElement,
  PropsWithChildren<ReportWidgetGridItemWrapperProps>
>(function ReportWidgetGridItemWrapper(props, ref) {
  const {
    id,
    className,
    onMouseUp,
    onMouseDown,
    onClick,
    onRightClick,
    children,
    style,
    wrapperStyles,
  } = props;
  return (
    <div
      id={`div-${id}`}
      key={id}
      ref={ref}
      onClick={onClick}
      onContextMenu={onRightClick}
      onMouseUp={onMouseUp}
      onMouseDown={onMouseDown}
      className={clsx(
        className,
        styles.reportWidgetComponent,
        GRID_ITEM_CLASSNAME
      )}
      style={{ ...wrapperStyles, ...style }}>
      {children}
    </div>
  );
});

export { ReportWidgetGridItemWrapper };
