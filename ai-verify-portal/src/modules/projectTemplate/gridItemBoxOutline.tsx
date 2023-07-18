import { useEffect, useState } from 'react';
import styles from './styles/canvas.module.css';

const GRID_ITEM_CLASSNAME = 'aiv-report-widget';
const CANVAS_PAD = 10; // this value must be the same as css var --A4-canvas-padding
const OUTLINE_SIZE = 4;

// draw a 'box' around grid item element, using div element for each side
function SelectedGridItemBoxOutline({ el }: { el: HTMLDivElement }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const width = el.style.width;
  const height = el.style.height;
  const matrix = new DOMMatrixReadOnly(
    getComputedStyle(el).getPropertyValue('transform')
  );
  const top = `${matrix.m42 + CANVAS_PAD}px`;
  const left = `${matrix.m41 + CANVAS_PAD}px`;
  const outlineTopStyle: React.CSSProperties = {
    top,
    left,
    width,
    height: `${OUTLINE_SIZE}px`,
  };
  const outlineRightStyle: React.CSSProperties = {
    top,
    left: `calc(${left} + ${width} - ${OUTLINE_SIZE}px)`,
    width: `${OUTLINE_SIZE}px`,
    height,
  };
  const outlineBottomStyle: React.CSSProperties = {
    top: `calc(${top} + ${height} - ${OUTLINE_SIZE}px)`,
    left,
    width,
    height: `${OUTLINE_SIZE}px`,
  };
  const outlineLeftStyle: React.CSSProperties = {
    top,
    left,
    width: `${OUTLINE_SIZE}px`,
    height,
  };

  function handleTransitionStarted() {
    el.addEventListener('transitionend', handleTransitionEnd);
    setIsTransitioning(true);
  }

  function handleTransitionEnd() {
    el.removeEventListener('transitionstart', handleTransitionStarted);
    setIsTransitioning(false);
  }

  useEffect(() => {
    // transition handling - for grid 'dragstop' use case where grid item animates to snap to grid line.
    // Only draw when transition to grid line is done.
    el.addEventListener('transitionstart', handleTransitionStarted);
    return () => {
      el.removeEventListener('transitionstart', handleTransitionStarted);
    };
  }, []);

  if (
    el.tagName.toLowerCase() !== 'div' &&
    !el.classList.contains(GRID_ITEM_CLASSNAME)
  ) {
    console.error(
      'Selected grid item outline box not drawn - INVALID-GRID-ITEM'
    );
    return null;
  }

  return isTransitioning ? null : (
    <>
      <div className={styles.canvas_item_highlight} style={outlineTopStyle} />
      <div className={styles.canvas_item_highlight} style={outlineRightStyle} />
      <div
        className={styles.canvas_item_highlight}
        style={outlineBottomStyle}
      />
      <div className={styles.canvas_item_highlight} style={outlineLeftStyle} />
    </>
  );
}

export { SelectedGridItemBoxOutline, GRID_ITEM_CLASSNAME };
