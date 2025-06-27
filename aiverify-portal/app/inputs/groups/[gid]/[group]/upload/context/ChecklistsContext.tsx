'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { DEFAULT_CHECKLISTS, Checklist } from './checklistConstants';

// Types
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
