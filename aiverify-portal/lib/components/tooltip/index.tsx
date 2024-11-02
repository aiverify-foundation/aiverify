import clsx from 'clsx';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import styles from './styles/tooltip.module.css';

enum TooltipPosition {
  top = 'top',
  bottom = 'bottom',
  left = 'left',
  right = 'right',
}

type TooltipProps = {
  defaultShow?: boolean;
  flash?: boolean;
  flashDuration?: number;
  delay?: number;
  disabled?: boolean;
  backgroundColor?: string;
  transparent?: boolean;
  fontColor?: string;
  position?: TooltipPosition;
  content: React.ReactNode;
  contentMaxWidth?: number;
  contentMinWidth?: number;
  offsetLeft?: number;
  offsetTop?: number;
};

type TooltipPlacementStyle = Pick<
  React.CSSProperties,
  'top' | 'left' | 'opacity'
>;

const result: TooltipPlacementStyle = {
  top: 0,
  left: 0,
  opacity: 1,
};

const defaultPlacement: TooltipPlacementStyle = {
  top: -9999,
  left: -9999,
  opacity: 0,
};

const arrowSize = 10;

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

  widthDiff = Math.abs(triggerEl.offsetWidth - tooltipRect.width) / 2;
  heightDiff = Math.abs(triggerEl.offsetHeight - tooltipRect.height) / 2;

  switch (position) {
    case TooltipPosition.top:
      result.left =
        (triggerEl.offsetWidth > tooltipRect.width
          ? triggerRect.left + widthDiff
          : triggerRect.left - widthDiff) + offsetLeft;
      result.top =
        triggerRect.top - tooltipEl.offsetHeight - arrowSize + offsetTop;
      break;
    case TooltipPosition.bottom:
      result.left =
        (triggerEl.offsetWidth > tooltipRect.width
          ? triggerRect.left + widthDiff
          : triggerRect.left - widthDiff) + offsetLeft;
      result.top = triggerRect.bottom + arrowSize + offsetTop;
      break;
    case TooltipPosition.left:
      result.top =
        (triggerEl.offsetHeight > tooltipRect.height
          ? triggerRect.top + heightDiff
          : triggerRect.top - 10) + offsetTop;
      result.left =
        triggerRect.left - tooltipEl.offsetWidth - arrowSize + offsetLeft;
      break;
    case TooltipPosition.right:
      result.top =
        (triggerEl.offsetHeight > tooltipRect.height
          ? triggerRect.top + heightDiff
          : triggerRect.top - 10) + offsetTop;
      result.left = triggerRect.right + arrowSize + offsetLeft;
      break;
  }

  return result;
}

function Tooltip(props: PropsWithChildren<TooltipProps>) {
  const {
    defaultShow = false,
    flash = false,
    flashDuration = 5000,
    disabled = false,
    delay = 200,
    content,
    contentMaxWidth = 300,
    contentMinWidth,
    position = TooltipPosition.left,
    backgroundColor = '#FFFFFF',
    transparent = false,
    fontColor = '#676767',
    offsetLeft = 0,
    offsetTop = 0,
    children,
  } = props;
  const [placement, setPlacement] =
    useState<TooltipPlacementStyle>(defaultPlacement);
  const [isHovering, setIsHovering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const positionClassname = `pos__${position}`;
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Use useRef to store the timeout

  function handleMouseOver() {
    if (disabled && !defaultShow) return;
    if (!tooltipRef.current || !triggerRef.current) return;
    showTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      if (!tooltipRef.current || !triggerRef.current) return;
      const placementStyle = calculateTooltipPosition(
        triggerRef.current,
        tooltipRef.current,
        position,
        offsetLeft,
        offsetTop
      );
      setPlacement(placementStyle);
    }, delay);
  }

  function handleMouseOut() {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (disabled && defaultShow) return;
    setIsHovering(false);
    if (!isHovering) {
      setPlacement(defaultPlacement);
    }
  }

  useEffect(() => {
    if (defaultShow) {
      setTimeout(() => {
        handleMouseOver();
      }, 0);
    } else if (!isHovering) {
      // Added check for isHovering before hiding the tooltip
      handleMouseOut();
    }
  }, [defaultShow, isHovering]);

  useEffect(() => {
    if (flash) {
      setTimeout(() => {
        handleMouseOver();
      }, 0);
      setTimeout(() => {
        if (!isHovering) {
          // Check if not hovering over the tooltip before hiding
          handleMouseOut();
        }
      }, flashDuration);
    }
  }, [flash]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <>
      {isMounted &&
        ReactDOM.createPortal(
          <div
            ref={tooltipRef}
            className={clsx(styles.tooltip)}
            style={{
              ...placement,
              backgroundColor: transparent ? 'transparent' : backgroundColor,
              boxShadow: transparent ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3)',
              color: fontColor,
            }}
            onMouseOver={handleMouseOver}
            // onMouseOut={handleMouseOut}
          >
            <div
              className={clsx(styles.pointer, styles[positionClassname])}
              style={{
                borderColor: transparent ? 'transparent' : backgroundColor,
                boxShadow: transparent
                  ? 'none'
                  : '0 2px 8px rgba(0, 0, 0, 0.4)',
              }}
            />
            <div
              className={styles.content}
              style={{
                backgroundColor: transparent ? 'transparent' : backgroundColor,
                maxWidth: contentMaxWidth,
                minWidth: contentMinWidth,
              }}>
              {content}
            </div>
          </div>,
          document.body // This is where the portal will render
        )}
      <div
        className={styles.childWrapper}
        ref={triggerRef}
        onMouseOver={!flash ? handleMouseOver : undefined}
        onMouseOut={!flash ? handleMouseOut : undefined}>
        {children}
      </div>
    </>
  );
}

export { Tooltip, TooltipPosition };
