import { useMutation } from '@tanstack/react-query';

interface FairnessTreeData {
  cid: string;
  data: unknown;
  gid: string;
  name: string;
  group: string;
}

export const useSubmitFairnessTree = () => {
  const mutation = useMutation({
    mutationFn: async (fairnessTreeData: FairnessTreeData) => {
      console.log('submit:', fairnessTreeData);
      const response = await fetch('/api/input_block_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fairnessTreeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit fairness tree');
      }

      return response.json();
    },
  });

  return {
    submitFairnessTree: mutation.mutate,
    isSubmitting: mutation.isPending,
    submitError: mutation.error,
  };
};
