import * as ExcelJS from 'exceljs';
import { InputBlockDataPayload } from '@/app/types';
import { executeMDXBundle } from '@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useMDXExecution';
import { EXPORT_PROCESS_CHECKLISTS_CID } from '@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useProcessChecklistExport';

// Custom error classes for better error handling
class ExcelFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelFileError';
  }
}

class ExcelCorruptedError extends ExcelFileError {
  constructor() {
    super('The Excel file appears to be corrupted or invalid. Please check the file and try again.');
    this.name = 'ExcelCorruptedError';
  }
}

class ExcelFormatError extends ExcelFileError {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelFormatError';
  }
}

interface ChecklistSubmission {
  gid: string; // Group ID, e.g., "aiverify.stock.process_checklist"
  cid: string; // Checklist ID, e.g., "accountability_process_checklist"
  name: string; // Checklist name, e.g., "Accountability Process Checklist"
  group: string; // Group name, e.g., "example_group"
  data: InputBlockDataPayload; // Data related to the checklist
}

interface ExcelRowData {
  pid: string;
  completed: string;
  elaboration: string;
  summaryJustification: string;
}

interface ExcelSheetData {
  name: string;
  rows: ExcelRowData[];
  summaryJustification: string;
  principleName: string; // Store the full principle name
}

interface ExcelJsonData {
  sheets: ExcelSheetData[];
}

// Updated interface definition to include unmatched sheets in the return type
interface ImportResult {
  submissions: ChecklistSubmission[];
  unmatchedSheets: string[];
}

// Updated type definition for import functions
type ImportFunction = (
  jsonData: unknown,
  groupName: string
) => ImportResult | ChecklistSubmission[];

interface MdxBundle {
  // Named imports
  mdxImportJson?: ImportFunction;
  mdxJsonToChecklistSubmissions?: ImportFunction;
  mdxExtractChecklistData?: ImportFunction;

  // Legacy imports
  importJson?: ImportFunction;
  jsonToChecklistSubmissions?: ImportFunction;
  extractChecklistData?: ImportFunction;

  [key: string]: unknown;
}

// Helper function to safely get cell text
function safeCellText(worksheet: ExcelJS.Worksheet, rowNumber: number, columnNumber: number): string {
  try {
    const row = worksheet.getRow(rowNumber);
    if (!row) return '';
    
    const cell = row.getCell(columnNumber);
    if (!cell) return '';
    
    // Handle both text and value properties safely
    return cell.text?.toString() || cell.value?.toString() || '';
  } catch (error) {
    console.warn(`Error accessing cell at row ${rowNumber}, column ${columnNumber}:`, error);
    return '';
  }
}

// Helper function to safely get row cell text
function safeRowCellText(row: ExcelJS.Row, columnNumber: number): string {
  try {
    if (!row) return '';
    
    const cell = row.getCell(columnNumber);
    if (!cell) return '';
    
    // Handle both text and value properties safely
    return cell.text?.toString() || cell.value?.toString() || '';
  } catch (error) {
    console.warn(`Error accessing cell in column ${columnNumber}:`, error);
    return '';
  }
}

// Function to convert Excel data to JSON format
async function convertExcelToJson(file: File): Promise<ExcelJsonData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Validate file reader result
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new ExcelCorruptedError();
        }

        // Validate file size (basic check)
        if (buffer.byteLength === 0) {
          throw new ExcelFormatError('The Excel file is empty or corrupted.');
        }

        const workbook = new ExcelJS.Workbook();
        
        try {
          await workbook.xlsx.load(buffer);
        } catch (loadError) {
          console.error('ExcelJS load error:', loadError);
          throw new ExcelCorruptedError();
        }

        // Validate workbook has sheets
        if (!workbook.worksheets || workbook.worksheets.length === 0) {
          throw new ExcelFormatError('The Excel file contains no worksheets.');
        }

        const sheets: ExcelSheetData[] = [];
        let totalValidRows = 0;
        let sheetsWithValidData = 0;
        const sheetsWithStructureIssues: string[] = [];
        const sheetsWithPIDs: Set<string> = new Set();

        workbook.worksheets.forEach((worksheet) => {
          try {
            const sheetName = worksheet.name;
            console.log(`Processing sheet: ${sheetName}`);

            // Skip empty sheets
            if (!worksheet.getCell('A1').value) {
              console.log(`Skipping empty sheet: ${sheetName}`);
              return;
            }

            const rows: ExcelRowData[] = [];
            let sheetSummaryJustification = '';
            let principleName = '';
            let isSummarySection = false;
            let hasPIDsInSheet = false;
            let hasValidStructureInSheet = false;
            let totalPIDsInSheet = 0;
            let validPIDsInSheet = 0;

            // Extract the principle name from row 1 (title row - cells A-F merged)
            // This is in all uppercase text in the Excel file, we need to format it properly
            const titleCellText = safeCellText(worksheet, 1, 1);
            if (titleCellText) {
              const rawPrincipleName = titleCellText.trim();

              // Format principle name: convert to Title Case (first letter of each word uppercase)
              principleName = rawPrincipleName
                .toLowerCase()
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              console.log(
                `Found principle name: ${principleName} (from ${rawPrincipleName})`
              );
            }

            // Validate worksheet structure - check if it has proper rows and columns
            const totalRows = worksheet.rowCount;
            const actualRowCount = worksheet.actualRowCount;
            
            if (totalRows === 0 && actualRowCount === 0) {
              console.warn(`Sheet ${sheetName} appears to be empty`);
              // Don't throw error for individual empty sheets, but track it
            }

            // Process each row in the worksheet
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
              try {
                // Skip header row but don't return - we still need to extract data from it
                if (rowNumber === 1) return;

                // Check if this is the summary justification section
                const firstCell = safeRowCellText(row, 1);
                if (
                  firstCell &&
                  firstCell.trim().toLowerCase() === 'summary justification'
                ) {
                  isSummarySection = true;
                  return;
                }

                // If we're in the summary section, capture the content
                if (isSummarySection) {
                  // Get the cell value - it might be in column A only (merged cells A-F)
                  const summaryText = safeRowCellText(row, 1);
                  if (summaryText) {
                    sheetSummaryJustification = summaryText;
                  }
                  return;
                }

                // Normal row processing for PIDs, completed, and elaboration
                const pid = safeRowCellText(row, 1); // PID is in column A (first column)
                const process = safeRowCellText(row, 2); // Process is in column B (second column)
                const metric = safeRowCellText(row, 3); // Metric is in column C (third column)
                const processChecks = safeRowCellText(row, 4); // Process Checks is in column D (fourth column)
                const completed = safeRowCellText(row, 5); // "completed" is in column E (5th column)
                const elaboration = safeRowCellText(row, 6); // "elaboration" is in column F (6th column)

                // Validate PID format (e.g., 9.1.1, 9.2.1, etc.)
                const pidRegex = /^\d+(\.\d+)+$/; // Matches patterns like 9.1.1, 9.2.1, etc.
                if (pid && pidRegex.test(pid)) {
                  totalPIDsInSheet++;
                  hasPIDsInSheet = true;
                  sheetsWithPIDs.add(sheetName);
                  
                  console.log(`[DEBUG] Found PID ${pid} in sheet ${sheetName}, row ${rowNumber}`);
                  console.log(`[DEBUG] Process: "${process}"`);
                  console.log(`[DEBUG] Metric: "${metric}"`);
                  console.log(`[DEBUG] ProcessChecks: "${processChecks}"`);
                  
                  // Check if the row has the required structure (process, metric, processChecks should have content)
                  const hasRequiredStructure = process && process.trim().length > 0 && 
                                             metric && metric.trim().length > 0 && 
                                             processChecks && processChecks.trim().length > 0;
                  
                  // Enhanced validation: Check for meaningful default content, not just non-empty strings
                  const hasMeaningfulContent = hasRequiredStructure && 
                    // Process should contain descriptive text (not just "N/A", "Not Applicable", etc.)
                    !process.trim().toLowerCase().match(/^(n\/a|not applicable|none|empty|-$)$/) &&
                    // Metric should contain descriptive text
                    !metric.trim().toLowerCase().match(/^(n\/a|not applicable|none|empty|-$)$/) &&
                    // Process Checks should contain descriptive text
                    !processChecks.trim().toLowerCase().match(/^(n\/a|not applicable|none|empty|-$)$/) &&
                    // Content should be substantial (at least 10 characters for meaningful description)
                    process.trim().length >= 10 &&
                    metric.trim().length >= 10 &&
                    processChecks.trim().length >= 10;
                  
                  if (hasMeaningfulContent) {
                    validPIDsInSheet++;
                    hasValidStructureInSheet = true;
                    rows.push({
                      pid,
                      completed: completed || '',
                      elaboration: elaboration || '',
                      summaryJustification: '', // We'll set this for all rows from the sheet-level value
                    });
                    totalValidRows++;
                    console.log(`[DEBUG] ✓ PID ${pid} has valid content`);
                  } else {
                    console.warn(`[DEBUG] ✗ PID ${pid} in sheet ${sheetName} is missing required default content. Process="${process}", Metric="${metric}", ProcessChecks="${processChecks}"`);
                  }
                }
              } catch (rowError) {
                console.warn(`Error processing row ${rowNumber} in sheet ${sheetName}:`, rowError);
                // Continue processing other rows
              }
            });

            console.log(`[DEBUG] Sheet ${sheetName}: ${validPIDsInSheet}/${totalPIDsInSheet} PIDs have valid content`);
            
            // Check if this sheet has PIDs but no valid structure
            if (hasPIDsInSheet && !hasValidStructureInSheet) {
              sheetsWithStructureIssues.push(sheetName);
              console.log(`[DEBUG] ✗ Sheet ${sheetName} has PIDs but no valid structure - marked as corrupted`);
            } else if (hasPIDsInSheet && hasValidStructureInSheet) {
              // Additional check: ALL PIDs must have valid content, not just some
              if (validPIDsInSheet < totalPIDsInSheet) {
                sheetsWithStructureIssues.push(sheetName);
                console.log(`[DEBUG] ✗ Sheet ${sheetName} has ${validPIDsInSheet}/${totalPIDsInSheet} valid PIDs - marked as corrupted (not all PIDs have valid content)`);
              } else {
                console.log(`[DEBUG] ✓ Sheet ${sheetName} has valid structure (all ${validPIDsInSheet}/${totalPIDsInSheet} PIDs have valid content)`);
              }
            }

            // Only count sheets that have either valid data or at least a principle name
            if (rows.length > 0 || principleName) {
              sheetsWithValidData++;
            }

            // Set the summary justification for all rows
            if (sheetSummaryJustification || principleName) {
              // Since summaryJustification is associated with the entire sheet,
              // not individual rows, we'll add it to the sheet object directly
              sheets.push({
                name: sheetName,
                rows,
                summaryJustification: sheetSummaryJustification,
                principleName: principleName, // Include the principle name
              });
            } else {
              sheets.push({
                name: sheetName,
                rows,
                summaryJustification: '',
                principleName: '',
              });
            }

            console.log(`Found ${rows.length} valid rows in sheet ${sheetName}`);
          } catch (sheetError) {
            console.warn(`Error processing sheet ${worksheet.name}:`, sheetError);
            // Continue processing other sheets
          }
        });

        // Validate that we found meaningful data
        if (sheets.length === 0) {
          throw new ExcelFormatError('The Excel file contains no readable worksheets or data.');
        }

        console.log(`[DEBUG] Final validation: ${sheetsWithStructureIssues.length} sheets with structure issues`);
        console.log(`[DEBUG] Sheets with structure issues: ${sheetsWithStructureIssues.join(', ')}`);
        console.log(`[DEBUG] Total valid rows: ${totalValidRows}`);
        console.log(`[DEBUG] Sheets with valid data: ${sheetsWithValidData}`);

        // Check for structure issues - if any sheets have PIDs but no valid structure, fail
        if (sheetsWithStructureIssues.length > 0) {
          throw new ExcelFormatError(`The Excel file has corrupted structure in the following sheets: ${sheetsWithStructureIssues.join(', ')}. These sheets are missing required default content in Process, Metric, or Process Checks columns. Please ensure all sheets follow the correct template structure with proper descriptive content.`);
        }

        if (totalValidRows === 0) {
          throw new ExcelFormatError('No valid checklist data found in the Excel file. Please ensure the file contains properly formatted checklist data with valid PID numbers (e.g., 9.1.1, 9.2.1) and complete structure with meaningful default content in Process, Metric, and Process Checks columns.');
        }

        if (sheetsWithValidData === 0) {
          throw new ExcelFormatError('The Excel file does not contain any recognizable checklist structure. Please ensure the file follows the required format with proper column structure (PID, Process, Metric, Process Checks, Completed, Elaboration) and meaningful default content.');
        }

        // Additional validation: check if file seems corrupted based on data patterns
        const averageRowsPerSheet = totalValidRows / sheetsWithValidData;
        if (averageRowsPerSheet < 1 && sheetsWithValidData > 1) {
          console.warn('Suspicious data pattern detected - very few rows per sheet');
          // Don't fail here, but log for debugging
        }

        const result = { sheets };
        console.log(`Converted Excel to JSON with ${sheets.length} sheets and ${totalValidRows} total valid rows`);
        resolve(result);
      } catch (error) {
        console.error('Error converting Excel to JSON:', error);
        
        // Re-throw custom errors as-is
        if (error instanceof ExcelFileError) {
          reject(error);
        } else {
          // Convert unknown errors to user-friendly messages
          reject(new ExcelCorruptedError());
        }
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new ExcelFormatError('Failed to read the Excel file. The file may be corrupted or in an unsupported format.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get MDX Bundle using fetch API directly and execute it to extract functions
 */
async function getMDXBundle(gid: string): Promise<MdxBundle> {
  const cid = EXPORT_PROCESS_CHECKLISTS_CID;

  try {
    const apiUrl = `/api/plugins/${gid}/summary/${cid}`;
    console.log(`Fetching MDX bundle from: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch MDX summary bundle (${response.status} ${response.statusText})`
      );
    }

    const rawBundle = await response.json();
    console.log('Raw MDX bundle received:', Object.keys(rawBundle));

    // Check if we received a compiled MDX bundle with code and frontmatter
    if (rawBundle.code) {
      console.log('Executing MDX bundle code to extract functions');
      try {
        // Execute the MDX bundle to get the exported functions
        const executedBundle = executeMDXBundle(rawBundle);
        console.log('Executed bundle keys:', Object.keys(executedBundle));

        // Get all functions from the executed bundle
        const availableFunctions = Object.keys(executedBundle).filter(
          (key) => typeof executedBundle[key] === 'function'
        );

        console.log('Available functions after execution:', availableFunctions);
        return executedBundle as MdxBundle;
      } catch (error) {
        console.error('Error executing MDX bundle:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown error executing MDX bundle';
        throw new Error(`Failed to execute MDX bundle: ${errorMessage}`);
      }
    } else {
      // If we didn't get a code/frontmatter bundle, assume it's already the exported functions
      const availableFunctions = Object.keys(rawBundle).filter(
        (key) => typeof rawBundle[key] === 'function'
      );
      console.log('Available functions in raw bundle:', availableFunctions);
      return rawBundle as MdxBundle;
    }
  } catch (error) {
    console.error('Error fetching or processing MDX summary bundle:', error);
    throw error;
  }
}

export const excelToJson = async (
  file: File,
  groupName: string,
  gid: string
): Promise<{
  submissions: ChecklistSubmission[];
  unmatchedSheets: string[];
}> => {
  try {
    // Convert the Excel file to a JSON structure
    console.log(`Step 1: Converting Excel file "${file.name}" to JSON`);
    const jsonData = await convertExcelToJson(file);
    console.log('Excel converted to JSON format successfully');

    // Fetch the MDX bundle containing the import functions
    console.log('Step 2: Fetching MDX bundle with conversion functions');
    const mdxBundle = await getMDXBundle(gid);

    // Try to find and use one of the import functions
    console.log('Step 3: Looking for a suitable import function');

    // Check for newer function names first, then fall back to legacy names
    let importFunctionName: string | null = null;
    let importJsonFn: ImportFunction | null = null;

    if (mdxBundle.mdxImportJson) {
      importFunctionName = 'mdxImportJson';
      importJsonFn = mdxBundle.mdxImportJson;
    } else if (mdxBundle.importJson) {
      importFunctionName = 'importJson';
      importJsonFn = mdxBundle.importJson;
    }

    if (!importFunctionName || !importJsonFn) {
      console.error(
        'Available properties in MDX bundle:',
        Object.keys(mdxBundle)
      );
      throw new ExcelFormatError('Unable to process Excel file: Missing required conversion functions. Please contact support.');
    }

    console.log(`Found function "${importFunctionName}" in MDX bundle`);

    // Use the import function to convert the JSON data into checklist submissions
    console.log(`Step 4: Converting JSON data using ${importFunctionName}`);
    const result = importJsonFn(jsonData, groupName);

    // Handle both new and old return types
    let submissions: ChecklistSubmission[] = [];
    let unmatchedSheets: string[] = [];

    if (Array.isArray(result)) {
      // Old return type (just array of submissions)
      submissions = result;
    } else if (result && typeof result === 'object') {
      // New return type (object with submissions and unmatchedSheets)
      submissions = result.submissions || [];
      unmatchedSheets = result.unmatchedSheets || [];
    }

    // Strict validation of submissions
    if (!submissions || submissions.length === 0) {
      console.warn('No submissions were created from the import function');
      throw new ExcelFormatError('No valid checklist data found in the Excel file. Please ensure the file contains properly formatted checklist data.');
    }

    // Additional validation: check if submissions contain meaningful data
    const validSubmissions = submissions.filter(submission => {
      // Check if submission has required properties
      if (!submission.cid || !submission.gid || !submission.data) {
        return false;
      }
      
      // Check if data object has any meaningful content
      const dataKeys = Object.keys(submission.data);
      if (dataKeys.length === 0) {
        return false;
      }
      
      // Check if at least some data values are not empty
      const hasContent = dataKeys.some(key => {
        const value = submission.data[key];
        return value && typeof value === 'string' && value.trim().length > 0;
      });
      
      return hasContent;
    });

    if (validSubmissions.length === 0) {
      throw new ExcelFormatError('The Excel file appears to be a template that has not been filled in yet. Please ensure the file contains completed checklist information (completed, elaboration, or justification fields) before uploading.');
    }

    if (validSubmissions.length < submissions.length) {
      console.warn(`${submissions.length - validSubmissions.length} submissions were filtered out due to missing or empty data`);
      submissions = validSubmissions;
    }

    console.log(`Successfully created ${submissions.length} valid submissions`);

    if (unmatchedSheets && unmatchedSheets.length > 0) {
      console.warn(
        `Found ${unmatchedSheets.length} unmatched sheets: ${unmatchedSheets.join(', ')}`
      );
    }

    // Final validation before returning - ensure we have quality checklist data
    if (submissions.length === 0) {
      throw new ExcelFormatError('No checklist submissions were created from the Excel file. This may be an unfilled template or the file may not contain the expected checklist structure.');
    }

    // Validate that submissions look like actual checklist data
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      
      if (!submission.cid || !submission.gid || !submission.data) {
        throw new ExcelFormatError(`Submission ${i + 1} is missing required fields. The Excel file may be corrupted or in wrong format.`);
      }

      // Check for checklist-like data patterns to ensure it's actually a checklist
      const dataKeys = Object.keys(submission.data);
      const checklistIndicators = dataKeys.filter(key => {
        const keyLower = key.toLowerCase();
        return keyLower.includes('completed') || 
               keyLower.includes('elaboration') || 
               keyLower.includes('justification') ||
               keyLower.includes('response') ||
               keyLower.includes('answer') ||
               keyLower.includes('pid');
      });

      // If we have no checklist-like patterns at all, this might be corrupted data
      if (checklistIndicators.length === 0) {
        throw new ExcelFormatError(`Submission ${i + 1} does not appear to contain valid checklist data. The Excel file may be corrupted or in the wrong format.`);
      }

      // Check for checklist-like data patterns
      const hasAnyContent = dataKeys.some(key => {
        const value = submission.data[key];
        return value && typeof value === 'string' && value.trim().length > 0;
      });

      if (!hasAnyContent) {
        throw new ExcelFormatError(`Submission ${i + 1} contains no meaningful content. The Excel file may be corrupted or empty.`);
      }
    }

    console.log(`Final validation passed: ${submissions.length} valid submissions ready for upload`);

    return { submissions, unmatchedSheets };
  } catch (error) {
    console.error('Error in excelToJson:', error);
    
    // Re-throw custom errors as-is for user-friendly messages
    if (error instanceof ExcelFileError) {
      throw error;
    }
    
    // Handle network/API errors (fetch rejections)
    if (error instanceof Error && error.message.includes('Network error')) {
      throw new ExcelFormatError('Unable to process Excel file: Network error. Please check your connection and try again.');
    }
    
    // Handle fetch response errors (non-ok responses)
    if (error instanceof Error && error.message.includes('Failed to fetch MDX summary bundle')) {
      throw new ExcelFormatError('An unexpected error occurred while processing the Excel file. Please try again or contact support if the problem persists.');
    }
    
    // Handle MDX bundle errors
    if (error instanceof Error && error.message.includes('MDX')) {
      throw new ExcelFormatError('Unable to process Excel file: Configuration error. Please contact support.');
    }
    
    // Convert any other unknown errors to user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error:', errorMessage);
    throw new ExcelFormatError('An unexpected error occurred while processing the Excel file. Please try again or contact support if the problem persists.');
  }
};
