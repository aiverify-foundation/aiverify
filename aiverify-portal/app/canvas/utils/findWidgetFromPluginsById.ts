import { Plugin, Widget } from '@/app/types';

function findWidgetFromPluginsById(
  plugins: Plugin[],
  pluginId: string,
  widgetId: string
): Widget | undefined {
  return plugins
    .find((plugin) => plugin.gid === pluginId)
    ?.widgets.find((widget) => widget.cid === widgetId);
}

export { findWidgetFromPluginsById };
