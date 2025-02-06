import { MdxBundle, Widget, Plugin } from '@/app/types';

type WidgetOnGridLayout = Widget & {
  mdx: MdxBundle;
  gridItemId: string;
  result?: Record<string, unknown>;
};

type PluginForGridLayout = Omit<Plugin, 'widgets'> & {
  widgets: WidgetOnGridLayout[];
};

export type { WidgetOnGridLayout, PluginForGridLayout };
