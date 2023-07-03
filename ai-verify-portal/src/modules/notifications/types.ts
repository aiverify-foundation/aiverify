import { AssetValidationStatus } from 'src/types/dataset.interface';
import { ProjectReportStatus } from 'src/types/project.interface';

enum NotificationType {
  REPORT_STATUS = 'ReportStatus',
  DATASET_STATUS = 'DatasetStatus',
  MODEL_STATUS = 'ModelStatus',
  GENERAL = 'General',
  ERROR = 'Error',
}

enum ReadStatus {
  NEW = 'New',
  DONE = 'Done',
}

enum AssetType {
  DATASET = 'Dataset',
  MODEL = 'Model',
}

interface StandardNotification {
  id: string;
  type: NotificationType;
  readStatus: ReadStatus;
  title: string;
  subject?: string;
  body?: string;
  timestamp: string;
}

interface ReportStatusNotification extends StandardNotification {
  projectId: string;
  projectName: string;
  reportStatus: ProjectReportStatus;
}

interface AssetStatusNotification extends StandardNotification {
  assetType: AssetType;
  assetName: string;
  assetStatus: AssetValidationStatus;
}

type CreateReportStatusInput = {
  projectId?: string;
  projectName?: string;
  reportStatus?: ProjectReportStatus;
};

type AssetStatusInput = {
  assetType?: AssetType;
  assetName?: string;
  assetStatus?: AssetValidationStatus;
};

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type NewNotification = Omit<
  StandardNotification,
  'id' | 'readStatus' | 'timestamp'
>;
type CreateNewNotificationInput = Optional<NewNotification, 'title'> &
  CreateReportStatusInput &
  AssetStatusInput;

export { NotificationType, ReadStatus, AssetType };
export type {
  StandardNotification,
  ReportStatusNotification,
  AssetStatusNotification,
  CreateNewNotificationInput,
  Optional,
};
