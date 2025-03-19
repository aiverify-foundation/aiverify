import { MdxBundle } from '@/app/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

const endpointUrl = `${process.env.APIGW_HOST}/plugins`;

export async function getWidgetMdxBundle(
  pluginId: string,
  widgetId: string
): Promise<ApiResult<MdxBundle>> {
  const response = await fetch(`${endpointUrl}/${pluginId}/bundle/${widgetId}`);
  const result = await processResponse<MdxBundle>(response);
  if ('message' in result) {
    return result;
  }
  return result;
}
