import { ErrorWithMessage } from '@/app/errorTypes';
import { Project } from '@/app/types';
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
export async function getProjects(
  opts?: Options
): Promise<ApiResult<Project[]> | ErrorWithMessage> {
  // If specific project IDs are provided, fetch each project individually
  if (opts?.ids?.length) {
    const fetchPromises = opts.ids.map((id) =>
      fetch(`${endpointUrl}/${id}`).then((response) =>
        processResponse<Project>(response)
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

  // If no options or IDs are provided, fetch all projects from the base endpoint
  const response = await fetch(endpointUrl);
  return processResponse<Project[]>(response);
}
