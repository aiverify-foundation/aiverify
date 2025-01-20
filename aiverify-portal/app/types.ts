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

export type { Project, TestResults };
