'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for deleting a test run
 * @returns Mutation object for deleting a test run
 */
const useDeleteTestRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testRunId: string) => {
      console.log(`Deleting test run: ${testRunId}`);

      const response = await fetch(`/api/test_runs/${testRunId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test run deletion error:', errorText);
        throw new Error(`Failed to delete test run: ${errorText}`);
      }

      return testRunId;
    },
    onSuccess: () => {
      // Invalidate the test runs query to refresh the list after deletion
      queryClient.invalidateQueries({ queryKey: ['testRuns'] });
    },
  });
};

export default useDeleteTestRun;
