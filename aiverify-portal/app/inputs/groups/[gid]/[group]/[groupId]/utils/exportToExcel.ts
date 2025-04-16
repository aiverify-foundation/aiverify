/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs';
import { InputBlockGroupData } from '@/app/types';

export type WorksheetDataType = {
  [key: string]: string | number | Date;
};

const configFileNameMapping: Record<string, string> = {
  transparency_process_checklist: 'config_transparency',
  explainability_process_checklist: 'config_explainability',
  reproducibility_process_checklist: 'config_reproducibility',
  safety_process_checklist: 'config_safety',
  security_process_checklist: 'config_security',
  robustness_process_checklist: 'config_robustness',
  fairness_process_checklist: 'config_fairness',
  data_governance_process_checklist: 'config_data_governance',
  accountability_process_checklist: 'config_accountability',
  human_agency_oversight_process_checklist: 'config_human_agency_oversight',
  inclusive_growth_process_checklist: 'config_inclusive_growth_soc_env',
  organisational_considerations_process_checklist:
    'config_organisational_considerations',
};

// Helper function to safely convert any value to string
function safeToString(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

export async function exportToExcel(
  groupName: string,
  // checklists: any[],
  groupData: InputBlockGroupData,
  configFiles: Record<string, any>
) {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Checklist App';
  workbook.lastModifiedBy = 'Checklist App';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Process each checklist
  groupData.input_blocks.forEach((ib) => {
    const configFileName = configFileNameMapping[ib.cid];

    if (!configFileName) {
      console.error(`Config file mapping not found for ${ib.cid}`);
      return; // Skip this checklist
    }

    const configFileContent = configFiles[configFileName];

    if (!configFileContent) {
      console.error(`Config file not found for ${configFileName}`);
      return; // Skip this checklist
    }

    try {
      // Parse the config file content if it's a string
      const config =
        typeof configFileContent === 'string'
          ? JSON.parse(configFileContent)
          : configFileContent;

      // Validate the config object
      if (!config || typeof config !== 'object') {
        throw new Error(`Invalid config file content for ${configFileName}`);
      }

      // Ensure required fields exist
      const validatedConfig = {
        principle: config.principle || 'Unknown Principle',
        description: config.description || 'No description available',
        sections: config.sections || [],
      };

      // Create worksheet (limit name to 31 characters for Excel compatibility)
      const worksheet = workbook.addWorksheet(
        ib.name.replace(/Process Checklist$/, '').substring(0, 31)
      );

      // Set column widths
      worksheet.columns = [
        { key: 'pid', width: 10 },
        { key: 'process', width: 40 },
        { key: 'metric', width: 20 },
        { key: 'processChecks', width: 50 },
        { key: 'completed', width: 20 },
        { key: 'elaboration', width: 40 },
      ];

      // Define styles
      const styles = {
        title: {
          font: { bold: true, size: 12, color: { argb: 'FF000000' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6D9EEB' }, // #6d9eeb
          },
          alignment: {
            horizontal: 'left',
            vertical: 'middle',
            wrapText: true,
          },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        description: {
          font: { bold: false, size: 12, color: { argb: 'FF000000' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E6FC' }, //d9e6fc
          },
          alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        sectionHeader: {
          font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' },
          },
          alignment: {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        testableCriteriaHeader: {
          font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6D9EEB' },
          },
          alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        testableCriteriaContent: {
          font: { size: 10, color: { argb: 'FF000000' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFA4C2F4' }, //a4c2f4
          },
          alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        processHeader: {
          font: { bold: true, size: 10, color: { argb: 'FF000000' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC9DAF8' }, // c9daf8
          },
          alignment: {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        evenRow: {
          font: { size: 10, color: { argb: 'FF000000' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
          },
          alignment: { vertical: 'top', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
        oddRow: {
          font: { size: 10, color: { argb: 'FF000000' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' },
          },
          alignment: { vertical: 'top', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          },
        },
      };

      // Add title row with principle name
      const titleRow = worksheet.addRow([
        validatedConfig.principle.toUpperCase(),
      ]);
      titleRow.height = 30;
      // Merge cells for title
      worksheet.mergeCells('A1:F1');
      // Apply style to title row
      applyStyleToRow(titleRow, styles.title);

      // Add description row
      const descRow = worksheet.addRow([validatedConfig.description]);
      descRow.height = 60;
      // Merge cells for description
      worksheet.mergeCells('A2:F2');
      // Apply style to description row
      applyStyleToRow(descRow, styles.description);

      // Add Process Checklist header
      const headerRow = worksheet.addRow(['Process Checklist']);
      // Merge cells for header
      worksheet.mergeCells('A3:F3');
      // Apply style to header row
      applyStyleToRow(headerRow, styles.sectionHeader);

      let rowIndex = 4;

      // Iterate through the sections and processes in the config
      validatedConfig.sections.forEach((section: any) => {
        section.checklist.forEach((check: any) => {
          // Add Testable Criteria row
          const criteriaHeaderRow = worksheet.addRow(['Testable Criteria']);
          // Merge cells for testable criteria header
          worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
          // Apply style to testable criteria header row
          applyStyleToRow(criteriaHeaderRow, styles.testableCriteriaHeader);
          rowIndex++;

          // Add the testable criteria content
          const criteriaContentRow = worksheet.addRow([check.testableCriteria]);
          // Merge cells for testable criteria content
          worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
          criteriaContentRow.height = calculateRowHeight(
            check.testableCriteria
          );
          // Apply style to testable criteria content row
          applyStyleToRow(criteriaContentRow, styles.testableCriteriaContent);
          rowIndex++;

          // Add header row for the processes
          const processHeaderRow = worksheet.addRow([
            'pid',
            'Process',
            'Metric',
            'Process Checks',
            'Process Checks Completed\n(Yes / No / Not Applicable)',
            'Elaboration\n- If Yes, describe how it is implemented / documented (where applicable).\n- If No, state the reason(s) why it is not implemented.\n- If Not applicable, state reason(s).',
          ]);
          // Apply style to process header row
          applyStyleToRow(processHeaderRow, styles.processHeader);
          rowIndex++;

          // Add process rows
          let processRowCount = 0;
          check.processes.forEach((process: any) => {
            const pid = process.pid;
            const completedKey = `completed-${pid}`;
            const elaborationKey = `elaboration-${pid}`;

            const completedValue = ib.data[completedKey] || '';
            const elaborationValue = ib.data[elaborationKey] || '';

            // Replace <br> tags with newlines - safely convert to string first
            const formattedCompletedValue = safeToString(
              completedValue
            ).replace(/<br\s*\/?>/g, '\n');
            const formattedElaborationValue = safeToString(
              elaborationValue
            ).replace(/<br\s*\/?>/g, '\n');

            const processRow = worksheet.addRow([
              pid,
              process.process,
              process.metric,
              process.processChecks,
              formattedCompletedValue,
              formattedElaborationValue,
            ]);

            // Calculate appropriate row height based on content
            processRow.height = Math.max(
              calculateRowHeight(process.process),
              calculateRowHeight(process.processChecks),
              calculateRowHeight(formattedElaborationValue)
            );
            // Apply alternating row styles
            const style =
              processRowCount % 2 === 0 ? styles.evenRow : styles.oddRow;
            applyStyleToRow(processRow, style);
            processRowCount++;
            rowIndex++;
          });
        });
      });

      // Add summary justification header row
      const summaryHeaderRow = worksheet.addRow(['Summary Justification']);
      // Merge cells for summary justification header
      worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      // Apply style to summary justification header row
      applyStyleToRow(summaryHeaderRow, styles.sectionHeader);
      rowIndex++;

      // Add the summary justification content
      const summaryKey = `summary-justification-${validatedConfig.principle}`;
      // Get summary from checklist data
      const summaryValue = ib.data[summaryKey] || '';
      const summaryRow = worksheet.addRow([summaryValue]);
      // Merge cells for testable criteria content
      worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      // Safely convert summaryValue to string for calculating row height
      summaryRow.height = calculateRowHeight(safeToString(summaryValue));
      // Apply style to testable criteria content row
      applyStyleToRow(summaryRow, styles.oddRow);
      rowIndex++;
    } catch (error) {
      console.error(`Error processing checklist ${ib.name}:`, error);
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
  a.download = `${groupName}_checklists.xlsx`;
  document.body.appendChild(a);
  a.click();

  // Clean up
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Helper function to apply style to an entire row
function applyStyleToRow(row: ExcelJS.Row, style: any) {
  row.eachCell((cell) => {
    cell.font = style.font;
    cell.fill = style.fill;
    cell.alignment = style.alignment;
    cell.border = style.border;
  });
}

// Helper function to calculate row height based on content
function calculateRowHeight(content: string): number {
  if (!content) return 20; // Default height

  const lineCount = (content.match(/\n/g) || []).length + 1;
  const charCount = content.length;

  // Base height calculation
  if (charCount > 300) return 120;
  if (charCount > 200) return 100;
  if (charCount > 100) return 80;
  if (charCount > 50) return 60;
  if (lineCount > 3) return 60;
  if (lineCount > 1) return 40;

  return 20; // Default height
}
