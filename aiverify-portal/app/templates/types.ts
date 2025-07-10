type GlobalVar = {
  key: string;
  value: string;
};

type Layout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  maxW: number;
  maxH: number;
  minW: number;
  minH: number;
  static: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  resizeHandles: string[] | null;
  isBounded: boolean;
};

type LayoutItemProperties = {
  justifyContent: string;
  alignItems: string;
  textAlign: string;
  color: string | null;
  bgcolor: string | null;
};

type WidgetProperties = {
  [key: string]: string | null | undefined;
};

type ReportWidget = {
  widgetGID: string;
  key: string;
  layoutItemProperties: LayoutItemProperties;
  properties: WidgetProperties | null;
};

type Page = {
  layouts: Layout[];
  reportWidgets: ReportWidget[];
};

type ProjectInfo = {
  name: string;
  description: string;
};

type ReportTemplate = {
  globalVars: GlobalVar[];
  pages: Page[];
  projectInfo: ProjectInfo;
  id: number;
  fromPlugin: boolean;
  created_at: string;
  updated_at: string;
};

// Template data structure before database insertion (what comes from uploaded files)
type ProcessedTemplateData = {
  globalVars: GlobalVar[];
  pages: Page[];
  projectInfo: ProjectInfo;
};

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

type FileUpload = {
  file: File;
  progress: number;
  status: UploadStatus;
  id: string;
  originalFile?: File;
  processedData?: ProcessedTemplateData;
};

export type {
  Layout,
  LayoutItemProperties,
  WidgetProperties,
  ReportWidget,
  Page,
  ProjectInfo,
  ReportTemplate,
  ProcessedTemplateData,
  GlobalVar,
  UploadStatus,
  FileUpload,
};
