import { ParsedTestResults } from '@/app/canvas/types';

/**
 * Finds all test results from an array of test results by matching the widget's global identifier
 * @param testResults Array of parsed test results to search through
 * @param widgetGid Global identifier for the widget
 * @returns Array of test results matching the widget's global identifier
 */
export function findTestResultsByWidgetId(
  testResults: ParsedTestResults[],
  widgetGid: string
): ParsedTestResults[] {
  return testResults.filter((result) => result.gid === widgetGid);
}
