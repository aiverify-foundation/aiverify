import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TestModel } from '@/app/models/utils/types';
import { toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse } from '@/lib/utils/http-requests';

// Delete Model Hook
const deleteModel = async (id: string): Promise<string> => {
  const response = await fetch(`/api/test_models/${id}`, { method: 'DELETE' });
  const result = await processResponse<{ detail: string }>(response);

  if (result instanceof Error) {
    throw toErrorWithMessage(result);
  }

  return 'Model deleted successfully!';
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
