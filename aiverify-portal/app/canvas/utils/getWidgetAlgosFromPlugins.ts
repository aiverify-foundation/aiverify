import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm } from '@/app/types';

export function getWidgetAlgosFromPlugins(
  pluginsWithMdx: PluginForGridLayout[],
  widget: WidgetOnGridLayout
) {
  const algos: Algorithm[] = [];

  // go through all the widget dependencies and get the algos from the list of plugins
  for (const dependency of widget.dependencies) {
    const plugin = pluginsWithMdx.find((p) => p.gid === widget.gid);
    if (!plugin) continue;

    const algo = plugin.algorithms?.find((a) => a.cid === dependency.cid);
    if (algo) {
      algos.push(algo);
    }
  }

  return algos;
}
