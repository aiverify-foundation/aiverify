// Export function for use in MDX files
export async function prepareChecklistExportData(
  groupName,
  checklists,
  configFiles
) {
  if (!groupName || !checklists || !configFiles) {
    console.error("Missing required parameters for export data preparation");
    return null;
  }

  try {
    // Create a data structure to hold the formatted checklist data
    const formattedChecklistData = [];

    // Sort checklists based on groupNumber from their meta.json files
    const sortedChecklists = [...checklists].sort((a, b) => {
      try {
        // Extract the base key (without _process_checklist suffix)
        const keyA = a.cid.replace("_process_checklist", "");
        const keyB = b.cid.replace("_process_checklist", "");

        // Determine the meta file paths
        // The only special case is for inclusive_growth, which needs a different meta file
        let metaFileA, metaFileB;

        metaFileA = require(`./${keyA}_process_checklist.meta.json`);
        metaFileB = require(`./${keyB}_process_checklist.meta.json`);

        // Extract groupNumber from meta files or use default values
        const groupNumberA = metaFileA.groupNumber || 999;
        const groupNumberB = metaFileB.groupNumber || 999;

        return groupNumberA - groupNumberB;
      } catch (error) {
        console.error("Error sorting checklists by groupNumber:", error);
        return 0; // Keep original order if there's an error
      }
    });

    // Define Excel styles
    const excelStyles = {
      title: {
        font: { bold: true, size: 12, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF6D9EEB" }, // #6d9eeb
        },
        alignment: {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      description: {
        font: { bold: false, size: 12, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E6FC" }, //d9e6fc
        },
        alignment: {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      sectionHeader: {
        font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF000000" },
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      testableCriteriaHeader: {
        font: { bold: true, size: 10, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF6D9EEB" },
        },
        alignment: {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      testableCriteriaContent: {
        font: { size: 10, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFA4C2F4" }, //a4c2f4
        },
        alignment: {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      processHeader: {
        font: { bold: true, size: 10, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC9DAF8" }, // c9daf8
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      evenRow: {
        font: { size: 10, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E1F2" },
        },
        alignment: { vertical: "top", wrapText: true },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
      oddRow: {
        font: { size: 10, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        },
        alignment: { vertical: "top", wrapText: true },
        border: {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        },
      },
    };

    // Column definitions for Excel
    const columns = [
      { key: "pid", width: 10 },
      { key: "process", width: 40 },
      { key: "metric", width: 20 },
      { key: "processChecks", width: 50 },
      { key: "completed", width: 20 },
      { key: "elaboration", width: 40 },
    ];

    // Sheets configuration - complete instructions for building Excel sheets
    const sheets = [];

    // Helper function to replace <br> tags with newlines for all text content
    const replaceBreakTags = (text) => {
      return typeof text === "string"
        ? text.replace(/<br\s*\/?>/g, "\n")
        : text;
    };

    // Process each checklist to create a worksheet configuration
    sortedChecklists.forEach((checklist) => {
      // Get the config key from the checklist ID
      const key = checklist.cid.replace("_process_checklist", "");

      // Special case for inclusive_growth - needs different config file name
      const configKey =
        key === "inclusive_growth"
          ? "config_inclusive_growth_soc_env"
          : `config_${key}`;

      // Get the config file content
      const configFileContent = configFiles[configKey];

      if (!configFileContent) {
        console.error(`Config file not found for ${configKey}`);
        return; // Skip this checklist
      }

      try {
        // Parse the config file content if it's a string
        const config =
          typeof configFileContent === "string"
            ? JSON.parse(configFileContent)
            : configFileContent;

        // Validate the config object
        if (!config || typeof config !== "object") {
          throw new Error(`Invalid config file content for ${configKey}`);
        }

        // Ensure required fields exist and format any text content
        const validatedConfig = {
          principle: replaceBreakTags(config.principle) || "Unknown Principle",
          description:
            replaceBreakTags(config.description) || "No description available",
          sections: config.sections || [],
        };

        // Create a sheet configuration object
        const sheetConfig = {
          name: checklist.name
            .replace(/Process Checklist$/, "")
            .substring(0, 31), // Excel limits worksheet names to 31 chars
          columns: columns,
          rows: [],
        };

        // Add title row
        sheetConfig.rows.push({
          cells: [
            { value: validatedConfig.principle.toUpperCase(), style: "title" },
          ],
          height: 30,
          mergedCells: "A1:F1",
        });

        // Add description row
        sheetConfig.rows.push({
          cells: [{ value: validatedConfig.description, style: "description" }],
          height: 60,
          mergedCells: "A2:F2",
        });

        // Add Process Checklist header
        sheetConfig.rows.push({
          cells: [{ value: "Process Checklist", style: "sectionHeader" }],
          mergedCells: "A3:F3",
        });

        // Iterate through the sections and processes in the config
        validatedConfig.sections.forEach((section) => {
          section.checklist.forEach((check) => {
            // Format testable criteria
            const formattedTestableCriteria = replaceBreakTags(
              check.testableCriteria
            );

            // Add Testable Criteria header row
            sheetConfig.rows.push({
              cells: [
                { value: "Testable Criteria", style: "testableCriteriaHeader" },
              ],
              mergedCells: `A${sheetConfig.rows.length + 1}:F${
                sheetConfig.rows.length + 1
              }`,
            });

            // Add testable criteria content row
            sheetConfig.rows.push({
              cells: [
                {
                  value: formattedTestableCriteria,
                  style: "testableCriteriaContent",
                },
              ],
              height: calculateRowHeight(formattedTestableCriteria),
              mergedCells: `A${sheetConfig.rows.length + 1}:F${
                sheetConfig.rows.length + 1
              }`,
            });

            // Add header row for processes
            sheetConfig.rows.push({
              cells: [
                { value: "pid", style: "processHeader" },
                { value: "Process", style: "processHeader" },
                { value: "Metric", style: "processHeader" },
                { value: "Process Checks", style: "processHeader" },
                {
                  value:
                    "Process Checks Completed\n(Yes / No / Not Applicable)",
                  style: "processHeader",
                },
                {
                  value:
                    "Elaboration\n- If Yes, describe how it is implemented / documented (where applicable).\n- If No, state the reason(s) why it is not implemented.\n- If Not applicable, state reason(s).",
                  style: "processHeader",
                },
              ],
            });

            // Add process rows
            let processRowCount = 0;
            check.processes.forEach((process) => {
              const pid = process.pid;
              const completedKey = `completed-${pid}`;
              const elaborationKey = `elaboration-${pid}`;

              const completedValue = checklist.data[completedKey] || "";
              const elaborationValue = checklist.data[elaborationKey] || "";

              // Replace <br> tags with newlines for all text content
              const formattedCompletedValue = replaceBreakTags(completedValue);
              const formattedElaborationValue =
                replaceBreakTags(elaborationValue);

              // Also format the process and processChecks from the config
              const formattedProcess = replaceBreakTags(process.process);
              const formattedProcessChecks = replaceBreakTags(
                process.processChecks
              );

              // Calculate height
              const rowHeight = Math.max(
                calculateRowHeight(formattedProcess),
                calculateRowHeight(formattedProcessChecks),
                calculateRowHeight(formattedElaborationValue)
              );

              // Determine style for alternating rows
              const rowStyle = processRowCount % 2 === 0 ? "evenRow" : "oddRow";

              // Add the process row
              sheetConfig.rows.push({
                cells: [
                  { value: pid, style: rowStyle },
                  { value: formattedProcess, style: rowStyle },
                  { value: process.metric, style: rowStyle },
                  { value: formattedProcessChecks, style: rowStyle },
                  { value: formattedCompletedValue, style: rowStyle },
                  { value: formattedElaborationValue, style: rowStyle },
                ],
                height: rowHeight,
              });

              processRowCount++;
            });
          });
        });

        // Add summary justification header
        sheetConfig.rows.push({
          cells: [{ value: "Summary Justification", style: "sectionHeader" }],
          mergedCells: `A${sheetConfig.rows.length + 1}:F${
            sheetConfig.rows.length + 1
          }`,
        });

        // Add summary justification content - use the same principle name from config
        const summaryKey = `summary-justification-${validatedConfig.principle}`;
        const summaryValue = checklist.data[summaryKey] || "";
        const formattedSummaryValue = replaceBreakTags(summaryValue);

        sheetConfig.rows.push({
          cells: [{ value: formattedSummaryValue, style: "oddRow" }],
          height: calculateRowHeight(formattedSummaryValue),
          mergedCells: `A${sheetConfig.rows.length + 1}:F${
            sheetConfig.rows.length + 1
          }`,
        });

        // Add the sheet configuration to the sheets array
        sheets.push(sheetConfig);
      } catch (error) {
        console.error(`Error processing checklist ${checklist.name}:`, error);
      }
    });

    // Return a complete Excel workbook blueprint
    return {
      fileName: `${groupName}_checklists.xlsx`,
      creator: "AI Verify",
      lastModifiedBy: "AI Verify",
      created: new Date(),
      modified: new Date(),
      styles: excelStyles,
      sheets: sheets,
    };
  } catch (error) {
    console.error("Error during data preparation:", error);
    return null;
  }
}

// Helper function to calculate row height based on content length
function calculateRowHeight(content) {
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
