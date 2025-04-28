import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm } from '@/app/types';

/**
 * Retrieves algorithms from plugins based on widget dependencies
 * @param pluginsWithMdx Array of plugins with MDX content
 * @param widget WidgetOnGridLayout object containing widget information
 * @returns Array of algorithms found in the widget's dependencies
 */

export function getWidgetAlgosFromPlugins(
  pluginsWithMdx: PluginForGridLayout[],
  widget: WidgetOnGridLayout
) {
  const algos: Algorithm[] = [];

  // Handle template widget structure
  if ('widgetGID' in widget) {
    interface TemplateWidget extends WidgetOnGridLayout {
      widgetGID: string;
    }
    const templateWidget = widget as TemplateWidget;
    const [gid] = templateWidget.widgetGID.split(':');

    const plugin = pluginsWithMdx.find((p) => p.gid === gid);
    if (!plugin) {
      //console.log('No plugin found for gid:', gid);
      return algos;
    }

    // For template widgets, we'll get all algorithms from the plugin
    if (plugin.algorithms) {
      algos.push(...plugin.algorithms);
    }

    return algos;
  }

  // Handle regular widget structure
  if (!widget.dependencies || !Array.isArray(widget.dependencies)) {
    //console.log('No valid dependencies found, returning empty array');
    return algos;
  }

  // go through all the widget dependencies and get the algos from the list of plugins
  for (const dependency of widget.dependencies) {
    //console.log('Processing dependency:', dependency);
    const plugin = pluginsWithMdx.find((p) => p.gid === dependency.gid);
    if (!plugin) {
      //console.log('No plugin found for gid:', dependency.gid);
      continue;
    }

    const algo = plugin.algorithms?.find((a) => a.cid === dependency.cid);
    if (algo) {
      // console.log('Found algorithm:', algo);
      algos.push(algo);
    } else {
      // console.log('No algorithm found for cid:', dependency.cid);
    }
  }

  // If no algorithms were found using dependency.gid, try using widget.gid
  if (algos.length === 0) {
    //console.log('No algorithms found using widget.gid, trying dependency.gid');

    for (const dependency of widget.dependencies) {
      //console.log('Processing dependency with widget.gid:', widget.gid);
      const plugin = pluginsWithMdx.find((p) => p.gid === widget.gid);
      if (!plugin) {
        //console.log('No plugin found for widget gid:', widget.gid);
        continue;
      }

      const algo = plugin.algorithms?.find((a) => a.cid === dependency.cid);
      if (algo) {
        //console.log('Found algorithm using dependency.gid:', algo);
        algos.push(algo);
      } else {
        // console.log('No algorithm found for cid with dependency.gid:',dependency.cid);
      }
    }
  }

  return algos;
}
