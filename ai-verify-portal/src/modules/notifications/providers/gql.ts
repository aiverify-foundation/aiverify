import { gql } from '@apollo/client';
import { ReportStatusNotification } from '../types';

export type GqlNotificationsResult = {
  notifications: ReportStatusNotification[];
};

export type GqlCreateNotificationResult = {
  createNotification: ReportStatusNotification;
};

export type GqlUpdateReadStatusResult = {
  updateNotificationReadStatus: ReportStatusNotification;
};

export type GqlDeleteResult = {
  deleteNotification: string;
};

export const GQL_CREATE_NOTIFICATION = gql`
  mutation ($notif: NotificationInput!) {
    createNotification(notif: $notif) {
      id
      type
      readStatus
      title
      subject
      body
      timestamp
      projectId
      projectName
      reportStatus
    }
  }
`;
export const GQL_GET_ALL_NOTIFICATIONS = gql`
  query Query {
    notifications {
      id
      type
      readStatus
      title
      subject
      body
      timestamp
      projectId
      projectName
      reportStatus
      assetType
      assetStatus
      assetName
    }
  }
`;

export const GQL_UPDATE_NOTIFICATION_READ = gql`
  mutation UpdateNotificationReadStatus(
    $id: ObjectID!
    $readStatus: ReadStatus
  ) {
    updateNotificationReadStatus(id: $id, readStatus: $readStatus) {
      id
      type
      readStatus
      title
      subject
      body
      timestamp
      projectId
      projectName
      reportStatus
      assetType
      assetStatus
      assetName
    }
  }
`;

export const GQL_DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ObjectID!) {
    deleteNotification(id: $id)
  }
`;

export const TESTTASK_SUBSCRIPTION = gql`
  subscription OnTestTaskUpdated {
    testTaskUpdatedNoFilter {
      status
      algorithmGID
      errorMessages {
        description
        code
      }
    }
  }
`;

export const REPORTSTATUS_SUBSCRIPTION = gql`
  subscription OnReportStatusUpdated {
    reportStatusUpdatedNoFilter {
      status
      projectID
      projectSnapshot {
        projectInfo {
          name
        }
      }
    }
  }
`;

export const VALIDATEDATASET_SUBSCRIPTION = gql`
  subscription OnValidateDatasetUpdated {
    validateDatasetStatusUpdated {
      filename
      status
      errorMessages
    }
  }
`;

export const VALIDATEMODEL_SUBSCRIPTION = gql`
  subscription OnValidateModelUpdated {
    validateModelStatusUpdated {
      filename
      status
      errorMessages
    }
  }
`;
