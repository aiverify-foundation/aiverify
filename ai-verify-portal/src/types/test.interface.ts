import { Algorithm } from './plugin.interface';
import Dataset, { DatasetColumn } from './dataset.interface';
import Model from './model.interface';

export interface TestInformation {
  algorithmGID: string;
  algorithm?: Algorithm;
  modelDataset?: Model;
  testDataset?: Dataset;
  groundTruthDataset?: Dataset;
  groundTruth?: DatasetColumn; // ground truth column
  isTestArgumentsValid: boolean; // whether testArguments is valid
  testArguments: object; // arguments filled in by users
}

export enum TestEngineTaskStatus {
  Pending = 'Pending',
  Running = 'Running',
  Cancelled = 'Cancelled', // cancelled by user
  Success = 'Success',
  Error = 'Error',
}

export enum ErrorMessageSeverity {
  information = 'information',
  warning = 'warning',
  critical = 'critical',
}

export interface ErrorMessage {
  severity: ErrorMessageSeverity;
  description: string;
  code?: string;
}

export interface TestEngineTask {
  algorithmGID: string; // GID of algorithm
  algorithm: Algorithm;
  testArguments: any; // snapshot of test arguments
  status: TestEngineTaskStatus;
  progress?: number; // progress in percentage
  timeStart?: Date;
  timeTaken?: number; // in seconds
  output?: any;
  errorMessages?: ErrorMessage[];
}
