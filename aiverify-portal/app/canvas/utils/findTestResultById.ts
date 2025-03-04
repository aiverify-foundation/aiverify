import { ParsedTestResults } from '@/app/canvas/types';

/**
 * Finds a specific test result from an array of test results by matching the test result ID
 * @param testResults Array of parsed test results to search through
 * @param testResultId Unique identifier for the specific test result
 * @returns The matching test result object if found, undefined otherwise
 */
export function findTestResultById(
  testResults: ParsedTestResults[],
  testResultId: number
): ParsedTestResults | undefined {
  return testResults.find((testResult) => testResult.id === testResultId);
}
