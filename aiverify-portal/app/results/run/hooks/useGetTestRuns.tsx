'use client';

import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { TestRunOutput } from '@/lib/fetchApis/getTestRunApis';

// Set up a polling interval for progress updates
const PROGRESS_POLL_INTERVAL = 3000; // 3 seconds

/**
 * Hook for fetching test runs with real-time progress updates
 * @param options Optional query configuration
 * @returns Query object for fetching test runs
 */
const useGetTestRuns = (
  options?: Omit<
    UseQueryOptions<TestRunOutput[], Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryClient = useQueryClient();

  // Main query for fetching test runs
  const mainQuery = useQuery<TestRunOutput[], Error>({
    queryKey: ['testRuns'],
    queryFn: async (): Promise<TestRunOutput[]> => {
      console.log('Fetching test runs');

      const response = await fetch('/api/test_runs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add these options to ensure consistent fetch behavior
        cache: 'no-cache',
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test runs fetch error:', errorText);
        throw new Error(`Failed to fetch test runs: ${errorText}`);
      }

      const result = await response.json();
      console.log('Test runs fetch successful:', result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  // Set up polling for active tests - only when main query is successful
  useQuery({
    queryKey: ['testRunsProgress'],
    queryFn: async (): Promise<boolean> => {
      // Only poll for progress if we have cached data
      const cachedData = queryClient.getQueryData<TestRunOutput[]>([
        'testRuns',
      ]);
      if (!cachedData) return false;

      // Check if there are any pending or running tests
      const activeTests = cachedData.filter(
        (test) => test.status === 'pending'
      );

      if (activeTests.length === 0) return false;

      // Fetch the latest test runs to get updated progress information
      const response = await fetch('/api/test_runs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add these options to ensure we get fresh data
        cache: 'no-cache',
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        console.error('Error fetching progress updates');
        return false;
      }

      // Get the latest test data with real progress values
      const latestTestRuns: TestRunOutput[] = await response.json();

      // Find the updated progress for active tests
      const progressUpdates = activeTests.map((test) => {
        const latestTest = latestTestRuns.find((t) => t.id === test.id);

        // If we found updated data, use it; otherwise keep existing data
        if (latestTest) {
          return {
            id: test.id,
            progress: latestTest.progress,
            status: latestTest.status,
          };
        }

        // Fallback to current values if test not found in latest data
        return { id: test.id, progress: test.progress, status: test.status };
      });

      // Update individual test progress in the cache
      queryClient.setQueryData<TestRunOutput[]>(['testRuns'], (oldData) => {
        if (!oldData) return cachedData;

        return oldData.map((test) => {
          const updatedTest = progressUpdates.find(
            (update) => update.id === test.id
          );
          if (updatedTest) {
            return {
              ...test,
              progress: updatedTest.progress,
              status: updatedTest.status,
            };
          }
          return test;
        });
      });

      return true; // Successfully checked for progress updates
    },
    refetchInterval: PROGRESS_POLL_INTERVAL,
    enabled: mainQuery.isSuccess && mainQuery.data?.some(test => test.status === 'pending'),
  });

  return mainQuery;
};

export default useGetTestRuns;
