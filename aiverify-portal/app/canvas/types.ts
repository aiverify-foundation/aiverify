import { MdxBundle, Widget, Plugin } from '@/app/types';

type WidgetOnGridLayout = Widget & {
  mdx: MdxBundle;
  gridItemId: string;
};

type PluginForGridLayout = Omit<Plugin, 'widgets'> & {
  widgets: WidgetOnGridLayout[];
};

export type { WidgetOnGridLayout, PluginForGridLayout };
