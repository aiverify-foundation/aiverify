import { Dataset } from '@/app/types';
import { ErrorWithMessage } from '@/lib/utils/error-utils';
import { ApiResult, processResponse } from '@/lib/utils/http-requests';

const endpoint = `${process.env.APIGW_HOST}/test_datasets`;

export async function getTestDatasets(): Promise<
  ApiResult<Dataset[]> | ErrorWithMessage
> {
  const response = await fetch(endpoint);
  const result = await processResponse<Dataset[]>(response);
  if ('message' in result) {
    return result;
  }

  return result;
}
