import { z } from 'zod';
import { ErrorWithMessage } from '@/app/errorTypes';
import { Plugin, PluginWithMdxBundle, Widget } from '@/app/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

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
};

export async function getPlugins(
  options: Options = { groupByPluginId: false }
): Promise<ApiResult<Record<string, Plugin> | Plugin[]> | ErrorWithMessage> {
  const response = await fetch(endpointUrl, { cache: 'force-cache' });
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
