import { useMutation } from '@tanstack/react-query';
import { InputBlockData } from '@/app/types';

interface InputBlockSubmission {
  gid: string;
  cid: string;
  name: string;
  group: string;
  data: Record<string, unknown>;
}

const submitInputBlockData = async (
  data: InputBlockSubmission
): Promise<InputBlockData> => {
  const response = await fetch('/api/input_block_data/', {
    method: 'POST',
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
        : 'Failed to submit input block data'
    );
  }

  return response.json();
};

export function useSubmitInputBlockData() {
  const mutation = useMutation({
    mutationFn: submitInputBlockData,
  });

  return {
    submitInputBlockData: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
