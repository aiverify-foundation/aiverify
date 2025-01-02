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

type Dataset = {
  id: number;
  name: string;
  description: string;
  fileType: string;
  filename: string;
  zip_hash: string;
  size: number;
  serializer: string;
  dataFormat: string;
  numRows: number;
  numCols: number;
  dataColumns: DataColumn[];
  status: string;
  errorMessages: string;
  created_at: string;
  updated_at: string;
};

type FormState<T = Record<string, string | number>> = {
  formStatus: string;
  formErrors: Record<string, string[]> | undefined;
} & Partial<T>;

export type { Project, TestResults, Dataset, FormState };
