import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InputBlockData, InputBlockDataPayload } from '@/app/types';

interface UpdateInputBlockDataParams {
  id: string;
  data: Partial<Omit<InputBlockData, 'data'>> & { data: InputBlockDataPayload };
}

/**
 * Updates an existing input block data entry
 * @param id The ID of the input block data to update
 * @param data The data to update
 * @returns The updated input block data
 */
const updateInputBlockData = async ({
  id,
  data,
}: UpdateInputBlockDataParams): Promise<InputBlockData> => {
  const response = await fetch(`/api/input_block_data/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail
        ? typeof errorData.detail === 'string'
          ? errorData.detail
          : 'Validation error occurred'
        : 'Failed to update input block data'
    );
  }

  return response.json();
};

export function useUpdateInputBlockData() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateInputBlockData,
    onSuccess: (data) => {
      // Invalidate and refetch the input block data query
      queryClient.invalidateQueries({
        queryKey: ['input-block-data', data.id],
      });
      // Also invalidate the list of input blocks for this type
      queryClient.invalidateQueries({
        queryKey: ['input-block-data', data.gid, data.cid],
      });
    },
  });

  return {
    updateInputBlockData: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
