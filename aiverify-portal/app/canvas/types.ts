import {
  MdxBundle,
  Widget,
  Plugin,
  TestResults,
  InputBlockData,
  TestResultData,
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

type ParsedTestResults = TestResults & {
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
type InputBlockDataMapping = Record<string, InputBlockData>;

export type {
  WidgetOnGridLayout,
  PluginForGridLayout,
  ParsedTestResults,
  TestResultDataMapping,
  InputBlockDataMapping,
};
