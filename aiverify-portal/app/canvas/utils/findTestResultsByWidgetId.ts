import { ParsedTestResults } from "@/app/canvas/types";

export function findTestResultsByWidgetId(testResults: ParsedTestResults[], widgetGid: string): ParsedTestResults[] {
  return testResults.filter(result => result.gid === widgetGid);
}