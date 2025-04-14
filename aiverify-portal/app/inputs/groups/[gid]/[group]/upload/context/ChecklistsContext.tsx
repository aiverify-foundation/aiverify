'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { InputBlockGroup } from '@/app/inputs/utils/types';

// Types
interface Checklist {
  cid: string;
  gid: string;
  name: string;
  data: Record<string, string>;
  group: string;
  updated_at?: string;
}

interface ChecklistContextState {
  checklists: Checklist[];
  selectedChecklist: Checklist | null;
  groupName: string;
  isLoading: boolean;
  error: Error | null;
}

interface ChecklistContextActions {
  setGroupName: (name: string) => void;
  setSelectedChecklist: (checklist: Checklist) => void;
  updateChecklistData: (cid: string, data: Record<string, string>) => void;
  clearAllChecklists: () => void;
  setChecklists: (checklists: Checklist[]) => void;
  checkForExistingData: () => boolean;
  clearGroupName: () => void;
}

type ChecklistContextValue = ChecklistContextState & ChecklistContextActions;

// Default checklist definitions
const DEFAULT_CHECKLISTS: Checklist[] = [
  {
    cid: 'accountability_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Accountability Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'data_governance_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Data Governance Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'explainability_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Explainability Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'fairness_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Fairness Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'human_agency_oversight_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Human Agency Oversight Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'inclusive_growth_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Inclusive Growth Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'organisational_considerations_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Organisational Considerations Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'reproducibility_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Reproducibility Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'robustness_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Robustness Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'safety_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Safety Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'security_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Security Process Checklist',
    data: {},
    group: 'default',
  },
  {
    cid: 'transparency_process_checklist',
    gid: 'aiverify.stock.process_checklist',
    name: 'Transparency Process Checklist',
    data: {},
    group: 'default',
  },
];

// Context creation
const GroupDataContext = createContext<ChecklistContextValue | undefined>(
  undefined
);

// Provider component
export const GroupDataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // console.log('checkgroup:', group);
  const queryClient = new QueryClient();

  const [state, setState] = useState<ChecklistContextState>({
    checklists: DEFAULT_CHECKLISTS,
    selectedChecklist: null,
    groupName: '',
    isLoading: false,
    error: null,
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('checklistData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setState((prev) => ({
          ...prev,
          checklists: parsedData.checklists || DEFAULT_CHECKLISTS,
          groupName: parsedData.groupName || '',
        }));
      } catch (error) {
        console.error('Error parsing saved data:', error);
        setState((prev) => ({
          ...prev,
          checklists: DEFAULT_CHECKLISTS,
          groupName: '',
        }));
      }
    }
  }, []);

  // Actions
  const setGroupName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      groupName: name,
    }));

    // Always save to sessionStorage
    sessionStorage.setItem('groupName', name);

    // Update the checklistData in sessionStorage with the new groupName
    const savedData = sessionStorage.getItem('checklistData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        sessionStorage.setItem(
          'checklistData',
          JSON.stringify({
            ...parsedData,
            groupName: name,
          })
        );
      } catch (error) {
        console.error(
          'Error updating checklistData with new groupName:',
          error
        );
      }
    } else {
      // If there's no existing checklistData, create it with default checklists
      sessionStorage.setItem(
        'checklistData',
        JSON.stringify({
          checklists: DEFAULT_CHECKLISTS,
          groupName: name,
        })
      );
    }
  }, []);

  const clearGroupName = useCallback(() => {
    setState((prev) => ({
      ...prev,
      groupName: '',
    }));
    sessionStorage.removeItem('groupName');
  }, []);

  const setSelectedChecklist = useCallback((checklist: Checklist) => {
    setState((prev) => ({
      ...prev,
      selectedChecklist: checklist,
    }));
  }, []);

  // Make sure the context properly updates the checklists data
  const updateChecklistData = useCallback(
    (cid: string, data: Record<string, string>) => {
      setState((prev) => {
        const updatedChecklists = prev.checklists.map((checklist) =>
          checklist.cid === cid
            ? { ...checklist, data: data, updated_at: new Date().toISOString() }
            : checklist
        );

        sessionStorage.setItem(
          'checklistData',
          JSON.stringify({
            checklists: updatedChecklists,
            groupName: prev.groupName,
          })
        );

        return { ...prev, checklists: updatedChecklists };
      });
    },
    []
  );

  const setChecklists = useCallback((newChecklists: Checklist[]) => {
    setState((prevState) => ({
      ...prevState,
      checklists: newChecklists,
    }));
  }, []);

  const clearAllChecklists = () => {
    // Clear both state and sessionStorage
    setState({
      checklists: DEFAULT_CHECKLISTS,
      selectedChecklist: null,
      groupName: '',
      isLoading: false,
      error: null,
    });
    sessionStorage.removeItem('checklistData');
  };

  const checkForExistingData = useCallback(() => {
    return !!sessionStorage.getItem('checklistData');
  }, []);

  const contextValue: ChecklistContextValue = {
    ...state,
    setGroupName,
    setSelectedChecklist,
    updateChecklistData,
    clearAllChecklists,
    setChecklists,
    checkForExistingData,
    clearGroupName,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GroupDataContext.Provider value={contextValue}>
        {children}
      </GroupDataContext.Provider>
    </QueryClientProvider>
  );
};

export const useChecklists = () => {
  const context = useContext(GroupDataContext);
  if (!context) {
    throw new Error('useChecklists must be used within a ChecklistsProvider');
  }
  return context;
};
