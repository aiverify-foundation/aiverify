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
  const response = await fetch(requestUrl);
  const result = await processResponse<ReportTemplate | ReportTemplate[]>(response);

  if (!('data' in result)) {
    return result;
  }

  // If we have data and an ID was provided, wrap the single template in an array
  if (opts?.id != undefined) {
    return {
      ...result,
      data: [result.data as ReportTemplate]
    };
  }

  // If no ID was provided, ensure we have an array
  return {
    ...result,
    data: Array.isArray(result.data) ? result.data : [result.data as ReportTemplate]
  };
}
