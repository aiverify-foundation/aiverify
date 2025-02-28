// fairnesstreecontext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FairnessTree } from '@/app/inputs/utils/types';

interface FairnessTreeContextType {
  fairnessTrees: FairnessTree[];
  addFairnessTree: (tree: FairnessTree) => void;
  removeFairnessTree: (name: string) => void;
  clearFairnessTrees: () => void;
  updateFairnessTree: (gid: string, updates: Partial<FairnessTree>) => void;
}

const FairnessTreeContext = createContext<FairnessTreeContextType | undefined>(
  undefined
);

export const FairnessTreeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [fairnessTrees, setFairnessTrees] = useState<FairnessTree[]>([]);

  const addFairnessTree = (tree: FairnessTree) => {
    setFairnessTrees((prevTrees) => [...prevTrees, tree]);
  };

  const removeFairnessTree = (name: string) => {
    setFairnessTrees((prevTrees) =>
      prevTrees.filter((tree) => tree.name !== name)
    );
  };

  const clearFairnessTrees = () => {
    setFairnessTrees([]);
  };

  const updateFairnessTree = (gid: string, updates: Partial<FairnessTree>) => {
    setFairnessTrees((prevTrees) =>
      prevTrees.map((tree) =>
        tree.gid === gid ? { ...tree, ...updates } : tree
      )
    );
  };

  return (
    <FairnessTreeContext.Provider
      value={{
        fairnessTrees,
        addFairnessTree,
        removeFairnessTree,
        clearFairnessTrees,
        updateFairnessTree,
      }}>
      {children}
    </FairnessTreeContext.Provider>
  );
};

export const useFairnessTree = () => {
  const context = useContext(FairnessTreeContext);
  if (context === undefined) {
    throw new Error(
      'useFairnessTree must be used within a FairnessTreeProvider'
    );
  }
  return context;
};
