'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TestRunOutput } from '@/lib/fetchApis/getTestRunApis';

/**
 * Hook for canceling a test run
 * @returns Mutation object for canceling a test run
 */
const useCancelTestRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testRunId: string) => {
      console.log(`Canceling test run: ${testRunId}`);

      const response = await fetch(`/api/test_runs/${testRunId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test run cancellation error:', errorText);
        throw new Error(`Failed to cancel test run: ${errorText}`);
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (result, testRunId) => {
      // Update the test run in the cache to reflect the canceled status
      queryClient.setQueryData<TestRunOutput[]>(['testRuns'], (oldData) => {
        if (!oldData) return [];

        return oldData.map((testRun) => {
          if (testRun.id === testRunId) {
            return {
              ...testRun,
              status: 'cancelled',
              progress: testRun.progress,
            };
          }
          return testRun;
        });
      });

      // Also invalidate the query to ensure we get the latest data
      queryClient.invalidateQueries({ queryKey: ['testRuns'] });
    },
  });
};

export default useCancelTestRun;
