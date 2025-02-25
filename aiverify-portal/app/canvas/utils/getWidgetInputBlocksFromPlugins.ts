import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { InputBlock } from '@/app/types';

/**
 * Retrieves input blocks from plugins based on widget dependencies
 * @param pluginsWithMdx Array of plugins with MDX content
 * @param widget WidgetOnGridLayout object containing widget information
 * @returns Array of input blocks found in the widget's dependencies
 */

export function getWidgetInputBlocksFromPlugins(
  pluginsWithMdx: PluginForGridLayout[],
  widget: WidgetOnGridLayout
) {
  const inputBlocks: InputBlock[] = [];

  // go through all the widget dependencies and get the input blocks from the list of plugins
  for (const dependency of widget.dependencies) {
    const plugin = pluginsWithMdx.find((p) => p.gid === widget.gid);
    if (!plugin) continue;

    const inputBlock = plugin.input_blocks?.find(
      (ib) => ib.cid === dependency.cid
    );
    if (inputBlock) {
      inputBlocks.push(inputBlock);
    }
  }

  return inputBlocks;
}
