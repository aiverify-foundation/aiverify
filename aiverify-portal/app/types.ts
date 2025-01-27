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
  artifacts: unknown[];
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

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
  properties:
    | {
        key: string;
        helper: string;
        default: string;
      }[]
    | null;
  tags: string | null;
  dependencies: {
    gid: string | null;
    cid: string;
    version: string | null;
  }[];
  mockdata:
    | {
        type: string;
        gid: string | null;
        cid: string;
      }[]
    | null;
  dynamicHeight: boolean;
  gid: string;
  mdx?: MdxBundle;
};

type WidgetToRender = Pick<Widget, 'gid' | 'cid' | 'properties' | 'mdx'>;

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
  input_blocks: unknown[];
  templates: unknown[];
  created_at: string;
  updated_at: string;
};

type MdxBundle = {
  code: string;
  frontmatter: unknown;
};

export type { Project, TestResults, Plugin, MdxBundle, Widget, WidgetToRender };
