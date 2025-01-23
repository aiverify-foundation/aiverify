import { ErrorWithMessage, toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse, ApiResult } from '@/lib/utils/http-requests';

// Define the expected API response type
export interface ModelAPIData {
  data: Record<string, unknown>;
  message: string;
}

const fetchModelAPIData = async (
  id: string
): Promise<ApiResult<ModelAPIData> | ErrorWithMessage> => {
  try {
    const response = await fetch(`/api/test_models/exportModelAPI/${id}`);
    return await processResponse<ModelAPIData>(response);
  } catch (error) {
    console.error('Error fetching model api data:', error);
    throw toErrorWithMessage(error);
  }
};

export const useModelAPIData = () => {
  const fetchData = async (id: string) => {
    const result = await fetchModelAPIData(id);
    if ('status' in result) {
      return result;
    }
    throw result;
  };

  return fetchData;
};
