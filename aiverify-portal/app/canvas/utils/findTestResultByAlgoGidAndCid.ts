import { ParsedTestResults } from '@/app/canvas/types';

/**
 * Finds a specific test result from an array of test results by matching gid and cid
 * @param testResults Array of parsed test results to search through
 * @param gid Global identifier for the plugin/algorithm
 * @param cid Component identifier for the specific test
 * @returns The matching test result object if found, undefined otherwise
 */

export function findTestResultByAlgoGidAndCid(
  testResults: ParsedTestResults[],
  gid: string,
  cid: string
): ParsedTestResults | undefined {
  const testResult = testResults.find(
    (testResult) => testResult.gid === gid && testResult.cid === cid
  );
  if (!testResult) return undefined;
  return testResult;
}
