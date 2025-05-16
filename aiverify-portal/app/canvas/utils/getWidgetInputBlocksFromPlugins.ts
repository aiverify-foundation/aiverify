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

  // Handle template widget structure
  if ('widgetGID' in widget) {
    interface TemplateWidget extends WidgetOnGridLayout {
      widgetGID: string;
    }
    const templateWidget = widget as TemplateWidget;
    const [gid] = templateWidget.widgetGID.split(':');

    const plugin = pluginsWithMdx.find((p) => p.gid === gid);
    if (!plugin) {
      console.log('No plugin found for gid:', gid);
      return inputBlocks;
    }

    // For template widgets, we'll get all input blocks from the plugin
    if (plugin.input_blocks) {
      inputBlocks.push(...plugin.input_blocks);
    }

    return inputBlocks;
  }

  // Handle regular widget structure
  if (!widget.dependencies || !Array.isArray(widget.dependencies)) {
    console.log('No valid dependencies found, returning empty array');
    return inputBlocks;
  }

  // go through all the widget dependencies and get the input blocks from the list of plugins
  for (const dependency of widget.dependencies) {
    // console.log('Processing dependency for input blocks:', dependency);
    const plugin = pluginsWithMdx.find((p) => p.gid === dependency.gid);
    if (!plugin) {
      // console.log('No plugin found for gid:', dependency.gid);
      continue;
    }

    const inputBlock = plugin.input_blocks?.find(
      (ib) => ib.cid === dependency.cid
    );
    if (inputBlock) {
      // console.log('Found input block:', inputBlock);
      inputBlocks.push(inputBlock);
    } else {
      // console.log('No input block found for cid:', dependency.cid);
    }
  }

  // If no algorithms were found using widget.gid, try using dependency.gid
  if (inputBlocks.length === 0) {
    // console.log(
    //   'No input blocks found using widget.gid, trying dependency.gid'
    // );

    for (const dependency of widget.dependencies) {
      // console.log('Processing dependency with widget.gid:', widget.gid);
      const plugin = pluginsWithMdx.find((p) => p.gid === widget.gid);
      if (!plugin) {
        console.log('No plugin found for widget gid:', widget.gid);
        continue;
      }

      const inputBlock = plugin.input_blocks?.find(
        (ib) => ib.cid === dependency.cid
      );
      if (inputBlock) {
        // console.log('Found input block using dependency.gid:', inputBlock);
        inputBlocks.push(inputBlock);
      } else {
        // console.log(
        //   'No input block found for cid with widget.gid:',
        //   widget.gid
        // );
      }
    }
  }

  return inputBlocks;
}
