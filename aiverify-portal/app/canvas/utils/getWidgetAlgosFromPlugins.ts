import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm } from '@/app/types';

export function getWidgetAlgosFromPlugins(
  pluginsWithMdx: PluginForGridLayout[],
  widget: WidgetOnGridLayout
) {
  const algos: Algorithm[] = [];

  for (const dependency of widget.dependencies) {
    const plugin = pluginsWithMdx.find((p) => p.gid === widget.gid);
    if (!plugin) continue;

    const algo = plugin.algorithms?.find(
      (a) => a.cid === `aiverify_${dependency.cid}` //TODO : clarify the prefix aiverify_
    );
    if (algo) {
      algos.push(algo);
    }
  }

  return algos;
}
