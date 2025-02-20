import { ParsedTestResults } from '@/app/canvas/types';

export function findTestResultById(
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
