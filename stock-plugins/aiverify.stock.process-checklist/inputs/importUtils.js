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
  human_agency_oversight_process_checklist: "Human Agency Oversight",
  inclusive_growth_process_checklist: "Inclusive Growth",
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
 * Converts JSON data from an uploaded file into the format expected by the API gateway
 * @param {Object} jsonData - JSON data from an uploaded file
 * @param {string} groupName - The group name to associate with the checklists
 * @returns {Array} Array of checklist submissions in the format expected by the API
 */
export function jsonToChecklistSubmissions(jsonData, groupName) {
  if (!jsonData || !Array.isArray(jsonData.sheets) || !groupName) {
    console.error("Invalid JSON data or missing group name");
    return [];
  }

  const reverseMapping = getReverseChecklistMapping();
  const submissions = [];

  // Process each sheet in the JSON data
  jsonData.sheets.forEach((sheet) => {
    const sheetName = sheet.name.trim().toLowerCase();
    const cid = reverseMapping[sheetName];

    if (!cid) {
      console.warn(`No CID found for sheet: ${sheet.name}`);
      return;
    }

    const checklistData = {};

    // Process each row in the sheet
    sheet.rows.forEach((row) => {
      const pid = row.pid;
      const completed = row.completed;
      const elaboration = row.elaboration;

      if (isValidPid(pid)) {
        if (completed !== undefined) {
          checklistData[`completed-${pid}`] = completed || "";
        }
        if (elaboration !== undefined) {
          checklistData[`elaboration-${pid}`] = elaboration || "";
        }
      }
    });

    submissions.push({
      gid: "aiverify.stock.process_checklist",
      cid,
      name: sheet.name,
      group: groupName,
      data: checklistData,
    });
  });

  return submissions;
}

/**
 * Extracts checklist data from a more general JSON format
 * This function is designed to be flexible and handle various JSON structures
 * @param {Object|Array} jsonData - JSON data that might contain checklist information
 * @param {string} groupName - The group name to associate with the checklists
 * @returns {Array} Array of checklist submissions
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
        (item.completed !== undefined || item.elaboration !== undefined)
      ) {
        // If we have PID and either completed or elaboration fields directly
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

        // Process the object to extract PID, completed, and elaboration data
        extractChecklistItemsFromObject(jsonData[key], checklistData);

        if (Object.keys(checklistData).length > 0) {
          submissions.push({
            gid: "aiverify.stock.process_checklist",
            cid,
            name: checklistMapping[cid],
            group: groupName,
            data: checklistData,
          });
        }
      }
    }
  });

  return submissions.length > 0 ? submissions : [];
}

/**
 * Helper function to recursively extract checklist items from a complex object
 * @param {Object} obj - Object that might contain checklist data
 * @param {Object} checklistData - Object to populate with extracted data
 */
function extractChecklistItemsFromObject(obj, checklistData) {
  if (!obj || typeof obj !== "object") return;

  // Check if this object directly has pid, completed, and elaboration properties
  if (obj.pid && isValidPid(obj.pid)) {
    if (obj.completed !== undefined) {
      checklistData[`completed-${obj.pid}`] = obj.completed || "";
    }
    if (obj.elaboration !== undefined) {
      checklistData[`elaboration-${obj.pid}`] = obj.elaboration || "";
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
          checklistData[`completed-${key}`] = value.completed || "";
        }
        if (value.elaboration !== undefined) {
          checklistData[`elaboration-${key}`] = value.elaboration || "";
        }
      } else if (typeof value === "string") {
        // If the value is a string, assume it's the 'completed' status
        checklistData[`completed-${key}`] = value;
      }
    } else if (key.startsWith("completed-") || key.startsWith("elaboration-")) {
      // If we have keys that already match our expected format
      const pidMatch = key.match(/^(completed|elaboration)-(.+)$/);
      if (pidMatch && isValidPid(pidMatch[2])) {
        checklistData[key] = obj[key] || "";
      }
    } else if (typeof obj[key] === "object") {
      // Recursively check nested objects
      extractChecklistItemsFromObject(obj[key], checklistData);
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
 * @returns {Array} Array of checklist submissions in the expected format
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
    return [];
  }
}
