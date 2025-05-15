'use client';

import { useMutation } from '@tanstack/react-query';
import { TestRunInput, TestRunOutput } from '@/lib/fetchApis/getTestRunApis';

interface UseSubmitTestOptions {
  onSuccess?: (data: TestRunOutput) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for submitting a test run
 * @param options Optional configuration for success and error handling
 * @returns Mutation object for submitting a test
 */
const useSubmitTest = (options?: UseSubmitTestOptions) => {
  return useMutation({
    mutationFn: async (testData: TestRunInput): Promise<TestRunOutput> => {
      console.log('Submitting test data:', testData);

      // Using the same pattern as useUploadFile.tsx - without trailing slash
      const response = await fetch('/api/test_runs/run_test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        // Add these options to ensure consistent fetch behavior
        cache: 'no-cache',
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test submission error:', errorText);
        throw new Error(`Failed to run test: ${errorText}`);
      }

      const result = await response.json();
      console.log('Test submission successful:', result);
      return result;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export default useSubmitTest;
