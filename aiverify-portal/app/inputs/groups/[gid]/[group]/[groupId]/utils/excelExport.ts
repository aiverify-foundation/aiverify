import ExcelJS from 'exceljs';

// Cell definition interfaces
interface ExcelCellDefinition {
  value: string | number | Date | null;
  style: string;
}

// Row definition interface
interface ExcelRowDefinition {
  cells: ExcelCellDefinition[];
  height?: number;
  mergedCells?: string;
}

// Sheet definition interface
interface ExcelSheetDefinition {
  name: string;
  columns: { key: string; width: number }[];
  rows: ExcelRowDefinition[];
}

// Workbook definition interface
interface ExcelWorkbookDefinition {
  fileName: string;
  creator: string;
  lastModifiedBy: string;
  created: Date;
  modified: Date;
  styles: Record<string, ExcelStyle>;
  sheets: ExcelSheetDefinition[];
}

// Excel style interface
interface ExcelStyle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fill?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alignment?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  border?: any;
}

/**
 * Creates and downloads an Excel file from the provided Excel workbook definition
 * @param workbookDefinition The complete definition for building the Excel workbook
 * @returns A boolean indicating success or failure
 */
export async function createAndDownloadExcel(
  workbookDefinition: ExcelWorkbookDefinition
): Promise<boolean> {
  if (!workbookDefinition || !workbookDefinition.sheets) {
    console.error('Invalid Excel workbook definition provided');
    return false;
  }

  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = workbookDefinition.creator;
    workbook.lastModifiedBy = workbookDefinition.lastModifiedBy;
    workbook.created = workbookDefinition.created;
    workbook.modified = workbookDefinition.modified;

    // Get the styles from the definition
    const styles = workbookDefinition.styles;

    // Process each sheet definition
    workbookDefinition.sheets.forEach((sheetDef) => {
      try {
        // Create the worksheet
        const worksheet = workbook.addWorksheet(sheetDef.name);

        // Set column widths
        worksheet.columns = sheetDef.columns;

        // Helper function to apply style to a cell
        const applyStyleToCell = (cell: ExcelJS.Cell, styleName: string) => {
          const style = styles[styleName];
          if (!style) {
            console.warn(`Style "${styleName}" not found`);
            return;
          }

          // Apply font styles
          if (style.font) {
            // For font, ensure we're not accidentally using null or undefined values
            const font = { ...style.font };
            // Make sure the color is properly defined for Excel
            if (font.color && font.color.argb) {
              cell.font = font;
            } else if (font.color) {
              // In case color has unexpected format
              font.color = { argb: 'FF000000' }; // Default to black
              cell.font = font;
            } else {
              cell.font = font;
            }
          }

          // Apply fill styles
          if (style.fill) {
            // Most common issue with Excel styling is with fill patterns
            if (
              style.fill.type === 'pattern' &&
              style.fill.pattern === 'solid'
            ) {
              // Ensure we have properly formatted color objects
              const fgColor =
                style.fill.fgColor && style.fill.fgColor.argb
                  ? style.fill.fgColor
                  : { argb: 'FFFFFFFF' }; // Default to white

              const bgColor =
                style.fill.bgColor && style.fill.bgColor.argb
                  ? style.fill.bgColor
                  : { argb: 'FFFFFFFF' }; // Default to white

              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: fgColor,
                bgColor: bgColor,
              };
            } else {
              // For other fill types, try to use as is
              cell.fill = style.fill;
            }
          }

          // Apply alignment
          if (style.alignment) {
            cell.alignment = style.alignment;
          }

          // Apply borders
          if (style.border) {
            cell.border = style.border;
          }
        };

        // Process each row
        sheetDef.rows.forEach((rowDef) => {
          // Create an array of values for the row
          const values = rowDef.cells.map((cell) => cell.value);

          // Add the row to the worksheet
          const row = worksheet.addRow(values);

          // Set row height if specified
          if (rowDef.height) {
            row.height = rowDef.height;
          }

          // Apply styles to cells
          rowDef.cells.forEach((cellDef, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            applyStyleToCell(cell, cellDef.style);
          });

          // Handle merged cells
          if (rowDef.mergedCells) {
            // First, merge the cells
            worksheet.mergeCells(rowDef.mergedCells);

            // Apply the styles to all cells in the merged range
            // This helps ensure consistent styling within the merged area
            try {
              const range = rowDef.mergedCells.split(':');
              if (range.length === 2) {
                const startCell = worksheet.getCell(range[0]);

                // Extract the column and row from the cell references
                // Convert the cell addresses to column/row indices
                const startCellAddress = worksheet.getCell(range[0]).address;
                const endCellAddress = worksheet.getCell(range[1]).address;

                // Parse the column letter and row from the address
                const startColLetter = startCellAddress.replace(/[0-9]/g, '');
                const startRowNum = parseInt(
                  startCellAddress.replace(/[^0-9]/g, ''),
                  10
                );

                const endColLetter = endCellAddress.replace(/[0-9]/g, '');
                const endRowNum = parseInt(
                  endCellAddress.replace(/[^0-9]/g, ''),
                  10
                );

                // Convert column letters to column numbers
                const colToNum = (col: string) => {
                  let result = 0;
                  for (let i = 0; i < col.length; i++) {
                    result = result * 26 + (col.charCodeAt(i) - 64);
                  }
                  return result;
                };

                const startColNum = colToNum(startColLetter);
                const endColNum = colToNum(endColLetter);

                // Get the style from the first cell in the row
                const styleName = rowDef.cells[0].style;

                // Apply that style to all cells in the merged range
                if (styleName) {
                  // Apply to the start cell first (most important)
                  applyStyleToCell(startCell, styleName);

                  // Also apply to other cells in the range to ensure consistent styling
                  for (let row = startRowNum; row <= endRowNum; row++) {
                    for (let col = startColNum; col <= endColNum; col++) {
                      // Skip the start cell as we already styled it
                      if (row === startRowNum && col === startColNum) continue;

                      const cell = worksheet.getCell(row, col);
                      // For other cells in the range, focus on the fill style
                      // which is often the most visible aspect
                      const style = styles[styleName];
                      if (style && style.fill) {
                        cell.fill = style.fill;
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('Error applying style to merged cells:', err);
            }
          }
        });
      } catch (error) {
        console.error(`Error creating worksheet ${sheetDef.name}:`, error);
      }
    });

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create a Blob from the buffer
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = workbookDefinition.fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true; // Indicate successful export
  } catch (error) {
    console.error('Error during Excel creation:', error);
    return false;
  }
}
