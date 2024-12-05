type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  model: string;
  status: string;
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
  zip_hash: string;
}

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
  properties: {
    key: string;
    helper: string;
    default: string | null;
  }[] | null;
  tags: string | null;
  dependencies: {
    gid: string | null;
    cid: string;
    version: string | null;
  }[];
  mockdata: {
    type: string;
    gid: string | null;
    cid: string;
    datapath: string;
  }[] | null;
  dynamicHeight: boolean;
  gid: string;
}

type inputBlock = {
  cid: string;
  name: string;
  version: string | null;
  author: string | null;
  tags: string | null;
  description: string;
  group: string | null;
  width: string;
  fullScreen: boolean;
  gid: string;
}

type Template = {
  cid: string;
  name: string;
  description: string;
  author: string | null;
  version: string | null;
  tags: string | null;
  gid: string;
}

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
}


export type { Project, Widget, Plugin };