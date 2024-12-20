import { ErrorWithMessage, PythonFastApiErrorDetail } from '@/app/errorTypes';

export function parseFastAPIError(
  response: PythonFastApiErrorDetail
): ErrorWithMessage {
  return new Error(response.detail);
}
