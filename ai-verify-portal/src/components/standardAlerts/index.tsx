import { AlertBox } from '../alertBox';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import styles from './styles/standardAlerts.module.css';
import React, { PropsWithChildren } from 'react';
import clsx from 'clsx';

enum AlertType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

type StandardAlertProps = {
  alertType: AlertType;
  disableCloseIcon?: boolean;
  headingText?: string;
  style?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
  headingStyle?: React.CSSProperties;
  onCloseIconClick?: () => void;
};

type AlertIconProps = {
  type: AlertType;
  style?: React.CSSProperties;
};

function AlertIcon(props: AlertIconProps) {
  const { type, style } = props;
  const modifierClass = `icon_${type}`;

  switch (type) {
    case AlertType.ERROR:
      return (
        <ErrorOutlineIcon
          className={clsx(styles.alertIcon, styles[modifierClass])}
          style={style}
        />
      );
    case AlertType.WARNING:
      return (
        <ErrorOutlineIcon
          className={clsx(styles.alertIcon, styles[modifierClass])}
          style={style}
        />
      );
    case AlertType.INFO:
      return (
        <InfoIcon
          className={clsx(styles.alertIcon, styles[modifierClass])}
          style={style}
        />
      );
    case AlertType.SUCCESS:
      return (
        <CheckCircleOutlineIcon
          className={clsx(styles.alertIcon, styles[modifierClass])}
          style={style}
        />
      );
    default:
      return null;
  }
}

function StandardAlert(props: PropsWithChildren<StandardAlertProps>) {
  const {
    headingText,
    alertType,
    disableCloseIcon = false,
    style,
    iconStyle,
    headingStyle,
    onCloseIconClick,
    children,
  } = props;

  const customAlertBoxStyles: React.CSSProperties = {
    border: '1px solid rgba(112, 47, 138, 0.5)',
    padding: '15px 35px 15px 20px',
    boxShadow: 'none',
    width: '100%',
    minHeight: '100px',
    height: 'auto',
    ...style,
  };
  const customIconStyles: React.CSSProperties = disableCloseIcon
    ? { display: 'none' }
    : { color: 'lightGray' };
  const modifierClass = `type_${alertType}`;

  return (
    <AlertBox
      containerStyles={customAlertBoxStyles}
      iconStyles={customIconStyles}
      onCloseIconClick={onCloseIconClick}>
      <div className={clsx(styles.stdAlertBody, styles[modifierClass])}>
        <div className={styles.iconWrapper}>
          <AlertIcon type={alertType} style={iconStyle} />
        </div>
        <div className={clsx(styles.stdAlertContent, styles[modifierClass])}>
          <div className={styles.stdAlertHeading} style={headingStyle}>
            {headingText}
          </div>
          {children}
        </div>
      </div>
    </AlertBox>
  );
}

export { StandardAlert, AlertType };
