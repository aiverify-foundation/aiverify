import React, { createContext, useState } from 'react';
import produce from 'immer';
import { ProjectReportStatus } from 'src/types/project.interface';
import {
  CreateNewNotificationInput,
  StandardNotification,
  NotificationType,
  ReadStatus,
  ReportStatusNotification,
  AssetStatusNotification,
  AssetType,
} from '../types';
import { FetchResult, useMutation } from '@apollo/client';
import {
  GQL_CREATE_NOTIFICATION,
  GQL_DELETE_NOTIFICATION,
  GQL_GET_ALL_NOTIFICATIONS,
  GQL_UPDATE_NOTIFICATION_READ,
  GqlCreateNotificationResult,
  GqlDeleteResult,
  GqlNotificationsResult,
  GqlUpdateReadStatusResult,
} from './gql';
import graphqlClient from 'src/lib/graphqlClient';
import { AssetValidationStatus } from 'src/types/dataset.interface';

type NotificationsProviderProps = { children: React.ReactNode };

const NotificationsStateContext = createContext<
  | {
      notificationsData:
        | (StandardNotification | ReportStatusNotification)[]
        | undefined;
      createNotification: (newNotif: CreateNewNotificationInput) => void;
      updateNotificationStatusToRead: (_id: string) => void;
      deleteNotification: (_id: string) => void;
      fetchAllNotifications: () => void;
    }
  | undefined
>(undefined);

function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [notificationsData, setNotificationsData] =
    useState<
      (
        | StandardNotification
        | ReportStatusNotification
        | AssetStatusNotification
      )[]
    >();
  const [addNotificationToDB] = useMutation<GqlCreateNotificationResult>(
    GQL_CREATE_NOTIFICATION
  );
  const [updateNotificationReadStatusInDB] =
    useMutation<GqlUpdateReadStatusResult>(GQL_UPDATE_NOTIFICATION_READ);
  const [deleteNotificationFromDB] = useMutation<GqlDeleteResult>(
    GQL_DELETE_NOTIFICATION
  );

  async function createNotification(newNotif: CreateNewNotificationInput) {
    let notif:
      | Omit<StandardNotification, 'id'>
      | Omit<ReportStatusNotification, 'id'>
      | Omit<AssetStatusNotification, 'id'>;
    let result: FetchResult<GqlCreateNotificationResult> | undefined;
    let titleText: string;

    if (newNotif.type === NotificationType.REPORT_STATUS) {
      let projectId: string | undefined;
      let reportStatus: ProjectReportStatus | undefined;
      let projectName: string | undefined;

      if ('reportStatus' in newNotif) {
        reportStatus = newNotif.reportStatus;
      } else {
        console.error(
          'Cannot create Report Status Notification. "reportStatus" is required'
        );
        return;
      }

      if ('projectId' in newNotif) {
        projectId = newNotif.projectId;
      } else {
        console.error(
          'Cannot create Report Status Notification. "projectId" is required'
        );
        return;
      }

      if ('projectName' in newNotif) {
        projectName = newNotif.projectName;
      } else {
        console.error(
          'Cannot create Report Status Notification. "projectName" is required'
        );
        return;
      }

      notif = {
        type: newNotif.type,
        readStatus: ReadStatus.NEW,
        title: newNotif.title || '',
        projectId: projectId as string,
        projectName: projectName as string,
        reportStatus: reportStatus as ProjectReportStatus,
        subject: newNotif.subject,
        body: newNotif.body,
        timestamp: new Date().toISOString(),
      };
    } else if (
      newNotif.type === NotificationType.DATASET_STATUS ||
      newNotif.type === NotificationType.MODEL_STATUS
    ) {
      let assetStatus: AssetValidationStatus | undefined;
      let assetName: string | undefined;

      const assetType =
        newNotif.type === NotificationType.DATASET_STATUS
          ? AssetType.DATASET
          : AssetType.MODEL;

      if ('assetStatus' in newNotif) {
        assetStatus = newNotif.assetStatus;
      } else {
        console.error(
          'Cannot create Asset Status Notification. "assetStatus" is required'
        );
        return;
      }

      if ('assetName' in newNotif) {
        assetName = newNotif.assetName;
      } else {
        console.error(
          'Cannot create Asset Status Notification. "assetName" is required'
        );
        return;
      }

      notif = {
        type: newNotif.type,
        readStatus: ReadStatus.NEW,
        title: newNotif.title || '',
        subject: newNotif.subject,
        body: newNotif.body,
        assetType,
        assetStatus: assetStatus as AssetValidationStatus,
        assetName: assetName as string,
        timestamp: new Date().toISOString(),
      };
    } else {
      if (newNotif.projectId !== undefined) {
        console.error(
          `"projectId" is ignored in Standard Notification. Did you mean to create notification type "${NotificationType.REPORT_STATUS}"`
        );
      }
      if (newNotif.projectName !== undefined) {
        console.error(
          `"projectName" is ignored in Standard Notification. Did you mean to create notification type "${NotificationType.REPORT_STATUS}"`
        );
      }
      if (newNotif.reportStatus !== undefined) {
        console.error(
          `"reportStatus" is ignored in Standard Notification. Did you mean to create notification type "${NotificationType.REPORT_STATUS}"`
        );
      }

      titleText = 'System Notification';

      notif = {
        type: newNotif.type,
        readStatus: ReadStatus.NEW,
        title: titleText,
        subject: newNotif.subject,
        body: newNotif.body,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      result = await addNotificationToDB({ variables: { notif } });
    } catch (err) {
      console.error(err);
    }

    setNotificationsData(
      produce((draft) => {
        if (draft && result && result.data && result.data.createNotification.id)
          draft.push({ id: result.data.createNotification.id, ...notif });
      })
    );
  }

  async function updateNotificationStatusToRead(id: string) {
    let result: FetchResult<GqlUpdateReadStatusResult>;
    try {
      result = await updateNotificationReadStatusInDB({
        variables: { id, readStatus: ReadStatus.DONE },
      });
      if (!result.data) {
        console.log(
          `There was a problem in trying to update "readStatus" - ${result}`
        );
      }
    } catch (err) {
      console.error(err);
    }

    setNotificationsData(
      produce((draft) => {
        if (draft === undefined) return;
        if (
          !result ||
          !result.data ||
          !result.data.updateNotificationReadStatus.id
        )
          return;
        const notif = draft.find((notif) => notif.id === id);
        if (notif) notif.readStatus = ReadStatus.DONE;
      })
    );
  }

  async function deleteNotification(id: string) {
    let result: FetchResult<GqlDeleteResult>;
    try {
      result = await deleteNotificationFromDB({ variables: { id } });
      if (!result.data) {
        console.log(
          `There was a problem in trying to delete notification - ${result}`
        );
      }
    } catch (err) {
      console.error(err);
    }

    setNotificationsData(
      produce((draft) => {
        if (draft == undefined) return;
        if (!result || !result.data) return;
        const idx = draft.findIndex((notif) => notif && notif.id === id);
        draft.splice(idx, 1);
      })
    );
  }

  async function fetchAllNotifications() {
    try {
      const { data } = await graphqlClient().query<GqlNotificationsResult>({
        query: GQL_GET_ALL_NOTIFICATIONS,
      });
      setNotificationsData(data.notifications);
    } catch (err) {
      console.error(`notificationService:getNotifications - ${err}`);
    }
  }

  const contextValue = {
    notificationsData,
    createNotification,
    updateNotificationStatusToRead,
    deleteNotification,
    fetchAllNotifications,
  };

  return (
    <NotificationsStateContext.Provider value={contextValue}>
      {children}
    </NotificationsStateContext.Provider>
  );
}

function useNotifications() {
  const context = React.useContext(NotificationsStateContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
}

export { NotificationsProvider, useNotifications };
