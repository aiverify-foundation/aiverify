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
  result?: unknown; // TODO: review
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
// type ParsedTestResults = {
//   id: number;
//   gid: string;
//   cid: string;
//   startTime: string;
//   timeTaken: number;
//   artifacts?: string[];
//   output: Record<
//     string,
//     | string
//     | number
//     | boolean
//     | object
//     | string[]
//     | number[]
//     | boolean[]
//     | object[]
//   >;
// };

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

export type { MdxBundle };
