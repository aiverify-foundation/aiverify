import { z } from 'zod';
import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';
import { ErrorWithMessage } from '@/app/errorTypes';
import { Plugin } from '@/app/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';
import { getWidgetMdxBundle } from './getWidgetMdxBundle';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  model: z.string(),
  status: z.string(),
});

export type ProjectSchemaType = z.infer<typeof ProjectSchema>;

const endpointUrl = `${process.env.APIGW_HOST}/plugins`;

type Options = {
  groupByPluginId?: boolean;
  populateMdx?: boolean;
};

export async function populatePluginsMdxBundles(
  plugins: Plugin[]
): Promise<PluginForGridLayout[]> {
  // Create new array to avoid mutations
  const pluginsWithMdx = plugins.map((plugin) => ({ ...plugin }));

  await Promise.allSettled(
    pluginsWithMdx.map(async (plugin, pluginIndex) => {
      const mdxResults = await Promise.allSettled(
        plugin.widgets.map((widget) =>
          getWidgetMdxBundle(plugin.gid, widget.cid)
        )
      );

      // Create new widgets array
      pluginsWithMdx[pluginIndex].widgets = plugin.widgets.map(
        (widget, widgetIndex) => {
          const result = mdxResults[widgetIndex];

          if (
            result.status === 'fulfilled' &&
            result.value.status === 'success'
          ) {
            return {
              ...widget,
              mdx: result.value.data,
            } as WidgetOnGridLayout;
          }

          // Handle rejected promises or unsuccessful responses
          console.error(
            `Failed to load MDX for widget ${widget.cid} in plugin ${plugin.gid}:`,
            result.status === 'rejected' ? result.reason : result.value
          );
          return widget;
        }
      );
    })
  );

  return pluginsWithMdx as PluginForGridLayout[];
}

export async function getPlugins(
  options: Options = { groupByPluginId: false }
): Promise<ApiResult<Record<string, Plugin> | Plugin[]> | ErrorWithMessage> {
  const response = await fetch(endpointUrl);
  const result = await processResponse<Plugin[]>(response);
  if ('message' in result) {
    return result;
  }
  if (!options.groupByPluginId) {
    return result;
  }
  return options.groupByPluginId
    ? {
        status: 'success',
        code: response.status,
        data: grouptWidgetsByPluginId(result.data),
      }
    : result;
}

export function grouptWidgetsByPluginId(
  plugins: Plugin[]
): Record<string, Plugin> {
  return plugins.reduce((acc: Record<string, Plugin>, plugin) => {
    acc[plugin.gid] = plugin;
    return acc;
  }, {});
}
