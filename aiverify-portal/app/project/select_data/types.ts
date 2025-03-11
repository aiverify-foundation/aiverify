export interface Algorithm {
  gid: string;
  cid: string;
  name: string;
  description: string;
}

export interface TestResult {
  id: number;
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
  artifacts?: string[];
  name: string;
  created_at: string;
  updated_at: string;
}

export interface InputBlock {
  gid: string;
  cid: string;
  name: string;
  description: string;
  group?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectData {
  testModelId?: string;
  inputBlocks: Array<{
    gid: string;
    cid: string;
    id: number;
  }>;
  testResults: Array<{
    gid: string;
    cid: string;
    id: number;
  }>;
}
