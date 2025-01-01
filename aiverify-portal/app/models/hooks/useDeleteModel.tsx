import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TestModel } from '@/app/models/utils/types';

const deleteModel = async (id: string): Promise<string> => {
  const response = await fetch(`/api/test_models/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete the model.');
  }

  return 'Model deleted successfully!';
};


export const useDeleteModel = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string, { previousModels?: TestModel[] }>({
    mutationFn: deleteModel,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['models'] });

      // Snapshot the previous value
      const previousModels = queryClient.getQueryData<TestModel[]>(['models']);

      // Optimistically update the cache
      if (previousModels) {
        queryClient.setQueryData(
          ['models'],
          previousModels.filter((model) => String(model.id) !== id)
        );
      }

      return { previousModels };
    },
    onError: (error, id, context) => {
      // Rollback to the previous value if the mutation fails
      if (context?.previousModels) {
        queryClient.setQueryData(['models'], context.previousModels);
      }
    },
    onSettled: () => {
      // Always refetch after the mutation is done
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};
