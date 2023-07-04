import { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import HeightIcon from '@mui/icons-material/Height';
import { IconButton } from 'src/components/iconButton';
import EditIcon from '@mui/icons-material/Edit';
import styles from './styles/canvas.module.css';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

const GRID_ITEM_CLASSNAME = 'aiv-report-widget';
const CANVAS_PAD = 10; // this value must be the same as css var --A4-canvas-padding

type SelectedGridActionButtonsProps = {
  el: HTMLDivElement;
  hideEditBtn?: boolean;
  title?: string;
  isDynamicHeight?: boolean;
  onDeleteClick: () => void;
  onEditClick: () => void;
};

function SelectedGridActionButtons(props: SelectedGridActionButtonsProps) {
  const {
    el,
    hideEditBtn = false,
    onDeleteClick,
    onEditClick,
    title,
    isDynamicHeight = false,
  } = props;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const width = el.style.width;
  const matrix = new DOMMatrixReadOnly(
    getComputedStyle(el).getPropertyValue('transform')
  );
  const top = `${matrix.m42 + CANVAS_PAD}px`;
  const left = `${matrix.m41 + CANVAS_PAD}px`;

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
    console.error('Action buttons not drawn - INVALID-GRID-ITEM');
    return null;
  }

  return isTransitioning ? null : (
    <div
      className={styles.menuContainer}
      id="gridItemActionMenu"
      style={{ top, left: `calc(${left} + ${width} + 5px)` }}>
      {title !== undefined ? (
        <div className={styles.gridItem_title}>{title}</div>
      ) : null}
      {isDynamicHeight ? (
        <Tooltip
          position={TooltipPosition.top}
          content="Content of this widget is longer than page height. It will automatically print on multiple pages during report generation.">
          <div className={styles.gridItem_dheightNote}>
            <HeightIcon style={{ color: '#787878', fontSize: 22 }} />
            <div>Dynamic Height </div>
          </div>
        </Tooltip>
      ) : null}
      <div className={styles.gridItem_menu}>
        <div className={styles.gridItem_btnWrapper}>
          <IconButton
            iconComponent={DeleteIcon}
            noOutline
            onClick={onDeleteClick}
          />
        </div>
        {!hideEditBtn ? (
          <div className={styles.gridItem_btnWrapper}>
            <IconButton
              iconComponent={EditIcon}
              noOutline
              onClick={onEditClick}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { SelectedGridActionButtons };
