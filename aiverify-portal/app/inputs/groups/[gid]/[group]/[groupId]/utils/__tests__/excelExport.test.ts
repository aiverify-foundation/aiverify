import { createAndDownloadExcel } from '../excelExport';
import ExcelJS from 'exceljs';

// Mock ExcelJS
jest.mock('exceljs', () => {
  const mockCell = {
    font: {},
    fill: {},
    alignment: {},
    border: {},
    address: 'A1',
  };

  const mockRow = {
    height: 20,
    getCell: jest.fn(() => mockCell),
  };

  const mockWorksheet = {
    columns: [],
    addRow: jest.fn(() => mockRow),
    mergeCells: jest.fn(),
    getCell: jest.fn(() => mockCell),
  };

  const mockWorkbook = {
    creator: '',
    lastModifiedBy: '',
    created: null,
    modified: null,
    addWorksheet: jest.fn(() => mockWorksheet),
    xlsx: {
      writeBuffer: jest.fn(),
    },
  };

  return {
    Workbook: jest.fn(() => mockWorkbook),
  };
});

// Mock DOM APIs
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('excelExport', () => {
  let mockWorkbook: any;
  let mockWorksheet: any;
  let mockRow: any;
  let mockCell: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockCreateObjectURL.mockReturnValue('mock-url');
    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    });

    // Setup ExcelJS mocks
    mockCell = {
      font: {},
      fill: {},
      alignment: {},
      border: {},
      address: 'A1',
    };

    mockRow = {
      height: 20,
      getCell: jest.fn(() => mockCell),
    };

    mockWorksheet = {
      columns: [],
      addRow: jest.fn(() => mockRow),
      mergeCells: jest.fn(),
      getCell: jest.fn(() => mockCell),
    };

    mockWorkbook = {
      creator: '',
      lastModifiedBy: '',
      created: null,
      modified: null,
      addWorksheet: jest.fn(() => mockWorksheet),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      },
    };

    (ExcelJS.Workbook as jest.Mock).mockReturnValue(mockWorkbook);
  });

  describe('createAndDownloadExcel', () => {
    const validWorkbookDefinition = {
      fileName: 'test.xlsx',
      creator: 'Test Creator',
      lastModifiedBy: 'Test Modifier',
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-02'),
      styles: {
        header: {
          font: { bold: true, color: { argb: 'FF000000' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } },
          alignment: { horizontal: 'center' },
          border: { top: { style: 'thin' } },
        },
        normal: {
          font: { color: { argb: 'FF000000' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
        },
      },
      sheets: [
        {
          name: 'Sheet1',
          columns: [
            { key: 'col1', width: 10 },
            { key: 'col2', width: 20 },
          ],
          rows: [
            {
              cells: [
                { value: 'Header1', style: 'header' },
                { value: 'Header2', style: 'header' },
              ],
              height: 25,
              mergedCells: 'A1:B1',
            },
            {
              cells: [
                { value: 'Data1', style: 'normal' },
                { value: 'Data2', style: 'normal' },
              ],
            },
          ],
        },
      ],
    };

    it('should successfully create and download Excel file', async () => {
      const result = await createAndDownloadExcel(validWorkbookDefinition);

      expect(result).toBe(true);
      expect(mockWorkbook.creator).toBe('Test Creator');
      expect(mockWorkbook.lastModifiedBy).toBe('Test Modifier');
      expect(mockWorkbook.created).toEqual(new Date('2023-01-01'));
      expect(mockWorkbook.modified).toEqual(new Date('2023-01-02'));
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sheet1');
      expect(mockWorksheet.columns).toEqual([
        { key: 'col1', width: 10 },
        { key: 'col2', width: 20 },
      ]);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Header1', 'Header2']);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Data1', 'Data2']);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('should return false for invalid workbook definition (null)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await createAndDownloadExcel(null as any);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid Excel workbook definition provided');
      
      consoleSpy.mockRestore();
    });

    it('should return false for invalid workbook definition (undefined)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await createAndDownloadExcel(undefined as any);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid Excel workbook definition provided');
      
      consoleSpy.mockRestore();
    });

    it('should return false for workbook definition without sheets', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidDefinition = { ...validWorkbookDefinition, sheets: undefined } as any;
      const result = await createAndDownloadExcel(invalidDefinition);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid Excel workbook definition provided');
      
      consoleSpy.mockRestore();
    });

    it('should handle worksheet creation error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWorkbook.addWorksheet.mockImplementation(() => {
        throw new Error('Worksheet creation failed');
      });

      const result = await createAndDownloadExcel(validWorkbookDefinition);

      expect(result).toBe(true); // Should continue with other sheets
      expect(consoleSpy).toHaveBeenCalledWith('Error creating worksheet Sheet1:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple sheets', async () => {
      const multiSheetDefinition = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [{ cells: [{ value: 'Data1', style: 'normal' }] }],
          },
          {
            name: 'Sheet2',
            columns: [{ key: 'col2', width: 20 }],
            rows: [{ cells: [{ value: 'Data2', style: 'normal' }] }],
          },
        ],
      };

      const result = await createAndDownloadExcel(multiSheetDefinition);

      expect(result).toBe(true);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sheet1');
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sheet2');
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Data1']);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Data2']);
    });

    it('should handle rows without height specification', async () => {
      const definitionWithoutHeight = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'normal' }],
                // No height specified
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithoutHeight);

      expect(result).toBe(true);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Data1']);
    });

    it('should handle rows without merged cells', async () => {
      const definitionWithoutMerged = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'normal' }],
                // No mergedCells specified
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithoutMerged);

      expect(result).toBe(true);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Data1']);
      expect(mockWorksheet.mergeCells).not.toHaveBeenCalled();
    });

    it('should handle style not found warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const definitionWithInvalidStyle = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'nonexistent' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithInvalidStyle);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Style "nonexistent" not found');
      
      consoleSpy.mockRestore();
    });

    it('should handle font style with proper color', async () => {
      const definitionWithFont = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            font: { bold: true, color: { argb: 'FF0000FF' } },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithFont);

      expect(result).toBe(true);
      expect(mockCell.font).toEqual({ bold: true, color: { argb: 'FF0000FF' } });
    });

    it('should handle font style with invalid color format', async () => {
      const definitionWithInvalidFont = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            font: { bold: true, color: 'invalid' },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithInvalidFont);

      expect(result).toBe(true);
      expect(mockCell.font).toEqual({ bold: true, color: { argb: 'FF000000' } });
    });

    it('should handle font style without color', async () => {
      const definitionWithoutColor = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            font: { bold: true },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithoutColor);

      expect(result).toBe(true);
      expect(mockCell.font).toEqual({ bold: true });
    });

    it('should handle fill style with pattern solid', async () => {
      const definitionWithFill = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF00FF00' },
              bgColor: { argb: 'FFFFFFFF' },
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithFill);

      expect(result).toBe(true);
      expect(mockCell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00FF00' },
        bgColor: { argb: 'FFFFFFFF' },
      });
    });

    it('should handle fill style with missing fgColor', async () => {
      const definitionWithMissingFgColor = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFFFFFF' },
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithMissingFgColor);

      expect(result).toBe(true);
      expect(mockCell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
        bgColor: { argb: 'FFFFFFFF' },
      });
    });

    it('should handle fill style with missing bgColor', async () => {
      const definitionWithMissingBgColor = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF00FF00' },
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithMissingBgColor);

      expect(result).toBe(true);
      expect(mockCell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00FF00' },
        bgColor: { argb: 'FFFFFFFF' },
      });
    });

    it('should handle fill style with non-pattern type', async () => {
      const definitionWithNonPatternFill = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            fill: {
              type: 'gradient',
              stops: [{ position: 0, color: { argb: 'FF000000' } }],
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithNonPatternFill);

      expect(result).toBe(true);
      expect(mockCell.fill).toEqual({
        type: 'gradient',
        stops: [{ position: 0, color: { argb: 'FF000000' } }],
      });
    });

    it('should handle alignment style', async () => {
      const definitionWithAlignment = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            alignment: { horizontal: 'center', vertical: 'middle' },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithAlignment);

      expect(result).toBe(true);
      expect(mockCell.alignment).toEqual({ horizontal: 'center', vertical: 'middle' });
    });

    it('should handle border style', async () => {
      const definitionWithBorder = {
        ...validWorkbookDefinition,
        styles: {
          testStyle: {
            border: {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Data1', style: 'testStyle' }],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithBorder);

      expect(result).toBe(true);
      expect(mockCell.border).toEqual({
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
      });
    });

    it('should handle merged cells with proper range', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithMerged = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Merged', style: 'normal' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithMerged);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock getCell to throw an error during merged cells processing
      mockWorksheet.getCell.mockImplementation(() => {
        throw new Error('Cell access failed');
      });

      const definitionWithMerged = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Merged', style: 'normal' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithMerged);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Error applying style to merged cells:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle merged cells with invalid range format', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const definitionWithInvalidRange = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Invalid', style: 'normal' }],
                mergedCells: 'A1', // Invalid range format
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithInvalidRange);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1');
      // Should not log warning since the range parsing won't proceed
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle merged cells with complex column parsing', async () => {
      // Mock getCell to return cells with proper addresses for complex columns
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellZ1 = { ...mockCell, address: 'Z1' };
      const mockCellAA1 = { ...mockCell, address: 'AA1' };
      const mockCellAB1 = { ...mockCell, address: 'AB1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellZ1)
        .mockReturnValueOnce(mockCellAA1)
        .mockReturnValueOnce(mockCellAB1);

      const definitionWithComplexColumns = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Complex', style: 'normal' }],
                mergedCells: 'A1:Z1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithComplexColumns);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:Z1');
    });

    it('should handle merged cells with multi-row range', async () => {
      // Mock getCell to return cells with proper addresses for multi-row range
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB3 = { ...mockCell, address: 'B3' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB3);

      const definitionWithMultiRow = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'MultiRow', style: 'normal' }],
                mergedCells: 'A1:B3',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithMultiRow);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B3');
    });

    it('should handle merged cells without style', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithoutStyle = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'NoStyle', style: '' }], // Empty style
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithoutStyle);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells with style that has no fill', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithStyleNoFill = {
        ...validWorkbookDefinition,
        styles: {
          noFillStyle: {
            font: { bold: true },
            // No fill property
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'NoFill', style: 'noFillStyle' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithStyleNoFill);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells with style that has fill but no fgColor', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithFillNoFgColor = {
        ...validWorkbookDefinition,
        styles: {
          fillNoFgColor: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              // No fgColor
              bgColor: { argb: 'FFFFFFFF' },
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'FillNoFg', style: 'fillNoFgColor' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithFillNoFgColor);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells with style that has fill but no bgColor', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithFillNoBgColor = {
        ...validWorkbookDefinition,
        styles: {
          fillNoBgColor: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF00FF00' },
              // No bgColor
            },
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'FillNoBg', style: 'fillNoBgColor' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithFillNoBgColor);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells with style that has no fill property', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithStyleNoFillProperty = {
        ...validWorkbookDefinition,
        styles: {
          styleNoFillProperty: {
            font: { bold: true },
            // No fill property at all
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'NoFillProp', style: 'styleNoFillProperty' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithStyleNoFillProperty);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells with style that has falsy fill property', async () => {
      // Mock getCell to return cells with proper addresses
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellB1 = { ...mockCell, address: 'B1' };
      
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellB1);

      const definitionWithFalsyFill = {
        ...validWorkbookDefinition,
        styles: {
          falsyFillStyle: {
            font: { bold: true },
            fill: null, // Explicitly falsy
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'FalsyFill', style: 'falsyFillStyle' }],
                mergedCells: 'A1:B1',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithFalsyFill);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:B1');
    });

    it('should handle merged cells with larger range and falsy fill', async () => {
      // Mock getCell to return cells with proper addresses for larger range
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellC2 = { ...mockCell, address: 'C2' };
      
      // Mock getCell to return different cells for the range processing
      let callCount = 0;
      mockWorksheet.getCell.mockImplementation((row: any, col: any) => {
        callCount++;
        if (callCount === 1) return mockCellA1;
        if (callCount === 2) return mockCellC2;
        // Return cells for the range processing (A1, A2, B1, B2, C1, C2)
        return { ...mockCell, address: `${String.fromCharCode(64 + col)}${row}` };
      });

      const definitionWithLargerRange = {
        ...validWorkbookDefinition,
        styles: {
          largeRangeStyle: {
            font: { bold: true },
            fill: false, // Explicitly falsy
          },
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'LargeRange', style: 'largeRangeStyle' }],
                mergedCells: 'A1:C2', // 3x2 range
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithLargerRange);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:C2');
    });

    it('should handle workbook write buffer error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWorkbook.xlsx.writeBuffer.mockRejectedValue(new Error('Write buffer failed'));

      const result = await createAndDownloadExcel(validWorkbookDefinition);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error during Excel creation:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle different cell value types', async () => {
      const definitionWithDifferentTypes = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [
                  { value: 'String', style: 'normal' },
                  { value: 123, style: 'normal' },
                  { value: new Date('2023-01-01'), style: 'normal' },
                  { value: null, style: 'normal' },
                ],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithDifferentTypes);

      expect(result).toBe(true);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['String', 123, new Date('2023-01-01'), null]);
    });

    it('should handle empty sheets array', async () => {
      const definitionWithEmptySheets = {
        ...validWorkbookDefinition,
        sheets: [],
      };

      const result = await createAndDownloadExcel(definitionWithEmptySheets);

      expect(result).toBe(true);
      expect(mockWorkbook.addWorksheet).not.toHaveBeenCalled();
    });

    it('should handle empty rows array', async () => {
      const definitionWithEmptyRows = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithEmptyRows);

      expect(result).toBe(true);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sheet1');
      expect(mockWorksheet.addRow).not.toHaveBeenCalled();
    });

    it('should handle empty cells array', async () => {
      const definitionWithEmptyCells = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [],
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithEmptyCells);

      expect(result).toBe(true);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith([]);
    });

    it('should handle complex merged cells range parsing', async () => {
      // Mock getCell to return cells with proper addresses for complex range
      const mockCellA1 = { ...mockCell, address: 'A1' };
      const mockCellC3 = { ...mockCell, address: 'C3' };
      mockWorksheet.getCell
        .mockReturnValueOnce(mockCellA1)
        .mockReturnValueOnce(mockCellC3);

      const definitionWithComplexMerged = {
        ...validWorkbookDefinition,
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'col1', width: 10 }],
            rows: [
              {
                cells: [{ value: 'Complex', style: 'normal' }],
                mergedCells: 'A1:C3',
              },
            ],
          },
        ],
      };

      const result = await createAndDownloadExcel(definitionWithComplexMerged);

      expect(result).toBe(true);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith('A1:C3');
    });

    it('should handle download link creation and cleanup', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      const result = await createAndDownloadExcel(validWorkbookDefinition);

      expect(result).toBe(true);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('mock-url');
      expect(mockLink.download).toBe('test.xlsx');
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    it('should handle blob creation with correct MIME type', async () => {
      const result = await createAndDownloadExcel(validWorkbookDefinition);

      expect(result).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
    });
  });
}); 