type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  model: string;
  status: string;
};

type TestResult = {
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
  artifacts: unknown[];
  name: string;
  created_at: string;
  updated_at: string;
};

type TestResultData = Record<
  string,
  | string
  | number
  | boolean
  | object
  | string[]
  | number[]
  | boolean[]
  | object[]
>;
type InputBlockData = Record<
  string,
  | string
  | number
  | boolean
  | object
  | string[]
  | number[]
  | boolean[]
  | object[]
>;

type DataColumn = {
  name: string;
  datatype: string;
  label: string;
};

type DatasetStatus = 'invalid' | 'valid';
type FileType = 'file' | 'folder';

type Dataset = {
  id: string;
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

type FormState<T = Record<string, string | number>> = {
  formStatus: string;
  formErrors: Record<string, string[]> | undefined;
} & Partial<T>;

type AlgorithmInputSchema = {
  title: string;
  description: string;
  type: string;
  required: string[];
  properties: Record<string, unknown>;
};

type AlgorithmOutputSchema = {
  title: string;
  description: string;
  type: string;
  required: string[];
  minProperties: number;
  properties: {
    feature_names: {
      type: string;
      description: string;
      minItems: number;
      items: {
        type: string;
      };
    };
    results: {
      title: string;
      description: string;
      type: string;
      minItems: number;
      items: {
        description: string;
        type: string;
        required: string[];
        minProperties: number;
        properties: {
          indices: {
            title: string;
            type: string;
            minItems: number;
            items: {
              type: string;
            };
          };
          ale: {
            title: string;
            type: string;
            minItems: number;
            items: {
              type: string;
            };
          };
          size: {
            title: string;
            type: string;
            minItems: number;
            items: {
              type: string;
            };
          };
        };
      };
    };
  };
};

type Algorithm = {
  cid: string;
  gid: string;
  name: string;
  modelType: string[];
  version: string;
  author: string;
  description: string;
  tags: string[];
  requireGroundTruth: boolean;
  language: string;
  script: string;
  module_name: string;
  inputSchema: AlgorithmInputSchema;
  outputSchema: AlgorithmOutputSchema;
  zip_hash: string;
};

type WidgetProperty = {
  key: string;
  helper: string;
  default: string;
  value?: string;
};

type MockData = {
  type: 'Algorithm' | 'InputBlock';
  gid: string | null;
  cid: string;
  data: Record<
    string,
    | string
    | number
    | boolean
    | object
    | string[]
    | number[]
    | boolean[]
    | object[]
  >;
};

type Widget = {
  cid: string;
  name: string;
  version: string | null;
  author: string | null;
  description: string | null;
  widgetSize: {
    minW: number;
    minH: number;
    maxW: number;
    maxH: number;
  };
  properties: WidgetProperty[] | null;
  tags: string | null;
  dependencies: {
    gid: string | null;
    cid: string;
    version: string | null;
  }[];
  mockdata: MockData[] | null;
  dynamicHeight: boolean;
  gid: string;
};

type InputBlock = {
  cid: string;
  gid: string;
  name: string;
  version: string | null;
  author: string | null;
  tags: string | null;
  description: string | null;
  group: string | null;
  groupNumber: string | null;
  width: string;
  fullScreen: boolean;
};

type Plugin = {
  gid: string;
  version: string;
  name: string;
  author: string | null;
  description: string | null;
  url: string | null;
  meta: string;
  is_stock: boolean;
  zip_hash: string;
  algorithms: Algorithm[];
  widgets: Widget[];
  input_blocks: InputBlock[];
  templates: unknown[];
  created_at: string;
  updated_at: string;
};

type MdxBundle = {
  code: string;
  frontmatter: Record<string, unknown> | undefined;
};

export type {
  Project,
  TestResult,
  Dataset,
  Plugin,
  MdxBundle,
  Widget,
  Algorithm,
  WidgetProperty,
  TestResultData,
  InputBlockData,
  InputBlock,
  FormState,
  DataColumn,
};
