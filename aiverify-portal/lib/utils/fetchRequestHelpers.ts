import { isPythonFastApiError } from '@/app/errorTypes';
import { toErrorWithMessage } from '@/app/errorTypes';
import { parseFastAPIError } from './parseFastAPIError';

type ApiSuccess<T> = {
  status: 'success';
  code: number;
  data: T;
};

type ApiError = {
  status: 'error';
  code: number;
  message: string;
};

type ApiResult<T> = ApiSuccess<T> | ApiError;

async function processResponse<T>(response: Response): Promise<ApiResult<T>> {
  let result;
  let payload: T;
  try {
    payload = await response.json();
  } catch (err) {
    result = toErrorWithMessage(err);
    return {
      status: 'error',
      code: response.status,
      message: result.message,
    };
  }

  if (response.ok) {
    return {
      status: 'success',
      code: response.status,
      data: payload,
    };
  } else {
    if (isPythonFastApiError(payload)) {
      return {
        status: 'error',
        code: response.status,
        message: parseFastAPIError(payload.data).message,
      };
    }
    return {
      status: 'error',
      code: response.status,
      message: toErrorWithMessage(payload).message,
    };
  }
}

export { processResponse };
export type { ApiResult };
