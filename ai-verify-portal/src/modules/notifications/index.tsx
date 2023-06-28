import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './styles/notifications.module.css';
import { IconButton } from 'src/components/iconButton';
import { NotificationCard } from './notificationCard';
import { useNotifications } from './providers/notificationsContext';
import clsx from 'clsx';
import { soundBell } from './sounds/soundBell';
import { Icon } from '../../components/icon';
import { IconName } from '../../components/icon/iconNames';
import {
  StandardNotification,
  NotificationType,
  ReadStatus,
  ReportStatusNotification,
  AssetType,
  AssetStatusNotification,
} from './types';
import { useSubscription } from '@apollo/client';
import { ProjectReportStatus, Report } from 'src/types/project.interface';
import {
  REPORTSTATUS_SUBSCRIPTION,
  TESTTASK_SUBSCRIPTION,
  VALIDATEDATASET_SUBSCRIPTION,
  VALIDATEMODEL_SUBSCRIPTION,
} from './providers/gql';
import { TestEngineTask, TestEngineTaskStatus } from 'src/types/test.interface';
import { soundClick } from './sounds/soundClick';
import {
  AssetValidationStatus,
  DatasetStatusUpdate,
  ModelStatusUpdate,
} from 'src/types/dataset.interface';
import { useRouter } from 'next/router';

type NotificationsProps = {
  style?: React.CSSProperties;
};

function Notifications(props: NotificationsProps) {
  const { style } = props;
  const router = useRouter();
  const [showPanel, setShowPanel] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<
    StandardNotification | undefined
  >();
  const [msgIdToDelete, setMsgIdToDelete] = useState<string>();
  const {
    notificationsData,
    createNotification,
    updateNotificationStatusToRead,
    deleteNotification,
    fetchAllNotifications,
  } = useNotifications();
  const [flyoutMessage, setFlyoutMessage] = useState<
    StandardNotification | undefined
  >();
  const notifRef = useRef<HTMLDivElement>(null);
  const flyOutTimer = useRef<NodeJS.Timeout>();
  const isDelete = useRef(false);
  const latestTimestamp = useRef<number | undefined>(undefined);
  const initialLoadDone = useRef(false);
  const unread =
    notificationsData !== undefined
      ? notificationsData.filter((notif) => notif.readStatus === ReadStatus.NEW)
      : [];
  const sortedNotifications =
    notificationsData !== undefined ? [...notificationsData] : [];
  sortedNotifications.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
  const { data: reportSubData, error: reportSubError } = useSubscription<{
    reportStatusUpdatedNoFilter: Report;
  }>(REPORTSTATUS_SUBSCRIPTION);
  const { data: testSubData, error: testSubError } = useSubscription<{
    testTaskUpdatedNoFilter: TestEngineTask;
  }>(TESTTASK_SUBSCRIPTION);
  const { data: datasetSubData, error: datasetSubError } = useSubscription<{
    validateDatasetStatusUpdated: DatasetStatusUpdate;
  }>(VALIDATEDATASET_SUBSCRIPTION);
  const { data: modelSubData, error: modelSubError } = useSubscription<{
    validateModelStatusUpdated: ModelStatusUpdate;
  }>(VALIDATEMODEL_SUBSCRIPTION);

  function handleMainIconClick() {
    setShowPanel((prev) => !prev);
    setSelectedMessage(undefined);
    setFlyoutMessage(undefined);
  }

  function handleDeleteClick(id: string, preventFadeEffect = false) {
    isDelete.current = true;
    if (!preventFadeEffect) {
      setMsgIdToDelete(id);
    } else {
      deleteNotification(id);
    }
    if (selectedMessage) setSelectedMessage(undefined);
  }

  function handleMessageRead(notification: StandardNotification) {
    if (notification.readStatus === ReadStatus.DONE) return;
    updateNotificationStatusToRead(notification.id);
  }

  function handleCardClick(
    notification:
      | StandardNotification
      | ReportStatusNotification
      | AssetStatusNotification
  ) {
    setTimeout(() => {
      // requeue so that bindDocClickHandler executes first
      if (notification.body && notification.body.trim() !== '') {
        setShowPanel(true);
        setSelectedMessage(notification);
        handleMessageRead(notification);
      } else if (notification.type === NotificationType.REPORT_STATUS) {
        if ('projectId' in notification) {
          window.open(`/api/report/${notification.projectId}`, '_blank');
          handleMessageRead(notification);
          return;
        }
        console.error('projectId is undefined');
      } else if (notification.type === NotificationType.DATASET_STATUS) {
        router.push('/assets/datasets');
        handleMessageRead(notification);
      } else if (notification.type === NotificationType.MODEL_STATUS) {
        router.push('/assets/models');
        handleMessageRead(notification);
      }
    }, 0);
  }

  function handleFlyoutClick() {
    setFlyoutMessage(undefined);
    setTimeout(() => {
      setShowPanel(true);
    }, 0);
  }

  function handleMsgBackClick() {
    setTimeout(() => {
      setSelectedMessage(undefined);
    }, 0);
  }

  const bindDocClickHandler = useCallback((e: Event) => {
    if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
      if (!selectedMessage) setShowPanel(false);
    }
  }, []);

  useEffect(() => {
    if (!msgIdToDelete) return;
    setTimeout(() => {
      deleteNotification(msgIdToDelete);
    }, 200);
  }, [msgIdToDelete]);

  useEffect(() => {
    if (showPanel) {
      document.addEventListener('click', bindDocClickHandler);
    } else {
      document.removeEventListener('click', bindDocClickHandler);
    }
    return () => document.removeEventListener('click', bindDocClickHandler);
  }, [showPanel]);

  useEffect(() => {
    if (reportSubData && reportSubData.reportStatusUpdatedNoFilter) {
      const report = reportSubData.reportStatusUpdatedNoFilter;

      if (report.status === ProjectReportStatus.ReportGenerated) {
        try {
          createNotification({
            type: NotificationType.REPORT_STATUS,
            reportStatus: ProjectReportStatus.ReportGenerated,
            projectId: report.projectID,
            projectName: report.projectSnapshot.projectInfo.name,
          });
        } catch (err) {
          console.error(
            `notificationsContext:createNotificaiton on report event - ${err}`
          );
        }
      }
    }
  }, [reportSubData]);

  useEffect(() => {
    if (testSubData && testSubData.testTaskUpdatedNoFilter) {
      const testTask = testSubData.testTaskUpdatedNoFilter;

      if (testTask.status === TestEngineTaskStatus.Error) {
        try {
          const titleText = 'System Message';
          const subjectText = 'Error encountered while running test';
          let bodyText = `GID-${testTask.algorithmGID}`;
          const errors = testTask.errorMessages
            ? testTask.errorMessages.map((err) => err.description)
            : [];
          const errorText = errors.join(', ');
          bodyText = `${bodyText} / ${errorText}`;
          createNotification({
            type: NotificationType.ERROR,
            title: titleText,
            subject: subjectText,
            body: bodyText,
          });
        } catch (err) {
          console.error(
            `notificationsContext:createNotificaiton on testtask event - ${err}`
          );
        }
      }
    }
  }, [testSubData]);

  useEffect(() => {
    if (datasetSubData && datasetSubData.validateDatasetStatusUpdated) {
      const dataset = datasetSubData.validateDatasetStatusUpdated;
      // return // disable because of multiple events issue / remove return statement when fixed

      if (
        dataset.status === AssetValidationStatus.Error ||
        dataset.status == AssetValidationStatus.Invalid
      ) {
        try {
          const bodyText = dataset.errorMessages;
          createNotification({
            type: NotificationType.DATASET_STATUS,
            assetType: AssetType.DATASET,
            assetName: dataset.filename,
            assetStatus: dataset.status,
            body: bodyText,
          });
        } catch (err) {
          console.error(
            `notificationsContext:createNotificaiton on dataset validation event - ${err}`
          );
        }
        return;
      }

      try {
        createNotification({
          type: NotificationType.DATASET_STATUS,
          assetType: AssetType.DATASET,
          assetName: dataset.filename,
          assetStatus: dataset.status,
        });
      } catch (err) {
        console.error(
          `notificationsContext:createNotificaiton on dataset validation event - ${err}`
        );
      }
    }
  }, [datasetSubData]);

  useEffect(() => {
    if (modelSubData && modelSubData.validateModelStatusUpdated) {
      const model = modelSubData.validateModelStatusUpdated;
      // return // disable because of multiple events issue / remove return statement when fixed

      if (
        model.status === AssetValidationStatus.Error ||
        model.status === AssetValidationStatus.Invalid
      ) {
        try {
          const bodyText = model.errorMessages;
          createNotification({
            type: NotificationType.MODEL_STATUS,
            assetType: AssetType.MODEL,
            assetName: model.filename,
            assetStatus: model.status,
            body: bodyText,
          });
        } catch (err) {
          console.error(
            `notificationsContext:createNotificaiton on model validation event - ${err}`
          );
        }
        return;
      }

      try {
        createNotification({
          type: NotificationType.MODEL_STATUS,
          assetType: AssetType.MODEL,
          assetName: model.filename,
          assetStatus: model.status,
        });
      } catch (err) {
        console.error(
          `notificationsContext:createNotificaiton on dataset validation event - ${err}`
        );
      }
    }
  }, [modelSubData]);

  useEffect(() => {
    if (testSubError)
      console.error(`"test task" Subscription error - ${testSubError}`);
    if (reportSubError)
      console.error(
        `"report generation" Subscription error - ${reportSubError}`
      );
    if (datasetSubError)
      console.error(
        `"validate dataset" subscription error - ${datasetSubError}`
      );
    if (datasetSubError)
      console.error(`"validate model" subscription error - ${modelSubError}`);
  }, [testSubError, reportSubError, datasetSubError, modelSubError]);

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  useEffect(() => {
    // -- prevents flyout message on initial render from fetch notifications
    if (notificationsData === undefined) return;
    if (
      sortedNotifications.length &&
      sortedNotifications[0].readStatus == ReadStatus.DONE
    )
      return;
    if (initialLoadDone.current === false) {
      initialLoadDone.current = true;
      if (latestTimestamp.current == undefined && sortedNotifications[0]) {
        latestTimestamp.current = new Date(
          sortedNotifications[0].timestamp
        ).getTime();
      }
      return;
    }
    // --

    // -- flyout message if top most message is latest (exlude notifications data updated because of delete action)
    if (latestTimestamp.current == undefined) {
      if (sortedNotifications[0]) {
        latestTimestamp.current = new Date(
          sortedNotifications[0].timestamp
        ).getTime();

        if (showPanel) {
          if (isDelete.current === true) {
            isDelete.current = false;
            return;
          }
          if (sortedNotifications[0].type === NotificationType.REPORT_STATUS)
            soundBell();
          else soundClick();
        } else {
          setFlyoutMessage({ ...sortedNotifications[0] });
        }
      }
    } else {
      if (
        sortedNotifications[0] &&
        new Date(sortedNotifications[0].timestamp).getTime() >
          latestTimestamp.current
      ) {
        if (showPanel) {
          if (isDelete.current === true) {
            isDelete.current = false;
            return;
          }
          if (selectedMessage) return; // selected message body view
          if (sortedNotifications[0].type === NotificationType.REPORT_STATUS)
            soundBell();
          else soundClick();
        } else {
          setFlyoutMessage({ ...sortedNotifications[0] });
        }
      } else if (!sortedNotifications[0]) {
        latestTimestamp.current = undefined;
      }
    }
    isDelete.current = false;
    // --
  }, [notificationsData]);

  useEffect(() => {
    if (!flyoutMessage) {
      if (flyOutTimer.current) clearTimeout(flyOutTimer.current);
      return;
    }
    setShowPanel(false);
    if (flyoutMessage.type === NotificationType.REPORT_STATUS) soundBell();
    else soundClick();
    if (flyOutTimer.current) clearTimeout(flyOutTimer.current);
    flyOutTimer.current = setTimeout(() => {
      setFlyoutMessage(undefined);
    }, 5000);
  }, [flyoutMessage]);

  return (
    <div className={styles.root} style={style} ref={notifRef}>
      <div className={styles.icon} onClick={handleMainIconClick}>
        <IconButton
          noOutline
          iconFontSize={25}
          iconComponent={NotificationsNoneIcon}
        />
        {unread.length ? (
          <div className={styles.countBadge}>{unread.length}</div>
        ) : null}
      </div>
      {showPanel ? (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>Notifications</h3>
            <div className={styles.countBadgeAll}>
              {sortedNotifications.length}
            </div>
          </div>
          <div className={styles.list}>
            {selectedMessage ? (
              <div className={styles.msgNav}>
                <div className={styles.msgNavBtn} onClick={handleMsgBackClick}>
                  <Icon name={IconName.CHEVRON_LEFT} size={12} />
                  <div style={{ textAlign: 'start', marginLeft: '5px' }}>
                    back
                  </div>
                </div>
              </div>
            ) : null}
            <div className={styles.scrollContainer}>
              {notificationsData && !notificationsData.length ? (
                <div className={styles.emptyList}>No notifications</div>
              ) : null}
              {selectedMessage ? (
                <NotificationCard
                  hideDeleteIcon
                  notification={selectedMessage}
                  showMsgBody
                  onDeleteClick={handleDeleteClick}
                />
              ) : null}
              {!selectedMessage
                ? sortedNotifications.map((msg) => (
                    <NotificationCard
                      notification={msg}
                      key={msg.id}
                      onClick={handleCardClick}
                      onDeleteClick={handleDeleteClick}
                      enableDeletingEffect={msg.id === msgIdToDelete}
                    />
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={clsx(styles.flyOutMsg, flyoutMessage ? styles.flyIn : null)}>
        {flyoutMessage ? (
          <NotificationCard
            hideDeleteIcon
            notification={flyoutMessage}
            onClick={handleFlyoutClick}
            onDeleteClick={handleFlyoutClick}
          />
        ) : null}
      </div>
    </div>
  );
}

export { Notifications };
