import { useMutation } from '@tanstack/react-query';

export const useChecklistMutation = (id: string) => {
  return useMutation({
    mutationFn: async (newData: Record<string, string>) => {
      const response = await fetch(`/api/input_block/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: newData }),
      });
      if (!response.ok) throw new Error('Failed to update checklist');
      return response.json();
    },
  });
};
