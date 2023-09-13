import React, { PropsWithChildren, forwardRef, useEffect, useRef } from 'react';
import { ReportWidget } from 'src/types/plugin.interface';
import { changeWheelSpeed } from 'src/lib/utils';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import WidgetsIcon from '@mui/icons-material/Widgets';
import clsx from 'clsx';
import styles from './styles/leftpanel.module.css';

type DraggableWidgetProp = {
  widget: ReportWidget;
  disabled?: boolean;
  onDragStart: (
    widget: ReportWidget
  ) => React.DragEventHandler<HTMLDivElement> | undefined;
  onDragEnd: () => void;
  onDrag: React.DragEventHandler<HTMLDivElement>;
};

type WidgetDetailsProps = {
  widget: ReportWidget;
};

function DraggableWidget(props: PropsWithChildren<DraggableWidgetProp>) {
  const { widget, disabled = false, onDragStart, onDragEnd, onDrag } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let removeWheelHandler: () => void;
    const el = divRef.current;
    const handleTransitionStart = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        removeWheelHandler = changeWheelSpeed(scrollContainerRef.current, 0.08);
      }
    };
    el.addEventListener('transitionstart', handleTransitionStart);
    return () => {
      el.removeEventListener('transitionstart', handleTransitionStart, false);
      if (removeWheelHandler) removeWheelHandler();
    };
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    return changeWheelSpeed(scrollContainerRef.current, 0.08);
  }, []);

  return (
    <div
      key={widget.gid}
      ref={divRef}
      data-test-id={`draggableWidget-${widget.gid}`}
      className={clsx(
        styles.draggableWidget,
        disabled ? styles.draggableWidget_disabled : null
      )}
      draggable={!disabled}
      unselectable="on"
      onDrag={!disabled ? onDrag : undefined}
      onDragStart={!disabled ? onDragStart(widget) : undefined}
      onDragEnd={!disabled ? onDragEnd : undefined}>
      <div className={styles.widgetHeadingWrapper}>
        <div style={{ display: 'flex' }}>
          <WidgetsIcon className={styles.draggableWidgetIcon} />
          <div className={styles.widgetHeading}>{widget.name}</div>
        </div>
        {!disabled ? (
          <div
            className={styles.draggableHandleIconWrapper}
            style={{ display: 'flex' }}>
            <DragIndicatorIcon className={styles.draggableHandleIcon} />
          </div>
        ) : null}
      </div>
      <div className={styles.widgetDetailsDivider}></div>
      <WidgetDetails widget={widget} ref={scrollContainerRef} />
    </div>
  );
}

const WidgetDetails = forwardRef<HTMLDivElement, WidgetDetailsProps>(
  function WidgetDetails(props: WidgetDetailsProps, scrollContainerRef) {
    const { widget } = props;
    const hasDependencies = widget.dependencies && widget.dependencies.length;
    const hasTags = widget.tags && widget.tags.length;

    return (
      <div
        ref={scrollContainerRef}
        className={styles.widgetDetailsScrollContainer}>
        <div
          className={styles.widgetDetailsRow}
          style={{ flexDirection: 'column' }}>
          <div className={styles.widgetDetailLabel}>Description:</div>
          <div className={styles.widgetDetailText}>{widget.description}</div>
        </div>
        <div className={styles.widgetDetailsRow}>
          <div className={styles.widgetDetailLabel}>Version:</div>
          <div className={styles.widgetDetailText}>{widget.version}</div>
        </div>
        {hasTags ? (
          <div className={styles.widgetDetailsRow}>
            <div className={styles.widgetDetailLabel}>Tags: </div>
            <div className={styles.widgetDetailText}>
              {widget.tags.join(', ')}
            </div>
          </div>
        ) : null}
        {hasDependencies ? (
          <div
            className={styles.widgetDetailsRow}
            style={{ flexDirection: 'column' }}>
            <div className={styles.widgetDetailLabel}>Dependencies:</div>
            <ul>
              {widget.dependencies.map((dep) => (
                <li key={`${widget.gid}-${dep.gid}`}>
                  {dep.valid ? (
                    <div color="inherit">{dep.gid}</div>
                  ) : (
                    <div style={{ color: 'red' }}>{dep.gid}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
);

export { DraggableWidget, WidgetDetails };
