import { ErrorWithMessage, toErrorWithMessage } from 'src/lib/errorUtils';

export type TestLogsResult = {
  algoGID: string;
  logs: string;
};

type ApiResult<T> = {
  status: number;
  data: T;
};

const apiPath = '/api/logs';

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

async function getTestLogs(
  projectId: string
): Promise<ApiResult<TestLogsResult[]> | ErrorWithMessage> {
  try {
    const response = await fetch(`${apiPath}/${projectId}`);
    const result = await handleResponseBody<TestLogsResult[]>(response);
    return result;
  } catch (err) {
    return toErrorWithMessage(err);
  }
}

export { getTestLogs };
