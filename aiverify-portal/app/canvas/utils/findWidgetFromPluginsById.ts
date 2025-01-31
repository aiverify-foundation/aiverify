import { WidgetOnGridLayout, PluginForGridLayout } from '@/app/canvas/types';

function findWidgetFromPluginsById(
  plugins: PluginForGridLayout[],
  pluginId: string,
  widgetId: string
): WidgetOnGridLayout | undefined {
  return plugins
    .find((plugin) => plugin.gid === pluginId)
    ?.widgets.find((widget) => widget.cid === widgetId);
}

export { findWidgetFromPluginsById };
