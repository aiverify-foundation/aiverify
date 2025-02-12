import { MdxBundle, Widget, Plugin, TestResults } from '@/app/types';

type WidgetOnGridLayout = Widget & {
  mdx: MdxBundle;
  gridItemId: string;
};

type PluginForGridLayout = Omit<Plugin, 'widgets'> & {
  widgets: WidgetOnGridLayout[];
};

type ParsedTestResults = TestResults & {
  output: Record<string, string | number | boolean | object | string[] | number[] | boolean[] | object[]>;
};

export type { WidgetOnGridLayout, PluginForGridLayout, ParsedTestResults };
