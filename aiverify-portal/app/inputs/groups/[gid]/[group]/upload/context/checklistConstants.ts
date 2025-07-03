// Centralized checklist constants for AIVerify process checklists
// This should be the single source of truth for default checklist definitions

export interface Checklist {
  cid: string;
  gid: string;
  name: string;
  data: Record<string, string>;
  group: string;
  updated_at?: string;
}

// Checklist ID constants - matching the stock plugin definitions
export const PROCESS_CHECKLIST_CIDS = [
  'transparency_process_checklist',
  'explainability_process_checklist',
  'reproducibility_process_checklist',
  'safety_process_checklist',
  'security_process_checklist',
  'robustness_process_checklist',
  'fairness_process_checklist',
  'data_governance_process_checklist',
  'accountability_process_checklist',
  'human_agency_oversight_process_checklist',
  'inclusive_growth_process_checklist',
  'organisational_considerations_process_checklist',
] as const;

// Mapping for display names
export const CHECKLIST_DISPLAY_NAMES: Record<string, string> = {
  transparency_process_checklist: 'Transparency Process Checklist',
  explainability_process_checklist: 'Explainability Process Checklist',
  reproducibility_process_checklist: 'Reproducibility Process Checklist',
  safety_process_checklist: 'Safety Process Checklist',
  security_process_checklist: 'Security Process Checklist',
  robustness_process_checklist: 'Robustness Process Checklist',
  fairness_process_checklist: 'Fairness Process Checklist',
  data_governance_process_checklist: 'Data Governance Process Checklist',
  accountability_process_checklist: 'Accountability Process Checklist',
  human_agency_oversight_process_checklist: 'Human Agency Oversight Process Checklist',
  inclusive_growth_process_checklist: 'Inclusive Growth Process Checklist',
  organisational_considerations_process_checklist: 'Organisational Considerations Process Checklist',
};

// Default GID for stock process checklists
export const STOCK_PROCESS_CHECKLIST_GID = 'aiverify.stock.process_checklist';

// Generate default checklists from the constants
export const DEFAULT_CHECKLISTS: Checklist[] = PROCESS_CHECKLIST_CIDS.map((cid) => ({
  cid,
  gid: STOCK_PROCESS_CHECKLIST_GID,
  name: CHECKLIST_DISPLAY_NAMES[cid],
  data: {},
  group: 'default',
}));

// Helper function to create a checklist with custom data
export const createChecklist = (
  cid: string,
  data: Record<string, string> = {},
  group = 'default'
): Checklist => ({
  cid,
  gid: STOCK_PROCESS_CHECKLIST_GID,
  name: CHECKLIST_DISPLAY_NAMES[cid] || cid,
  data,
  group,
});

// Helper function to get checklist by CID
export const getChecklistByCid = (cid: string): Checklist | undefined => {
  return DEFAULT_CHECKLISTS.find(checklist => checklist.cid === cid);
};

// Future: Function to fetch checklists dynamically from API
// This can be implemented when moving away from hardcoded defaults
export const fetchDynamicChecklists = async (gid: string): Promise<Checklist[]> => {
  try {
    // This would call the API to get available input blocks for the GID
    const response = await fetch(`/api/input_block_data/groups?gid=${gid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dynamic checklists');
    }
    const data = await response.json();
    
    // Transform API response to Checklist format
    // This is a placeholder - actual implementation would depend on API response structure
    return data.map((item: { cid: string; gid: string; name?: string }) => ({
      cid: item.cid,
      gid: item.gid,
      name: item.name || CHECKLIST_DISPLAY_NAMES[item.cid] || item.cid,
      data: {},
      group: 'default',
    }));
  } catch (error) {
    console.error('Error fetching dynamic checklists:', error);
    // Fallback to default checklists
    return DEFAULT_CHECKLISTS;
  }
}; 