import { useMutation } from '@tanstack/react-query';
import { isApiError, toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse } from '@/lib/utils/http-requests';
import { parseFastAPIError } from '@/lib/utils/parseFastAPIError';

export const useDeleteFairnessTree = (
  onSuccess: (data: unknown) => void,
  onError: (error: Error) => void
) => {
  return useMutation({
    mutationFn: async (treeId: number) => {
      const response = await fetch(`/api/input_block_data/${treeId}`, {
        method: 'DELETE',
      });

      const result = await processResponse(response);

      if (isApiError(result)) {
        throw parseFastAPIError(result.data);
      }

      if ('message' in result) {
        throw toErrorWithMessage(result);
      }

      return result;
    },
    onSuccess,
    onError,
  });
};
