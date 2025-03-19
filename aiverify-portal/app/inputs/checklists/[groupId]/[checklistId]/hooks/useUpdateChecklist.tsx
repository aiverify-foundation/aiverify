// hooks/useUpdateChecklist.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChecklists } from '@/app/inputs/context/ChecklistsContext';

const updateChecklist = async (variables: {
  id: string;
  data: { data: Record<string, string>; name: string; group: string };
}) => {
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
  const { checklists, setChecklists } = useChecklists();
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    {
      id: string;
      data: { data: Record<string, string>; name: string; group: string };
    },
    unknown
  >({
    mutationFn: updateChecklist,
    onSuccess: (_, variables) => {
      // Update the checklist in the context
      const updatedChecklists = checklists.map((checklist) =>
        checklist.id === parseInt(variables.id)
          ? {
              ...checklist,
              data: variables.data.data,
              updated_at: new Date().toISOString(),
            }
          : checklist
      );
      setChecklists(updatedChecklists);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['checklist', variables.id] }); // Invalidate individual checklist query
      queryClient.invalidateQueries({ queryKey: ['mdx-bundle'] }); // Invalidate MDX bundle queries
      queryClient.invalidateQueries({ queryKey: ['mdx-summary-bundle'] }); // Invalidate MDX summary bundle queries
    },
    onError: (error) => {
      console.error('Error updating checklist:', error);
    },
  });
};

export default useUpdateChecklist;
