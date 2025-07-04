import * as ExcelJS from 'exceljs';
import { InputBlockDataPayload } from '@/app/types';
import { executeMDXBundle } from '@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useMDXExecution';
import { EXPORT_PROCESS_CHECKLISTS_CID } from '@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useProcessChecklistExport';

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

// Function to convert Excel data to JSON format
async function convertExcelToJson(file: File): Promise<ExcelJsonData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheets: ExcelSheetData[] = [];

        workbook.eachSheet((worksheet) => {
          const sheetName = worksheet.name;
          console.log(`Processing sheet: ${sheetName}`);
          const rows: ExcelRowData[] = [];

          // Variable to store summary justification for the entire sheet
          let sheetSummaryJustification = '';
          let isSummarySection = false;

          // Extract the principle name from row 1 (title row - cells A-F merged)
          // This is in all uppercase text in the Excel file, we need to format it properly
          let principleName = '';
          if (worksheet.getRow(1).getCell(1).text) {
            const rawPrincipleName = worksheet.getRow(1).getCell(1).text.trim();

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

          // Process each row in the worksheet
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            // Skip header row but don't return - we still need to extract data from it
            if (rowNumber === 1) return;

            // Check if this is the summary justification section
            const firstCell = row.getCell(1).text;
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
              const summaryText = row.getCell(1).text;
              if (summaryText) {
                sheetSummaryJustification = summaryText;
              }
              return;
            }

            // Normal row processing for PIDs, completed, and elaboration
            const pid = row.getCell(1).text; // PID is in column A (first column)
            const completed = row.getCell(5).text; // "completed" is in column E (5th column)
            const elaboration = row.getCell(6).text; // "elaboration" is in column F (6th column)

            // Validate PID format (e.g., 9.1.1, 9.2.1, etc.)
            const pidRegex = /^\d+(\.\d+)+$/; // Matches patterns like 9.1.1, 9.2.1, etc.
            if (pid && pidRegex.test(pid)) {
              rows.push({
                pid,
                completed: completed || '',
                elaboration: elaboration || '',
                summaryJustification: '', // We'll set this for all rows from the sheet-level value
              });
            }
          });

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
        });

        const result = { sheets };
        console.log(`Converted Excel to JSON with ${sheets.length} sheets`);
        resolve(result);
      } catch (error) {
        console.error('Error converting Excel to JSON:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
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
      throw new Error('No suitable import function found in MDX bundle');
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

    if (!submissions || submissions.length === 0) {
      console.warn('No submissions were created from the import function');
    } else {
      console.log(`Successfully created ${submissions.length} submissions`);
    }

    if (unmatchedSheets && unmatchedSheets.length > 0) {
      console.warn(
        `Found ${unmatchedSheets.length} unmatched sheets: ${unmatchedSheets.join(', ')}`
      );
    }

    return { submissions, unmatchedSheets };
  } catch (error) {
    console.error('Error in excelToJson:', error);
    throw error;
  }
};
