// hooks/useUpdateChecklist.ts
import { useMutation } from '@tanstack/react-query';
import { Checklist } from '@/app/inputs/utils/types';

const updateChecklist = async (
  variables: {
    id: string;
    data: { data: Record<string, string>; name: string; group: string };
  },
  context?: unknown // Add the second argument for context
) => {
  const { id, data } = variables;

  const response = await fetch(`/api/input_block_data/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update checklist');
  }

  return response.json();
};

// Define the custom hook
const useUpdateChecklist = () => {
  return useMutation<
    any,
    Error,
    {
      id: string;
      data: { data: Record<string, string>; name: string; group: string };
    },
    unknown
  >({
    mutationFn: updateChecklist, // Mutation function accepts 'variables' and 'context'
    onSuccess: (data) => {
      console.log('Checklist updated successfully:', data);
    },
    onError: (error) => {
      console.error('Error updating checklist:', error);
    },
  });
};

export default useUpdateChecklist;
