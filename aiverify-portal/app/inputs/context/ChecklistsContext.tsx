'use client';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { Checklist } from '@/app/inputs/utils/types';

type ChecklistsContextType = {
  checklists: Checklist[];
  selectedGroup: string | null;
  setChecklists: (checklists: Checklist[]) => void;
  setSelectedGroup: (groupName: string) => void;
  setSelectedChecklist: (checklist: Checklist) => void;
};

const ChecklistsContext = createContext<ChecklistsContextType | undefined>(
  undefined
);

export const ChecklistsProvider = ({ children }: { children: ReactNode }) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Load stored data after component mounts
  useEffect(() => {
    const storedGroup = localStorage.getItem('selectedGroup');
    const storedChecklists = localStorage.getItem('groupChecklists');

    if (storedGroup) {
      setSelectedGroup(storedGroup);
    }

    if (storedChecklists) {
      try {
        const parsedChecklists = JSON.parse(storedChecklists);
        setChecklists(parsedChecklists);
      } catch (error) {
        console.error('Error parsing stored checklists:', error);
      }
    }
  }, []);

  // Update localStorage when selectedGroup or checklists change
  const handleSetChecklists = (newChecklists: Checklist[]) => {
    setChecklists(newChecklists);
    localStorage.setItem('groupChecklists', JSON.stringify(newChecklists));
  };

  const handleSetSelectedGroup = (groupName: string) => {
    setSelectedGroup(groupName);
    localStorage.setItem('selectedGroup', groupName);
  };

  const setSelectedChecklist = () => {
    // logic to set selected checklist
  };

  return (
    <ChecklistsContext.Provider
      value={{
        checklists,
        selectedGroup,
        setChecklists: handleSetChecklists,
        setSelectedGroup: handleSetSelectedGroup,
        setSelectedChecklist,
      }}>
      {children}
    </ChecklistsContext.Provider>
  );
};

export const useChecklists = (): ChecklistsContextType => {
  const context = useContext(ChecklistsContext);
  if (!context) {
    throw new Error('useChecklists must be used within a ChecklistsProvider');
  }
  return context;
};
