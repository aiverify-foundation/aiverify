import { excelToJson } from '../excelToJson';
import * as ExcelJS from 'exceljs';

// Mock the MDX execution module
jest.mock('@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useMDXExecution', () => ({
  executeMDXBundle: jest.fn(),
}));

// Mock the export process checklist constant
jest.mock('@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useProcessChecklistExport', () => ({
  EXPORT_PROCESS_CHECKLISTS_CID: 'test-checklist-id',
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock FileReader
const mockFileReader = {
  readAsArrayBuffer: jest.fn(),
  onload: null as ((e: any) => void) | null,
  onerror: null as ((e: any) => void) | null,
  result: null as ArrayBuffer | null,
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader),
});

// Mock ExcelJS
jest.mock('exceljs', () => ({
  Workbook: jest.fn(),
}));

describe('excelToJson', () => {
  let mockExecuteMDXBundle: jest.MockedFunction<any>;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockWorkbook: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteMDXBundle = require('@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useMDXExecution').executeMDXBundle;
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    
    // Reset FileReader mock
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockFileReader.result = null;

    // Setup mock workbook
    mockWorkbook = {
      xlsx: {
        load: jest.fn().mockResolvedValue(undefined),
      },
      worksheets: [],
    };

    (ExcelJS.Workbook as jest.MockedClass<any>).mockImplementation(() => mockWorkbook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error handling', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    });

    it('should handle Excel file with no worksheets', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;
      mockWorkbook.worksheets = [];

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file contains no worksheets'
      );
    });

    it('should handle Excel file with empty buffer', async () => {
      mockFileReader.result = null;

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: null } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file appears to be corrupted or invalid'
      );
    });

    it('should handle Excel file with zero byte buffer', async () => {
      const buffer = new ArrayBuffer(0);
      mockFileReader.result = buffer;

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file is empty or corrupted'
      );
    });

    it('should handle ExcelJS load error', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;
      mockWorkbook.xlsx.load = jest.fn().mockRejectedValue(new Error('Load error'));

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file appears to be corrupted or invalid'
      );
    });

    it('should handle FileReader error', async () => {
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error('Read error'));
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'Failed to read the Excel file'
      );
    });

    it('should handle fetch error in MDX bundle retrieval', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;
      
      // Mock a valid worksheet to get past the Excel processing
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'Unable to process Excel file: Network error. Please check your connection and try again.'
      );
    });

    it('should handle MDX bundle execution error', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;
      
      // Mock a valid worksheet to get past the Excel processing
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock fetch to succeed but MDX execution to fail
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ code: 'test code' }),
      } as any);

      mockExecuteMDXBundle.mockImplementation(() => {
        throw new Error('Execution error');
      });

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'Unable to process Excel file: Configuration error'
      );
    });

    it('should handle fetch response error', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;
      
      // Mock a valid worksheet to get past the Excel processing
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock fetch to return error response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'An unexpected error occurred while processing the Excel file. Please try again or contact support if the problem persists.'
      );
    });
  });

  describe('Excel processing with valid data', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    });

    it('should process Excel file with valid worksheet data', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet with data
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            // Column A: PID, Column B: Process, Column C: Metric, Column D: Process Checks, Column E: Completed, Column F: Elaboration
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };

      mockWorkbook.worksheets = [mockWorksheet];

      // Mock successful MDX bundle retrieval
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue([
          {
            gid: 'test.gid',
            cid: 'test.cid',
            name: 'Test Checklist',
            group: 'test_group',
            data: {
              '9.1.1_completed': 'Yes',
              '9.1.1_elaboration': 'Test elaboration',
            },
          },
        ]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      const result = await excelToJson(mockFile, 'test_group', 'test.gid');

      expect(result.submissions).toHaveLength(1);
      expect(result.submissions[0].gid).toBe('test.gid');
      expect(result.submissions[0].cid).toBe('test.cid');
      expect(result.unmatchedSheets).toEqual([]);
    });

    it('should handle worksheet with empty first cell', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      const mockWorksheet = {
        name: 'Empty Sheet',
        getCell: jest.fn(() => ({ value: null })),
        getRow: jest.fn(() => null),
        eachRow: jest.fn(),
      };

      mockWorkbook.worksheets = [mockWorksheet];

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file contains no readable worksheets or data'
      );
    });

    it('should handle worksheet with structure issues', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      const mockRows = [
        { rowNumber: 1, getCell: (col: number) => ({ text: 'TEST PRINCIPLE' }) },
        { rowNumber: 2, getCell: (col: number) => ({ text: '9.1.1' }) },
        { rowNumber: 3, getCell: (col: number) => ({ text: 'Short' }) },
        { rowNumber: 4, getCell: (col: number) => ({ text: 'Short' }) },
        { rowNumber: 5, getCell: (col: number) => ({ text: 'Short' }) },
        { rowNumber: 6, getCell: (col: number) => ({ text: 'Yes' }) },
        { rowNumber: 7, getCell: (col: number) => ({ text: 'Test Elaboration' }) },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };

      mockWorkbook.worksheets = [mockWorksheet];

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file has corrupted structure in the following sheets: Test Sheet'
      );
    });

    it('should handle worksheet with invalid PID format', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      const mockRows = [
        { rowNumber: 1, getCell: (col: number) => ({ text: 'TEST PRINCIPLE' }) },
        { rowNumber: 2, getCell: (col: number) => ({ text: 'invalid-pid' }) },
        { rowNumber: 3, getCell: (col: number) => ({ text: 'Test Process' }) },
        { rowNumber: 4, getCell: (col: number) => ({ text: 'Test Metric' }) },
        { rowNumber: 5, getCell: (col: number) => ({ text: 'Test Process Checks' }) },
        { rowNumber: 6, getCell: (col: number) => ({ text: 'Yes' }) },
        { rowNumber: 7, getCell: (col: number) => ({ text: 'Test Elaboration' }) },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };

      mockWorkbook.worksheets = [mockWorksheet];

      // Mock successful MDX bundle retrieval
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue([]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'No valid checklist data found in the Excel file'
      );
    });

    it('should handle worksheet with insufficient content', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'TEST PRINCIPLE' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'N/A', // Process - insufficient content
              3: 'Not Applicable', // Metric - insufficient content
              4: 'None', // Process Checks - insufficient content
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };

      mockWorkbook.worksheets = [mockWorksheet];

      // Mock successful MDX bundle retrieval
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue([]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file has corrupted structure in the following sheets: Test Sheet'
      );
    });
  });

  describe('MDX bundle processing', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    });

    it('should handle missing import functions in MDX bundle', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock MDX bundle without import functions
      const emptyBundle = {};

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(emptyBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'Unable to process Excel file: Missing required conversion functions'
      );
    });

    it('should handle empty submissions from MDX bundle', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock MDX bundle returning empty submissions
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue([]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'No valid checklist data found in the Excel file'
      );
    });

    it('should handle submissions with missing required fields', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock MDX bundle returning invalid submissions
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue([
          {
            gid: 'test.gid',
            cid: 'test.cid',
            name: 'Test Checklist',
            group: 'test_group',
            data: {},
          },
        ]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'The Excel file appears to be a template that has not been filled in yet'
      );
    });

    it('should handle submissions with invalid structure', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock MDX bundle returning submissions with invalid structure
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue([
          {
            gid: 'test.gid',
            cid: 'test.cid',
            name: 'Test Checklist',
            group: 'test_group',
            data: {
              'random_field': 'value',
            },
          },
        ]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      await expect(excelToJson(mockFile, 'test_group', 'test.gid')).rejects.toThrow(
        'Submission 1 does not appear to contain valid checklist data'
      );
    });

    it('should handle legacy importJson function', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock MDX bundle with legacy importJson function
      const mockBundle = {
        importJson: jest.fn().mockReturnValue([
          {
            gid: 'test.gid',
            cid: 'test.cid',
            name: 'Test Checklist',
            group: 'test_group',
            data: {
              '9.1.1_completed': 'Yes',
            },
          },
        ]),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      const result = await excelToJson(mockFile, 'test_group', 'test.gid');
      expect(result.submissions).toHaveLength(1);
      expect(result.submissions[0].gid).toBe('test.gid');
      expect(result.unmatchedSheets).toEqual([]);
    });

    it('should handle new return type with unmatchedSheets', async () => {
      const buffer = new ArrayBuffer(100);
      mockFileReader.result = buffer;

      // Mock a valid worksheet
      const mockRows = [
        { 
          rowNumber: 1, 
          getCell: (col: number) => ({ text: 'ACCOUNTABILITY PROCESS CHECKLIST' }) 
        },
        { 
          rowNumber: 2, 
          getCell: (col: number) => {
            const cellData: { [key: number]: string } = {
              1: '9.1.1', // PID
              2: 'Test Process with sufficient content for validation', // Process
              3: 'Test Metric with sufficient content for validation', // Metric
              4: 'Test Process Checks with sufficient content for validation', // Process Checks
              5: 'Yes', // Completed
              6: 'Test Elaboration', // Elaboration
            };
            return { text: cellData[col] || '' };
          }
        },
      ];

      const mockWorksheet = {
        name: 'Test Sheet',
        getCell: jest.fn(() => ({ value: 'Test Value' })),
        getRow: jest.fn((rowNumber: number) => {
          const row = mockRows.find(r => r.rowNumber === rowNumber);
          if (row) {
            return {
              getCell: row.getCell,
            };
          }
          return null;
        }),
        rowCount: 10,
        actualRowCount: 10,
        eachRow: jest.fn((options, callback) => {
          // Handle both function-only and options+function calls
          const actualCallback = typeof options === 'function' ? options : callback;
          mockRows.forEach(row => actualCallback(row, row.rowNumber));
        }),
      };
      mockWorkbook.worksheets = [mockWorksheet];

      // Mock MDX bundle with new return type
      const mockBundle = {
        mdxImportJson: jest.fn().mockReturnValue({
          submissions: [
            {
              gid: 'test.gid',
              cid: 'test.cid',
              name: 'Test Checklist',
              group: 'test_group',
              data: {
                '9.1.1_completed': 'Yes',
              },
            },
          ],
          unmatchedSheets: ['Sheet1', 'Sheet2'],
        }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBundle),
      } as any);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: buffer } });
        }
      }, 0);

      const result = await excelToJson(mockFile, 'test_group', 'test.gid');
      expect(result.submissions).toHaveLength(1);
      expect(result.unmatchedSheets).toEqual(['Sheet1', 'Sheet2']);
    });
  });
}); 