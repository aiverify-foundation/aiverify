import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plugin } from '@/app/plugins/utils/types';

const deletePlugin = async (id: string): Promise<string> => {
    const response = await fetch(`/api/plugins/${id}`, {
      method: 'DELETE',
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete the plugin.');
    }
  
    return 'Plugin deleted successfully!';
  };
  


export const useDeletePlugin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlugin,
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['plugins'] });

      // Snapshot the previous value
      const previousPlugins = queryClient.getQueryData<Plugin[]>(['plugins']);

      // Optimistically update the cache
      queryClient.setQueryData(
        ['plugins'],
        previousPlugins?.filter((plugin) => plugin.gid !== id)
      );

      return { previousPlugins };
    },
    onError: (error, id, context) => {
      // Rollback to the previous value if the mutation fails
      if (context?.previousPlugins) {
        queryClient.setQueryData(['plugins'], context.previousPlugins);
      }
    },
    onSettled: () => {
      // Always refetch after the mutation is done
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
};
