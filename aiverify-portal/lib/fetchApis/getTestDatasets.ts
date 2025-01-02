import { z } from 'zod';
import { Dataset } from '@/app/types';
import { ErrorWithMessage } from '@/lib/utils/error-utils';
import { ApiResult, processResponse } from '@/lib/utils/http-requests';


export async function getTestDatasets(): Promise<
  ApiResult<Dataset[]> | ErrorWithMessage
> {
  const response = await fetch('/api/test_datasets');
  const result = await processResponse<Dataset[]>(response);
  if ('message' in result) {
    return result;
  }

  return result;
}
