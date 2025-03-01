import {
  MdxBundle,
  Widget,
  Plugin,
  TestResult,
  TestResultData,
  InputBlockDataPayload,
} from '@/app/types';

type WidgetOnGridLayout = Widget & {
  mdx: MdxBundle;
  gridItemId: string;
  testResultCompositeId: {
    // TODO: review - probably redundant
    pluginGid: string;
    algoCid: string;
    timeCreated: string;
  } | null;
};

type PluginForGridLayout = Omit<Plugin, 'widgets'> & {
  widgets: WidgetOnGridLayout[];
};

type ParsedTestResults = TestResult & {
  output: Record<
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

type TestResultDataMapping = Record<string, TestResultData>;
type ArtifactsMapping = Record<string, string[]>;
type InputBlockDataMapping = Record<string, InputBlockDataPayload>;

export type {
  WidgetOnGridLayout,
  PluginForGridLayout,
  ParsedTestResults,
  TestResultDataMapping,
  InputBlockDataMapping,
  ArtifactsMapping,
};
