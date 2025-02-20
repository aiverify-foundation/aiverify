import { ParsedTestResults } from '@/app/canvas/types';

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
