type InputSchema = {
  title: string;
  description: string | null;
  type: string;
  required: string[];
  properties: {
    [key: string]: {
      title: string;
      description: string;
      type: string;
      'ui:widget'?: string;
      default?: number | string;
    };
  };
};

type OutputSchema = {
  title: string;
  description: string | null;
  type: string;
  required: string[];
  minProperties: number;
  properties: {
    [key: string]: {
      description: string;
      type: string;
      minItems?: number;
      items?: {
        type: string;
        required?: string[];
        properties?: {
          [key: string]: {
            description: string;
            type: string;
            items?: {
              type: string;
              minProperties?: number;
              patternProperties?: {
                [key: string]: {
                  type: string;
                  [key: string]: string;
                };
              };
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
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
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
        default: string | null;
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
        datapath: string;
      }[]
    | null;
  dynamicHeight: boolean;
  gid: string;
};

type inputBlock = {
  cid: string;
  name: string;
  version: string | null;
  author: string | null;
  tags: string | null;
  description: string;
  group: string | null;
  groupNumber: number | null;
  width: string;
  fullScreen: boolean;
  gid: string;
};

type Template = {
  cid: string;
  name: string;
  description: string;
  author: string | null;
  version: string | null;
  tags: string | null;
  gid: string;
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
  input_blocks: inputBlock[];
  templates: Template[];
  created_at: string;
  updated_at: string;
};

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

type FileUpload = {
  file: File;
  progress: number;
  status: UploadStatus;
  id: string;
};

export type {
  Plugin,
  Algorithm,
  Widget,
  inputBlock,
  Template,
  UploadStatus,
  FileUpload,
};
