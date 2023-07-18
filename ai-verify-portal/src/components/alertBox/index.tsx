import React, { PropsWithChildren } from 'react';
import clsx from 'clsx';
import CloseIcon from '@mui/icons-material/Close';
import Draggable from 'react-draggable';
import styles from './styles/alertBox.module.css';
import { ClientOnlyPortal } from '../clientOnlyPortal';

enum AlertBoxSize {
  XTRASMALL = 'xs',
  SMALL = 's',
  MEDIUM = 'm',
  LARGE = 'l',
  AUTO = 'auto',
}

enum AlertBoxFixedPositions {
  CENTER = 'center',
}

type DraggableAbsolutionPositon = { x: number; y: number };

type CSSAbsolutePosition = Pick<React.CSSProperties, 'top' | 'left'>;

type AlertBoxProps = {
  id?: string;
  draggable?: boolean;
  dragHandle?: string;
  size?: AlertBoxSize;
  fixedPosition?: AlertBoxFixedPositions;
  defaultPosition?: CSSAbsolutePosition | DraggableAbsolutionPositon;
  containerStyles?: React.CSSProperties;
  iconStyles?: React.CSSProperties;
  enableModalOverlay?: boolean;
  renderInPortal?: boolean;
  onCloseIconClick?: () => void;
};

type AlertBoxHeaderProps = {
  heading?: string;
  isDragHandle?: boolean;
};

type AlertBoxBodyProps = {
  bodyStyles?: React.CSSProperties;
  hasFooter?: boolean;
};

type AlertBoxFooterProps = {
  footerStyles?: React.CSSProperties;
  hasFooter?: boolean;
};

const portalDivId = 'aivModal';

function AlertBox(props: PropsWithChildren<AlertBoxProps>) {
  const {
    id,
    draggable = false,
    dragHandle,
    size = AlertBoxSize.MEDIUM,
    fixedPosition,
    defaultPosition,
    containerStyles,
    iconStyles,
    enableModalOverlay = false,
    renderInPortal = false,
    onCloseIconClick,
    children,
  } = props;

  const sizeModifier = `alertBox_${size}`;
  const positionModifier =
    defaultPosition || draggable ? 'absolute_pos' : `fixed_${fixedPosition}`;
  const modalModfier = enableModalOverlay
    ? 'with_modalOverlay'
    : 'without_modalOverlay';
  const inlineStyles = { ...containerStyles };
  const dragHandleClassName = dragHandle || 'alertbox-dragHandle';

  if (defaultPosition != undefined && 'left' in defaultPosition) {
    inlineStyles.left = defaultPosition.left;
    inlineStyles.top = defaultPosition.top;
  }

  if (draggable) {
    return (
      <>
        {enableModalOverlay ? <div className={styles.screenOverlay} /> : null}
        <Draggable
          handle={`.${dragHandleClassName}`}
          disabled={!draggable}
          defaultPosition={defaultPosition as DraggableAbsolutionPositon}>
          <div
            id={id}
            className={clsx(
              styles.alertBox,
              styles[positionModifier],
              styles[sizeModifier],
              styles[modalModfier]
            )}
            style={inlineStyles}>
            <CloseIcon
              className={styles.closeIcon}
              style={iconStyles}
              onClick={onCloseIconClick}
            />
            {children}
          </div>
        </Draggable>
      </>
    );
  }

  if (enableModalOverlay && renderInPortal) {
    return (
      <ClientOnlyPortal selector={`#${portalDivId}`}>
        {enableModalOverlay ? <div className={styles.screenOverlay} /> : null}
        <div
          id={id}
          className={clsx(
            styles.alertBox,
            styles[sizeModifier],
            styles[positionModifier],
            styles[modalModfier]
          )}
          style={inlineStyles}>
          <CloseIcon
            className={styles.closeIcon}
            style={iconStyles}
            onClick={onCloseIconClick}
          />
          {children}
        </div>
      </ClientOnlyPortal>
    );
  }

  return (
    <>
      {enableModalOverlay ? <div className={styles.screenOverlay} /> : null}
      <div
        id={id}
        className={clsx(
          styles.alertBox,
          styles[sizeModifier],
          styles[positionModifier],
          styles[modalModfier]
        )}
        style={inlineStyles}>
        <CloseIcon
          className={styles.closeIcon}
          style={iconStyles}
          onClick={onCloseIconClick}
        />
        {children}
      </div>
    </>
  );
}

function Header(props: PropsWithChildren<AlertBoxHeaderProps>) {
  const { heading, isDragHandle = false, children } = props;
  return (
    <div
      className={clsx(
        styles.alertBoxHeader,
        isDragHandle ? 'alertbox-dragHandle' : null,
        isDragHandle ? styles.header_dragHandle : null
      )}>
      <div className={styles.headingText}>{heading}</div>
      {children}
    </div>
  );
}

function Body(props: PropsWithChildren<AlertBoxBodyProps>) {
  const { bodyStyles, children, hasFooter = false } = props;
  return (
    <div
      className={clsx(
        styles.alertBoxBody,
        hasFooter ? styles.offsetFooter : null
      )}
      style={bodyStyles}>
      {children}
    </div>
  );
}

function Footer(props: PropsWithChildren<AlertBoxFooterProps>) {
  const { footerStyles, children } = props;
  return (
    <div className={styles.alertBoxFooter} style={footerStyles}>
      {children}
    </div>
  );
}

AlertBox.Body = Body;
AlertBox.Header = Header;
AlertBox.Footer = Footer;

export { AlertBox, AlertBoxSize, AlertBoxFixedPositions };
export type { DraggableAbsolutionPositon };
