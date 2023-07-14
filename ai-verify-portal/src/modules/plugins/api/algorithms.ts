import { ErrorWithMessage, toErrorWithMessage } from 'src/lib/errorUtils';

export type DependencyRequirement = {
  requirement: string;
};

export type DependencyStatusResult = {
  requirement: string;
  result: boolean;
  comment: string;
};

type ApiResult<T> = {
  status: number;
  data: T;
};

const apiPath = '/api/requirements/client';

async function handleResponseBody<T>(
  response: Response
): Promise<ApiResult<T> | ErrorWithMessage> {
  if (response.ok) {
    try {
      const data = await response.json();
      return { status: response.status, data };
    } catch (err) {
      return toErrorWithMessage(err);
    }
  } else {
    return toErrorWithMessage({
      status: response.status,
      data: response.statusText,
    });
  }
}

function createUrlParamsString(requirements: DependencyRequirement[]): string {
  const query = new URLSearchParams({});
  requirements.forEach((req) => query.append('requirement', req.requirement));
  return query.toString();
}

async function getPythonPackageDependencyStatus(
  requirements: DependencyRequirement[]
): Promise<ApiResult<DependencyStatusResult[]> | ErrorWithMessage> {
  const query = createUrlParamsString(requirements);
  try {
    const response = await fetch(`${apiPath}?${query}`);
    const result = await handleResponseBody<DependencyStatusResult[]>(response);
    return result;
  } catch (err) {
    return toErrorWithMessage(err);
  }
}

export { getPythonPackageDependencyStatus };
