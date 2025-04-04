import * as ExcelJS from 'exceljs';
import { executeMDXBundle } from '@/app/inputs/checklists/[groupId]/hooks/useMDXExecution';

interface ChecklistData {
  [key: string]: string; // e.g., "completed-9.1.1": "Yes", "elaboration-9.1.1": "Some text"
}

interface ChecklistSubmission {
  gid: string; // Group ID, e.g., "aiverify.stock.process_checklist"
  cid: string; // Checklist ID, e.g., "accountability_process_checklist"
  name: string; // Checklist name, e.g., "Accountability Process Checklist"
  group: string; // Group name, e.g., "example_group"
  data: ChecklistData; // Data related to the checklist
}

interface ExcelRowData {
  pid: string;
  completed: string;
  elaboration: string;
}

interface ExcelSheetData {
  name: string;
  rows: ExcelRowData[];
}

interface ExcelJsonData {
  sheets: ExcelSheetData[];
}

// Keep import functions generic to accept any JSON structure
type ImportFunction = (
  jsonData: unknown,
  groupName: string
) => ChecklistSubmission[];

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

          // Process each row in the worksheet
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            // Skip header row
            if (rowNumber === 1) return;

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
              });
            }
          });

          console.log(`Found ${rows.length} valid rows in sheet ${sheetName}`);

          sheets.push({
            name: sheetName,
            rows,
          });
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
async function getMDXBundle(): Promise<MdxBundle> {
  // Note: The plugin ID uses a hyphen '-' not an underscore '_'
  const gid = 'aiverify.stock.process_checklist';
  const cid = 'export_process_checklists';

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
  groupName: string
): Promise<ChecklistSubmission[]> => {
  try {
    // Step 1: Convert the Excel file to a JSON structure
    console.log(`Step 1: Converting Excel file "${file.name}" to JSON`);
    const jsonData = await convertExcelToJson(file);
    console.log('Excel converted to JSON format successfully');

    // Step 2: Fetch the MDX bundle containing the import functions
    console.log('Step 2: Fetching MDX bundle with conversion functions');
    const mdxBundle = await getMDXBundle();

    // Step 3: Try to find and use one of the import functions
    console.log('Step 3: Looking for a suitable import function');

    // First try the new function names, then fall back to the old ones
    const importFunctionName = mdxBundle.mdxImportJson
      ? 'mdxImportJson'
      : mdxBundle.importJson
        ? 'importJson'
        : mdxBundle.mdxJsonToChecklistSubmissions
          ? 'mdxJsonToChecklistSubmissions'
          : mdxBundle.jsonToChecklistSubmissions
            ? 'jsonToChecklistSubmissions'
            : mdxBundle.mdxExtractChecklistData
              ? 'mdxExtractChecklistData'
              : mdxBundle.extractChecklistData
                ? 'extractChecklistData'
                : null;

    if (!importFunctionName) {
      console.error(
        'Available properties in MDX bundle:',
        Object.keys(mdxBundle)
      );
      throw new Error('No suitable import function found in MDX bundle');
    }

    console.log(`Found function "${importFunctionName}" in MDX bundle`);
    const importJsonFn = mdxBundle[importFunctionName] as ImportFunction;

    // Step 4: Use the import function to convert the JSON data into checklist submissions
    console.log(`Step 4: Converting JSON data using ${importFunctionName}`);
    const submissions = importJsonFn(jsonData, groupName);

    if (!submissions || submissions.length === 0) {
      console.warn('No submissions were created from the import function');
    } else {
      console.log(`Successfully created ${submissions.length} submissions`);
    }

    return submissions;
  } catch (error) {
    console.error('Error in excelToJson:', error);
    // No longer using fallback - just throw the error
    throw error;
  }
};
