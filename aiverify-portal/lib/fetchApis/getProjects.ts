import { ErrorWithMessage } from '@/app/errorTypes';
import { ProjectInfo } from '@/app/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

const endpointUrl = `${process.env.APIGW_HOST}/projects`;

type Options = {
  id?: number;
};

export async function fetchProjects(
  opts?: Options
): Promise<ApiResult<ProjectInfo | ProjectInfo[]> | ErrorWithMessage> {
  let requestUrl = endpointUrl;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl}/${opts.id}`;
  }
  const response = await fetch(requestUrl, { cache: 'force-cache' });
  const result = await processResponse<ProjectInfo[]>(response);

  return result;
}
