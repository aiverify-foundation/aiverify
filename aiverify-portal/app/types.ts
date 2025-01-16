type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  model: string;
  status: string;
};

type TestResults = {
  gid: string;
  cid: string;
  version: string;
  startTime: string;
  timeTaken: number;
  testArguments: {
    testDataset: string;
    mode: string;
    modelType: string;
    groundTruthDataset: string;
    groundTruth: string;
    algorithmArgs: string;
    modelFile: string;
  };
  output: string;
  artifacts: any[];
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

type DataColumn = {
  name: string;
  datatype: string;
  label: string;
};

type DatasetStatus = 'invalid' | 'valid';
type FileType = 'file' | 'folder';

type Dataset = {
  id: number;
  name: string;
  description: string | null;
  fileType: FileType;
  filename: string;
  zip_hash: string;
  size: number;
  serializer: string | null;
  dataFormat: string | null;
  numRows: number | null;
  numCols: number | null;
  dataColumns: string[] | null;
  status: DatasetStatus;
  errorMessages: string | null;
  created_at: string;
  updated_at: string;
};

export type { Project, TestResults, Dataset };
