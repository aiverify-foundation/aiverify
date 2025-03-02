import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TestModel } from '@/app/models/utils/types';
import { toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse, ApiResult } from '@/lib/utils/fetchRequestHelpers';

// Delete Model Hook
const deleteModel = async (
  id: string
): Promise<{ message: string; success: boolean }> => {
  const response = await fetch(`/api/test_models/${id}`, { method: 'DELETE' });
  const result = await processResponse<{ detail: string }>(response);

  if (result.status === 'success') {
    return { message: 'Model deleted successfully!', success: true };
  } else {
    // Extract the actual message from the error
    let errorMessage = result.message;

    // Check if the message is a JSON string containing a detail field
    try {
      if (errorMessage.startsWith('{') && errorMessage.includes('"detail"')) {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.detail) {
          errorMessage = parsedError.detail;
        }
      }
    } catch (e) {
      // If parsing fails, keep the original message
      console.error('Error parsing error message:', e);
    }

    return { message: errorMessage, success: false };
  }
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModel,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['models'] });
      const previousModels = queryClient.getQueryData<TestModel[]>(['models']);

      if (previousModels) {
        queryClient.setQueryData(
          ['models'],
          previousModels.filter((model) => String(model.id) !== id)
        );
      }

      return { previousModels };
    },
    onError: (error, id, context) => {
      if (context?.previousModels) {
        queryClient.setQueryData(['models'], context.previousModels);
      }
      console.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};
