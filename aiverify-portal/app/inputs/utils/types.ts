// types.ts

export type ChecklistData = {
  [key: string]: string; // e.g., "completed-2.1.1": "Yes"
};

export type InputBlock = {
  gid: string; // Group ID, e.g., "aiverify.stock.process_checklist"
  cid: string; // Checklist ID, e.g., "explainability_process_checklist"
  name: string; // Checklist name, e.g., "explainability_process_checklist"
  group: string; // Group name, e.g., "check a"
  data: ChecklistData; // Data related to the checklist
  id: number; // Unique ID for the checklist
  created_at: string; // Timestamp of creation
  updated_at: string; // Timestamp of last update
};

export type Checklist = InputBlock;

export interface FairnessTreeData {
  sensitiveFeature: string;
  favourableOutcomeName: string;
  qualified: string;
  unqualified: string;
  selectedOutcomes: string[]; // Assuming IDs of selected outcomes
  metrics: string[]; // Assuming IDs of metrics
  selections: string[];
  [key: string]: string | string[] | undefined; // Allows only keys that match "ans-{something}", undefined is for delete
}

export interface FairnessTree {
  gid: string;
  cid: string;
  name: string;
  group: string;
  data: FairnessTreeData;
  id: number;
  created_at: string;
  updated_at: string;
}

export type GroupedChecklists = {
  [groupName: string]: Checklist[]; // Groups of checklists, keyed by the group name
};

export type ChecklistProgress = {
  id: string;
  name: string;
  isCompleted: boolean;
  progress: number;
};
