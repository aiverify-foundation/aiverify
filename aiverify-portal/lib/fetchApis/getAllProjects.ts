import { Project } from '@/app/types';
import { ErrorWithMessage } from '@/lib/utils/error-utils';
import { ApiResult, processResponse } from '@/lib/utils/http-requests';

export async function fetchEndpoints(): Promise<
  ApiResult<Project[]> | ErrorWithMessage
> {
  const response = await fetch(`http://localhost:3000/api/mock/projects`);
  const result = await processResponse<Project[]>(response);
  return result;
}
