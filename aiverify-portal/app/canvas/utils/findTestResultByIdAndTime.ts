import { ParsedTestResults } from '@/app/canvas/types';

/**
 * Finds a specific test result from an array of test results by matching gid, cid, and time
 * @param testResults Array of parsed test results to search through
 * @param gid Global identifier for the plugin/algorithm
 * @param cid Component identifier for the specific test
 * @param time Timestamp for the specific test
 * @returns The matching test result object if found, undefined otherwise
 */
export function findTestResultByIdAndTime(
  testResults: ParsedTestResults[],
  gid: string,
  cid: string,
  time: string
): ParsedTestResults | undefined {
  return testResults.find(
    (testResult) =>
      testResult.gid === gid &&
      testResult.cid === cid &&
      testResult.created_at === time
  );
}
