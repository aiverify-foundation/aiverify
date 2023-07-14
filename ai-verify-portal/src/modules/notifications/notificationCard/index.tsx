import styles from '../styles/notificationCard.module.css';
import clsx from 'clsx';
import {
  StandardNotification,
  NotificationType,
  ReadStatus,
  ReportStatusNotification,
  AssetStatusNotification,
} from '../types';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import { CardReportStatus } from './cardReportStatus';
import { CardStandard } from './cardStandard';
import { Icon } from 'src/components/icon';
import { IconName } from 'src/components/icon/iconNames';
import { AssetStatusCard } from './assetStatus';
import { ProjectReportStatus } from 'src/types/project.interface';
import { AssetValidationStatus } from 'src/types/dataset.interface';

enum NotificationColor {
  ALERT = '#e6eef8',
  ERROR = '#fdecec',
  WHITE = '#ffffff',
}

type NotificationCardProps = {
  notification: StandardNotification | ReportStatusNotification;
  style?: React.CSSProperties;
  hideDeleteIcon?: boolean;
  showMsgBody?: boolean;
  enableDeletingEffect?: boolean;
  onClick?: (msg: StandardNotification) => void;
  onDeleteClick?: (id: string, preventFadeEffect?: boolean) => void;
};

type ReadIndicatorProps = {
  status: ReadStatus;
  style?: React.CSSProperties;
};

type SpecializedCardProps<T = StandardNotification> = {
  notification: T;
  showMsgBody?: boolean;
};

function ReadIndicator(props: ReadIndicatorProps) {
  const { status, style } = props;
  const styleModifier = `indicator__${status.toLowerCase()}`;
  return (
    <div
      className={clsx(styles.readIndicator, styles[styleModifier])}
      style={style}
    />
  );
}

function NotificationCard(props: NotificationCardProps) {
  const {
    notification,
    showMsgBody = false,
    hideDeleteIcon = false,
    enableDeletingEffect = false,
    onClick,
    onDeleteClick,
  } = props;

  const { type, readStatus, timestamp } = notification;

  const dateTimeDisplay = new Date(timestamp).toLocaleString('en-GB');

  let notifColor = NotificationColor.ALERT;

  if (showMsgBody) {
    notifColor = NotificationColor.WHITE;
  } else {
    if (type === NotificationType.REPORT_STATUS) {
      switch ((notification as ReportStatusNotification).reportStatus) {
        case ProjectReportStatus.ReportGenerated:
          notifColor = NotificationColor.ALERT;
          break;
        default:
          notifColor = NotificationColor.ALERT;
      }
    } else if (
      type === NotificationType.MODEL_STATUS ||
      type === NotificationType.DATASET_STATUS
    ) {
      switch ((notification as AssetStatusNotification).assetStatus) {
        case AssetValidationStatus.Invalid:
        case AssetValidationStatus.Cancelled:
        case AssetValidationStatus.Error:
          notifColor = NotificationColor.ERROR;
          break;
        default:
          notifColor = NotificationColor.ALERT;
      }
    } else if (type === NotificationType.GENERAL) {
      notifColor = NotificationColor.ALERT;
    } else if (type === NotificationType.ERROR) {
      notifColor = NotificationColor.ERROR;
    }
  }

  function handleCardClick() {
    if (onClick) onClick(notification);
  }

  function handleDeleteClickWithoutFadeout(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (onDeleteClick) onDeleteClick(notification.id, true);
  }

  function handleDeleteClick(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (onDeleteClick) onDeleteClick(notification.id);
  }

  return (
    <div
      className={clsx(
        styles.listCard,
        enableDeletingEffect ? styles.listCard__fadeout : null,
        onClick ? styles.listCard__hoverable : null
      )}
      style={{ backgroundColor: notifColor }}
      onClick={handleCardClick}>
      <ReadIndicator status={readStatus} />
      {showMsgBody ? (
        <Icon
          name={IconName.TRASH}
          size={14}
          onClick={handleDeleteClickWithoutFadeout}
          style={{
            cursor: 'pointer',
            position: 'absolute',
            right: '10px',
            top: '12px',
            fontSize: '14px',
          }}
        />
      ) : !hideDeleteIcon ? (
        <CloseIcon className={styles.deleteIcon} onClick={handleDeleteClick} />
      ) : null}
      {type === NotificationType.GENERAL ? (
        <CardStandard
          showMsgBody={showMsgBody}
          notification={notification as StandardNotification}
        />
      ) : null}
      {type === NotificationType.ERROR ? (
        <CardStandard
          showMsgBody={showMsgBody}
          notification={notification as StandardNotification}
        />
      ) : null}
      {type === NotificationType.REPORT_STATUS ? (
        <CardReportStatus
          showMsgBody={showMsgBody}
          notification={notification as ReportStatusNotification}
        />
      ) : null}
      {type === NotificationType.DATASET_STATUS ||
      type === NotificationType.MODEL_STATUS ? (
        <AssetStatusCard
          showMsgBody={showMsgBody}
          notification={notification as AssetStatusNotification}
        />
      ) : null}
      <div className={styles.dateTime}>{dateTimeDisplay}</div>
    </div>
  );
}

export { NotificationCard };
export type { SpecializedCardProps };
