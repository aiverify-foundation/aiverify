import * as XLSX from 'xlsx';

interface ChecklistMapping {
  [key: string]: string;
}

const checklistMapping: ChecklistMapping = {
  transparency_process_checklist: 'Transparency',
  explainability_process_checklist: 'Explainability',
  reproducibility_process_checklist: 'Reproducibility',
  safety_process_checklist: 'Safety',
  security_process_checklist: 'Security',
  robustness_process_checklist: 'Robustness',
  fairness_process_checklist: 'Fairness',
  data_governance_process_checklist: 'Data Governance',
  accountability_process_checklist: 'Accountability',
  human_agency_oversight_process_checklist: 'Human Agency Oversight',
  inclusive_growth_process_checklist: 'Inclusive Growth',
  organisational_considerations_process_checklist:
    'Organisational Considerations',
};

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

export const excelToJson = (
  file: File,
  groupName: string
): Promise<ChecklistSubmission[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });

      const submissions: ChecklistSubmission[] = [];

      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const cid = Object.keys(checklistMapping).find(
          (key) =>
            checklistMapping[key].trim().toLowerCase() ===
            sheetName.trim().toLowerCase()
        );

        if (!cid) {
          console.warn(`No CID found for sheet: ${sheetName}`);
          return;
        }

        const checklistData: ChecklistData = {};

        json.forEach((row: unknown) => {
          const typedRow = row as string[];
          const pid = typedRow[0]; // PID is in column A (first column)
          const completed = typedRow[4]; // "completed" is in column E (5th column)
          const elaboration = typedRow[5]; // "elaboration" is in column F (6th column)

          // Validate PID format (e.g., 9.1.1, 9.2.1, etc.)
          const pidRegex = /^\d+(\.\d+)+$/; // Matches patterns like 9.1.1, 9.2.1, etc.
          if (pid && pidRegex.test(pid)) {
            if (completed !== undefined) {
              checklistData[`completed-${pid}`] = completed || ''; // Handle empty values
            }
            if (elaboration !== undefined) {
              checklistData[`elaboration-${pid}`] = elaboration || ''; // Handle empty values
            }
          }
        });

        submissions.push({
          gid: 'aiverify.stock.process_checklist',
          cid,
          name: sheetName,
          group: groupName,
          data: checklistData,
        });
      });

      resolve(submissions);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
};
