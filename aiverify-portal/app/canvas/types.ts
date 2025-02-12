import { MdxBundle, Widget, Plugin, TestResults } from '@/app/types';

type WidgetOnGridLayout = Widget & {
  mdx: MdxBundle;
  gridItemId: string;
  result?: Record<string, unknown>;
};

type PluginForGridLayout = Omit<Plugin, 'widgets'> & {
  widgets: WidgetOnGridLayout[];
};

type ParsedTestResults = TestResults & {
  output: {
    [key: string]: string | number | boolean | object;
  };
};

export type { WidgetOnGridLayout, PluginForGridLayout, ParsedTestResults };
