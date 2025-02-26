import { ErrorWithMessage } from '@/app/errorTypes';
import { ProjectInfo } from '@/app/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

const endpointUrl = `${process.env.APIGW_HOST}/projects`;

type Options = {
  ids?: string[];
};

/**
 * Fetches projects by their IDs.
 * @param opts - Options object containing an array of project IDs. If no IDs are provided, all projects will be fetched.
 * @returns A promise resolving to an ApiResult containing an array of ProjectInfo objects, or an ErrorWithMessage if an error occurs.
 */
export async function fetchProjects(
  opts?: Options
): Promise<ApiResult<ProjectInfo[]> | ErrorWithMessage> {
  if (opts?.ids?.length) {
    const fetchPromises = opts.ids.map((id) =>
      fetch(`${endpointUrl}/${id}`, { cache: 'force-cache' }).then((response) =>
        processResponse<ProjectInfo>(response)
      )
    );

    const results = await Promise.all(fetchPromises);
    const errors = results.filter((result) => 'message' in result);

    if (errors.length) {
      return errors[0]; // Return first error if any requests failed
    }

    return {
      status: 'success',
      code: 200,
      data: results.map((result) => {
        if ('message' in result) {
          throw new Error(result.message);
        }
        return result.data;
      }),
    };
  }

  const response = await fetch(endpointUrl, { cache: 'force-cache' });
  return processResponse<ProjectInfo[]>(response);
}
