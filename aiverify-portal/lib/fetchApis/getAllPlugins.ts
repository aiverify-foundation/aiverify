import { z } from 'zod';
import { Plugin, Widget } from '@/app/types';
import { ErrorWithMessage } from '@/lib/utils/error-utils';
import { ApiResult, processResponse } from '@/lib/utils/http-requests';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  model: z.string(),
  status: z.string(),
});

export type ProjectSchemaType = z.infer<typeof ProjectSchema>;

const endpoint = `${process.env.APIGW_HOST}/plugins`;

export async function fetchPlugins(): Promise<
  Record<string, Widget[]> | ErrorWithMessage
> {
  const response = await fetch(endpoint);
  const result = await processResponse<Plugin[]>(response);
  if ('message' in result) {
    return result;
  }
  const widgets = getWidgetsByPluginId(result.data);
  return widgets;
}

export function getWidgetsByPluginId(
  plugins: Plugin[]
): Record<string, Widget[]> {
  return plugins.reduce((acc: Record<string, Widget[]>, plugin) => {
    acc[plugin.gid] = plugin.widgets;
    return acc;
  }, {});
}
