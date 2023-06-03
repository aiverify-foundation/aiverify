/**
 * Mock report module
 */
import {jest} from '@jest/globals';

export const REPORT_DIRNAME = "reports";

export const getReportFilename = jest.fn(projectId => {
  return `report_${projectId}.pdf`;
})

export const generateReport = jest.fn();
