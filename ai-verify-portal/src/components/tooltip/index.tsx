import React, {
  PropsWithChildren,
  ReactElement,
  useRef,
  useState,
} from 'react';
import styles from './styles/tooltip.module.css';
import clsx from 'clsx';

enum TooltipPosition {
  top = 'top',
  bottom = 'bottom',
  left = 'left',
  right = 'right',
}

type TooltipProps = {
  backgroundColor?: string;
  fontColor?: string;
  position?: TooltipPosition;
  content: ReactElement | string;
  offsetLeft?: number;
  offsetTop?: number;
};

type TooltipPlacementStyle = Pick<
  React.CSSProperties,
  'top' | 'left' | 'opacity'
>;

function calculateTooltipPosition(
  triggerEl: HTMLElement,
  tooltipEl: HTMLElement,
  position: TooltipPosition,
  offsetLeft = 0,
  offsetTop = 0
): TooltipPlacementStyle {
  const triggerRect = triggerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  let widthDiff = 0;
  let heightDiff = 0;

  const result: TooltipPlacementStyle = {
    top: 0,
    left: 0,
    opacity: 1,
  };

  widthDiff = Math.abs(triggerEl.offsetWidth - tooltipRect.width) / 2;
  heightDiff = Math.abs(triggerEl.offsetHeight - tooltipRect.height) / 2;

  switch (position) {
    case TooltipPosition.top:
      result.left =
        (triggerEl.offsetWidth > tooltipRect.width
          ? triggerRect.left + widthDiff
          : triggerRect.left - widthDiff) + offsetLeft;
      result.top = triggerRect.top - tooltipEl.offsetHeight + offsetTop;
      break;
    case TooltipPosition.bottom:
      result.left =
        (triggerEl.offsetWidth > tooltipRect.width
          ? triggerRect.left + widthDiff
          : triggerRect.left - widthDiff) + offsetLeft;
      result.top = triggerRect.bottom + offsetTop;
      break;
    case TooltipPosition.left:
      result.top =
        (triggerEl.offsetHeight > tooltipRect.height
          ? triggerRect.top + heightDiff
          : triggerRect.top - heightDiff) + offsetTop;
      result.left = triggerRect.left - tooltipEl.offsetWidth + offsetLeft;
      break;
    case TooltipPosition.right:
      result.top =
        (triggerEl.offsetHeight > tooltipRect.height
          ? triggerRect.top + heightDiff
          : triggerRect.top - heightDiff) + offsetTop;
      result.left = triggerRect.right + offsetLeft;
      break;
  }

  return result;
}

const defaultPlacement: TooltipPlacementStyle = {
  top: -9999,
  left: -9999,
  opacity: 0,
};

function Tooltip(props: PropsWithChildren<TooltipProps>) {
  const {
    content,
    position = TooltipPosition.left,
    backgroundColor = '#FFFFFF',
    fontColor = '#676767',
    offsetLeft = 0,
    offsetTop = 0,
    children,
  } = props;
  const [placement, setPlacement] =
    useState<TooltipPlacementStyle>(defaultPlacement);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const positionClassname = `pos__${position}`;

  let borderColor = '';

  switch (position) {
    case TooltipPosition.top:
      borderColor = `${backgroundColor} transparent transparent ${backgroundColor}`;
      break;
    case TooltipPosition.bottom:
      borderColor = `transparent ${backgroundColor} ${backgroundColor} transparent`;
      break;
    case TooltipPosition.left:
      borderColor = `${backgroundColor} ${backgroundColor} transparent transparent`;
      break;
    case TooltipPosition.right:
      borderColor = `transparent transparent ${backgroundColor} ${backgroundColor}`;
      break;
  }

  function handleMouseOver() {
    if (!tooltipRef.current || !triggerRef.current) return;
    const placementStyle = calculateTooltipPosition(
      triggerRef.current,
      tooltipRef.current,
      position,
      offsetLeft,
      offsetTop
    );
    setPlacement(placementStyle);
  }

  function handleMouseOut() {
    setPlacement(defaultPlacement);
  }

  return (
    <>
      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{ ...placement, backgroundColor, color: fontColor }}>
        <div
          className={clsx(styles.pointer, styles[positionClassname])}
          style={{ borderColor }}
        />
        <div className={styles.content} style={{ backgroundColor }}>
          {content}
        </div>
      </div>
      <div
        ref={triggerRef}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}>
        {children}
      </div>
    </>
  );
}

export { Tooltip, TooltipPosition };
