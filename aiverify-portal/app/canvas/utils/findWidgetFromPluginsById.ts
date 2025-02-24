import { WidgetOnGridLayout, PluginForGridLayout } from '@/app/canvas/types';

/**
 * Finds a widget from a list of plugins by matching gid and cid
 * @param plugins Array of plugins to search through
 * @param pluginId Global identifier for the plugin
 * @param widgetId Component identifier for the specific widget
 * @returns The matching widget object if found, undefined otherwise
 */
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
