import { ErrorWithMessage } from '@/app/errorTypes';
import { ReportTemplate } from '@/app/templates/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

const endpointUrl = `${process.env.APIGW_HOST}/project_templates`;

type Options = {
  id?: number;
};

export async function fetchTemplates(
  opts?: Options
): Promise<ApiResult<ReportTemplate[]> | ErrorWithMessage> {
  let requestUrl = endpointUrl;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl}/${opts.id}`;
  }
  const response = await fetch(requestUrl, { cache: 'force-cache' });
  const result = await processResponse<ReportTemplate[]>(response);

  return result;
}
