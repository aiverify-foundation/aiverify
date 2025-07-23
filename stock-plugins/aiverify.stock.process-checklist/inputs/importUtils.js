/**
 * Mapping between checklist IDs and their display names
 */
const checklistMapping = {
  transparency_process_checklist: "Transparency",
  explainability_process_checklist: "Explainability",
  reproducibility_process_checklist: "Reproducibility",
  safety_process_checklist: "Safety",
  security_process_checklist: "Security",
  robustness_process_checklist: "Robustness",
  fairness_process_checklist: "Fairness",
  data_governance_process_checklist: "Data Governance",
  accountability_process_checklist: "Accountability",
  human_agency_oversight_process_checklist: "Human Agency & Oversight",
  inclusive_growth_process_checklist: "Inclusive Growth, Societal & Environmental Well-being",
  organisational_considerations_process_checklist:
    "Organisational Considerations",
};

/**
 * Reverses the checklistMapping object to map from display names to checklist IDs
 * @returns {Object} Reversed mapping where keys are display names and values are checklist IDs
 */
function getReverseChecklistMapping() {
  const reverseMapping = {};
  Object.keys(checklistMapping).forEach((key) => {
    reverseMapping[checklistMapping[key].trim().toLowerCase()] = key;
  });
  return reverseMapping;
}

/**
 * Validates if a string follows the PID format (e.g., 9.1.1, 9.2.1)
 * @param {string} pid - The PID string to validate
 * @returns {boolean} True if the PID is valid, false otherwise
 */
function isValidPid(pid) {
  if (!pid || typeof pid !== "string") return false;
  const pidRegex = /^\d+(\.\d+)+$/; // Matches patterns like 9.1.1, 9.2.1, etc.
  return pidRegex.test(pid);
}

/**
 * Validates and normalizes the completed field value
 * @param {string} value - The value to validate and normalize
 * @returns {string} The normalized value or empty string if invalid
 */
function validateAndNormalizeCompletedValue(value) {
  if (!value || typeof value !== "string") return "";

  // Convert to lowercase for case-insensitive comparison
  const lowerValue = value.trim().toLowerCase();

  // Map for valid values and their normalized forms
  const validValueMap = {
    yes: "Yes",
    no: "No",
    "not applicable": "Not Applicable",
    na: "Not Applicable",
    "n.a": "Not Applicable",
    "n.a.": "Not Applicable",
  };

  return validValueMap[lowerValue] || "";
}

/**
 * Helper function to format a principle name to Title Case (first letter of each word capitalized)
 * @param {string} principle - The principle name to format
 * @returns {string} The formatted principle name
 */
function formatPrincipleName(principle) {
  // Handle special formatting for multi-word principles
  return principle
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Helper function to find a match for a sheet name in the checklist mapping
 * Performs exact matching first, then partial matching for truncated names
 * @param {string} sheetName - The sheet name to find a match for
 * @param {Object} reverseMapping - The reverse mapping of display names to CIDs
 * @returns {string|null} The matching CID or null if no match found
 */
function findBestCidMatch(sheetName, reverseMapping) {
  const normalizedSheetName = sheetName.trim().toLowerCase();
  
  // First try exact match (case-insensitive)
  const exactMatch = reverseMapping[normalizedSheetName];
  if (exactMatch) {
    return exactMatch;
  }

  // For truncated sheet names, try partial matching
  // This is particularly useful for long names like "Inclusive Growth, Societal & Environmental Well-being"
  // which might be truncated to "Inclusive Growth, Societal & En" due to Excel's 31-character limit
  for (const [displayName, cid] of Object.entries(reverseMapping)) {
    const normalizedDisplayName = displayName.toLowerCase();
    
    // Check if the sheet name starts with the display name (for truncated cases)
    // or if the display name starts with the sheet name (for abbreviated cases)
    if (normalizedSheetName.startsWith(normalizedDisplayName.substring(0, Math.min(normalizedDisplayName.length, 25))) ||
        normalizedDisplayName.startsWith(normalizedSheetName.substring(0, Math.min(normalizedSheetName.length, 25)))) {
      // Additional validation: ensure it's a reasonable match (at least 10 characters match)
      const minLength = Math.min(normalizedSheetName.length, normalizedDisplayName.length);
      if (minLength >= 10) {
        const commonPrefix = normalizedSheetName.substring(0, minLength);
        const displayPrefix = normalizedDisplayName.substring(0, minLength);
        if (commonPrefix === displayPrefix) {
          return cid;
        }
      }
    }
  }

  // No match found
  return null;
}

/**
 * Converts JSON data from an uploaded file into the format expected by the API gateway
 * @param {Object} jsonData - JSON data from an uploaded file
 * @param {string} groupName - The group name to associate with the checklists
 * @returns {Object} Object containing submissions array and unmatchedSheets array
 */
export function jsonToChecklistSubmissions(jsonData, groupName) {
  if (!jsonData || !Array.isArray(jsonData.sheets) || !groupName) {
    console.error("Invalid JSON data or missing group name");
    return { submissions: [], unmatchedSheets: [] };
  }

  const reverseMapping = getReverseChecklistMapping();
  const submissions = [];
  const unmatchedSheets = [];

  // Process each sheet in the JSON data
  jsonData.sheets.forEach((sheet) => {
    // Try to find a match for this sheet name (exact match only)
    const cid = findBestCidMatch(sheet.name, reverseMapping);

    if (!cid) {
      console.warn(
        `No exact match found for sheet name: "${sheet.name}". Sheet names must match principle names exactly (case-insensitive).`
      );
      unmatchedSheets.push(sheet.name);
      return; // Skip this sheet
    }

    // Extract principle name from cid (e.g., "transparency" from "transparency_process_checklist")
    // This is a fallback in case the principleName is not extracted from the Excel file
    const principle = cid.replace("_process_checklist", "");

    // Use the extracted principle name if available, otherwise format the principle from CID
    const principleForSummary = sheet.principleName
      ? sheet.principleName // Use the already formatted principle name from the Excel
      : formatPrincipleName(principle); // Format the principle name from CID

    // Use the principle name for the summary justification key
    const summaryKey = `summary-justification-${principleForSummary}`;

    const checklistData = {};

    // Process each row in the sheet
    sheet.rows.forEach((row) => {
      const pid = row.pid;
      const completed = row.completed;
      const elaboration = row.elaboration;

      if (isValidPid(pid)) {
        // Validate and normalize the completed value
        if (completed !== undefined) {
          const normalizedCompleted =
            validateAndNormalizeCompletedValue(completed);
          checklistData[`completed-${pid}`] = normalizedCompleted;
        }

        if (elaboration !== undefined) {
          checklistData[`elaboration-${pid}`] = elaboration || "";
        }
      }
    });

    // Add the summary justification from the sheet level property
    if (sheet.summaryJustification) {
      checklistData[summaryKey] = sheet.summaryJustification;
    }

    // Ensure the name includes "Process Checklist"
    let displayName = sheet.name;
    if (!displayName.toLowerCase().includes("process checklist")) {
      displayName = `${displayName} Process Checklist`;
    }

    submissions.push({
      gid: "aiverify.stock.process_checklist",
      cid,
      name: displayName,
      group: groupName,
      data: checklistData,
    });
  });

  // Log a summary of any unmatched sheets
  if (unmatchedSheets.length > 0) {
    console.warn(
      `Warning: Could not process ${
        unmatchedSheets.length
      } sheets because their names did not exactly match any principle name: ${unmatchedSheets.join(
        ", "
      )}. Sheet names must exactly match one of: ${Object.values(
        checklistMapping
      ).join(", ")} (case-insensitive).`
    );
  }

  return { submissions, unmatchedSheets };
}

/**
 * Extracts checklist data from a more general JSON format
 * This function is designed to be flexible and handle various JSON structures
 * @param {Object|Array} jsonData - JSON data that might contain checklist information
 * @param {string} groupName - The group name to associate with the checklists
 * @returns {Object} Object containing submissions array and unmatchedSheets array
 */
export function extractChecklistData(jsonData, groupName) {
  // If the JSON is already in the expected format with sheets property
  if (jsonData && jsonData.sheets) {
    return jsonToChecklistSubmissions(jsonData, groupName);
  }

  // If we have an array of objects directly (perhaps from Excel conversion)
  if (Array.isArray(jsonData)) {
    // Try to organize by sheet/tab name if that information is available
    const sheetMap = {};

    jsonData.forEach((item) => {
      if (item.sheetName) {
        // If we have sheet name information
        if (!sheetMap[item.sheetName]) {
          sheetMap[item.sheetName] = [];
        }
        sheetMap[item.sheetName].push(item);
      } else if (
        item.pid &&
        (item.completed !== undefined ||
          item.elaboration !== undefined ||
          item.summaryJustification !== undefined)
      ) {
        // If we have PID and either completed, elaboration, or summaryJustification fields directly
        // Make an assumption about which checklist it belongs to based on PID prefix
        // This is a fallback approach and may need customization based on your data structure
        const sheetName = guessSheetNameFromPid(item.pid);
        if (!sheetMap[sheetName]) {
          sheetMap[sheetName] = [];
        }
        sheetMap[item.sheetName].push(item);
      }
    });

    // Convert our grouped data to the expected format
    const formattedData = {
      sheets: Object.keys(sheetMap).map((sheetName) => ({
        name: sheetName,
        rows: sheetMap[sheetName],
      })),
    };

    return jsonToChecklistSubmissions(formattedData, groupName);
  }

  // If we have a more complex object structure, try to extract what we need
  const submissions = [];
  const reverseMapping = getReverseChecklistMapping();

  // Check if the object has properties that match checklist names
  Object.keys(jsonData).forEach((key) => {
    const lowerKey = key.trim().toLowerCase();
    let cid = reverseMapping[lowerKey];

    // If the key itself isn't a checklist name, check if it contains checklist data
    if (!cid && typeof jsonData[key] === "object") {
      // Try to determine which checklist this data belongs to
      for (const checklistName of Object.values(checklistMapping)) {
        if (key.toLowerCase().includes(checklistName.toLowerCase())) {
          cid = Object.keys(checklistMapping).find(
            (k) =>
              checklistMapping[k].toLowerCase() === checklistName.toLowerCase()
          );
          break;
        }
      }

      if (cid) {
        const checklistData = {};

        // Extract principle name from cid
        const principle = cid.replace("_process_checklist", "");

        // Process the object to extract PID, completed, elaboration, and summary-justification data
        extractChecklistItemsFromObject(
          jsonData[key],
          checklistData,
          principle
        );

        if (Object.keys(checklistData).length > 0) {
          // Get the display name from the checklistMapping
          let displayName = checklistMapping[cid];

          // Ensure the name includes "Process Checklist"
          if (!displayName.toLowerCase().includes("process checklist")) {
            displayName = `${displayName} Process Checklist`;
          }

          submissions.push({
            gid: "aiverify.stock.process_checklist",
            cid,
            name: displayName,
            group: groupName,
            data: checklistData,
          });
        }
      }
    }
  });

  // Return empty arrays if no other extraction method worked
  return { submissions: [], unmatchedSheets: [] };
}

/**
 * Helper function to recursively extract checklist items from a complex object
 * @param {Object} obj - Object that might contain checklist data
 * @param {Object} checklistData - Object to populate with extracted data
 * @param {string} principle - The principle name for summary-justification field
 */
function extractChecklistItemsFromObject(obj, checklistData, principle) {
  if (!obj || typeof obj !== "object") return;

  // Format the principle name to Title Case (first letter of each word capitalized)
  const formattedPrinciple = formatPrincipleName(principle);

  // Use the formatted principle name for the summary justification key
  const summaryKey = `summary-justification-${formattedPrinciple}`;

  // Check if this object directly has pid, completed, elaboration, and summaryJustification properties
  if (obj.pid && isValidPid(obj.pid)) {
    if (obj.completed !== undefined) {
      const normalizedCompleted = validateAndNormalizeCompletedValue(
        obj.completed
      );
      checklistData[`completed-${obj.pid}`] = normalizedCompleted;
    }
    if (obj.elaboration !== undefined) {
      checklistData[`elaboration-${obj.pid}`] = obj.elaboration || "";
    }
    if (obj.summaryJustification !== undefined) {
      checklistData[summaryKey] = obj.summaryJustification || "";
    }
    return;
  }

  // Look for properties that might contain PID information
  for (const key in obj) {
    if (isValidPid(key)) {
      // If the key itself is a valid PID
      const value = obj[key];
      if (typeof value === "object") {
        if (value.completed !== undefined) {
          const normalizedCompleted = validateAndNormalizeCompletedValue(
            value.completed
          );
          checklistData[`completed-${key}`] = normalizedCompleted;
        }
        if (value.elaboration !== undefined) {
          checklistData[`elaboration-${key}`] = value.elaboration || "";
        }
        if (value.summaryJustification !== undefined) {
          checklistData[summaryKey] = value.summaryJustification || "";
        }
      } else if (typeof value === "string") {
        // If the value is a string, assume it's the 'completed' status
        const normalizedCompleted = validateAndNormalizeCompletedValue(value);
        checklistData[`completed-${key}`] = normalizedCompleted;
      }
    } else if (
      key.startsWith("completed-") ||
      key.startsWith("elaboration-") ||
      key.startsWith("summary-justification-")
    ) {
      // If we have keys that already match our expected format
      if (key.startsWith("completed-")) {
        const pidMatch = key.match(/^completed-(.+)$/);
        if (pidMatch && isValidPid(pidMatch[1])) {
          const normalizedCompleted = validateAndNormalizeCompletedValue(
            obj[key]
          );
          checklistData[key] = normalizedCompleted;
        }
      } else {
        // For elaboration and summary-justification, keep as is
        checklistData[key] = obj[key] || "";
      }
    } else if (typeof obj[key] === "object") {
      // Recursively check nested objects
      extractChecklistItemsFromObject(obj[key], checklistData, principle);
    }
  }
}

/**
 * Attempts to guess which checklist a PID belongs to based on its prefix
 * This is a simplistic implementation and may need customization
 * @param {string} pid - The PID to analyze
 * @returns {string} The guessed sheet name
 */
function guessSheetNameFromPid(pid) {
  if (!pid) return "Unknown";

  // Default mapping of PID prefixes to sheet names
  // This is a placeholder and should be customized based on your actual data structure
  const pidPrefixMap = {
    1: "Transparency",
    2: "Explainability",
    3: "Reproducibility",
    4: "Safety",
    5: "Security",
    6: "Robustness",
    7: "Fairness",
    8: "Data Governance",
    9: "Accountability",
    10: "Human Agency Oversight",
    11: "Inclusive Growth",
    12: "Organisational Considerations",
  };

  const prefix = pid.split(".")[0];
  return pidPrefixMap[prefix] || "Unknown";
}

/**
 * Main function to import JSON data and convert it to the expected format
 * @param {Object|string} jsonData - JSON data or stringified JSON data
 * @param {string} groupName - The group name to associate with the checklists
 * @returns {Object} Object containing submissions array and unmatchedSheets array
 */
export function importJson(jsonData, groupName) {
  try {
    // Parse the JSON if it's a string
    const parsedData =
      typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    // Try to extract checklist data using various approaches
    return extractChecklistData(parsedData, groupName);
  } catch (error) {
    console.error("Error importing JSON data:", error);
    return { submissions: [], unmatchedSheets: [] };
  }
}
