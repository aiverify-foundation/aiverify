import Dataset from './dataset.interface';
import ModelFile from './model.interface';
import ProjectTemplate from './projectTemplate.interface';
import { TestInformation, TestEngineTask } from './test.interface';

export enum ProjectReportStatus {
  NotGenerated = 'NotGenerated', //this maps to report status undefined while the rest of the properties below map directly to report status string return from APIGW
  RunningTests = 'RunningTests',
  GeneratingReport = 'GeneratingReport',
  ReportGenerated = 'ReportGenerated',
}

export interface Report {
  projectID: string; // id of project
  projectSnapshot: Project; // snapshot of project
  status: ProjectReportStatus; // report status
  timeStart: Date;
  timeTaken: number;
  totalTestTimeTaken: number;
  inputBlockData?: any; // snapshot of input block data
  tests?: TestEngineTask[]; // tests that are run for this report
}

export interface ModelAndDatasets {
  model: ModelFile;
  testDataset: Dataset;
  groundTruthDataset: Dataset;
  groundTruthColumn: string;
}

export type ModelAndDatesetsFileNames = {
  model: string;
  testDataset: string;
  groundTruthDataset: string;
  modelType: string;
  groundTruthColumn: string;
};

/**
 * Project is template with data
 */
export default interface Project extends ProjectTemplate {
  template: ProjectTemplate;
  inputBlockData?: any;
  testInformationData?: TestInformation[];
  modelAndDatasets?: ModelAndDatasets;
  report?: Report;
}

export interface ProjectInput extends ProjectTemplate {
  // template: ProjectTemplate;
  inputBlockData?: any;
  testInformationData?: TestInformation[];
  // modelAndDatasets?: ModelAndDatasets;
  modelAndDatasets?: {
    modelId?: string;
    testDatasetId?: string;
    groundTruthDatasetId?: string;
    groundTruthColumn?: string;
  };
  report?: Report;
}
