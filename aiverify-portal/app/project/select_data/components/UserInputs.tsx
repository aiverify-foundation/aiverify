'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FairnessTreeModalWrapper } from '@/app/inputs/fairnesstree/page';
import { Checklist, FairnessTree } from '@/app/inputs/utils/types';
import { InputBlock as ProjectInputBlock } from '@/app/types';
import { Button, ButtonVariant } from '@/lib/components/button';

interface UserInputsProps {
  projectId?: string | null;
  requiredInputBlocks: ProjectInputBlock[];
  onInputBlocksChange: (
    inputBlocks: Array<{ gid: string; cid: string; id: number }>
  ) => void;
  allChecklists: Checklist[];
  allFairnessTrees: FairnessTree[];
  flow: string;
}

interface GroupedChecklists {
  [key: string]: Checklist[];
}

export default function UserInputs({
  projectId,
  requiredInputBlocks,
  onInputBlocksChange,
  allChecklists,
  allFairnessTrees,
  flow,
}: UserInputsProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedFairnessTrees, setSelectedFairnessTrees] = useState<{
    [key: string]: string;
  }>({});
  const [showFairnessTreeModal, setShowFairnessTreeModal] = useState(false);
  const [currentFairnessTree, setCurrentFairnessTree] = useState<{
    gid: string;
    cid: string;
  } | null>(null);

  // Group checklists by group name
  const groupedChecklists = allChecklists.reduce((groups, checklist) => {
    const groupName = checklist.group || 'Ungrouped';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(checklist);
    return groups;
  }, {} as GroupedChecklists);

  // Update parent with all selected blocks
  const updateParentWithSelectedBlocks = (
    newGroup: string,
    newFairnessTrees: { [key: string]: string } = selectedFairnessTrees
  ) => {
    let selectedBlocks: Array<{ gid: string; cid: string; id: number }> = [];

    // Add selected checklists
    if (newGroup && groupedChecklists[newGroup]) {
      selectedBlocks = [...selectedBlocks, ...groupedChecklists[newGroup]];
    }

    // Add selected fairness trees
    Object.entries(newFairnessTrees).forEach(([key, treeId]) => {
      if (treeId) {
        const [gid, cid] = key.split('-');
        const tree = allFairnessTrees.find((t) => t.id?.toString() === treeId);
        if (tree?.id) {
          selectedBlocks.push({
            gid,
            cid,
            id: tree.id,
          });
        }
      }
    });

    onInputBlocksChange(selectedBlocks);
  };

  // Handle checklist group selection
  const handleGroupSelection = (groupName: string) => {
    setSelectedGroup(groupName);
    updateParentWithSelectedBlocks(groupName);
  };

  // Handle fairness tree selection
  const handleFairnessTreeSelection = (
    inputBlock: ProjectInputBlock,
    treeId: string
  ) => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    const newFairnessTrees = {
      ...selectedFairnessTrees,
      [key]: treeId,
    };
    setSelectedFairnessTrees(newFairnessTrees);
    updateParentWithSelectedBlocks(selectedGroup, newFairnessTrees);
  };

  const getInputBlocksForList = (gid: string) => {
    return allFairnessTrees.filter((block) => block.gid === gid);
  };

  const handleAddTree = (inputBlock: ProjectInputBlock) => {
    setCurrentFairnessTree({
      gid: inputBlock.gid,
      cid: inputBlock.cid,
    });
    setShowFairnessTreeModal(true);
  };

  return (
    <div className="rounded-lg border border-secondary-500 bg-secondary-950 p-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-white">User Inputs</h2>
        <p className="mb-6 text-sm text-gray-400">
          Upload new User Input or select existing User Input.
        </p>
      </div>

      <div className="space-y-4">
        {/* Process Checklists */}
        <div className="flex items-center justify-between gap-4">
          <label className="w-64 text-white">Process Checklists</label>
          <div className="relative flex-1">
            <select
              value={selectedGroup}
              onChange={(e) => handleGroupSelection(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-gray-300">
              <option value="">Choose User Input</option>
              {Object.entries(groupedChecklists).map(([groupName]) => (
                <option
                  key={groupName}
                  value={groupName}>
                  {groupName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
              <svg
                className="h-4 w-4 fill-current text-gray-400"
                viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <Link
            href={`/inputs/checklists/upload?flow=${flow}${projectId ? `&projectId=${projectId}` : ''}`}>
            <Button
              variant={ButtonVariant.OUTLINE}
              hoverColor="var(--color-primary-500)"
              textColor="white"
              text="ADD INPUT"
              size="xs"
              pill
            />
          </Link>
        </div>

        {/* Other Input Blocks (Fairness Trees) */}
        {requiredInputBlocks
          .filter((block) => block.gid !== 'aiverify.stock.process_checklist')
          .map((inputBlock) => {
            const key = `${inputBlock.gid}-${inputBlock.cid}`;
            const availableTrees = getInputBlocksForList(inputBlock.gid);
            const selectedTreeId = selectedFairnessTrees[key] || '';

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-4">
                <label className="w-64 text-white">{inputBlock.name}</label>
                <div className="relative flex-1">
                  <select
                    value={selectedTreeId}
                    onChange={(e) =>
                      handleFairnessTreeSelection(inputBlock, e.target.value)
                    }
                    className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-gray-300">
                    <option value="">Choose User Input</option>
                    {availableTrees.map((tree) => (
                      <option
                        key={tree.id}
                        value={tree.id?.toString() || ''}>
                        {tree.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <svg
                      className="h-4 w-4 fill-current text-gray-400"
                      viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                <Button
                  variant={ButtonVariant.OUTLINE}
                  hoverColor="var(--color-primary-500)"
                  textColor="white"
                  text="ADD TREE"
                  size="xs"
                  pill
                  onClick={() => handleAddTree(inputBlock)}
                />
              </div>
            );
          })}
      </div>

      {/* Fairness Tree Modal */}
      {showFairnessTreeModal && currentFairnessTree && (
        <FairnessTreeModalWrapper
          isOpen={showFairnessTreeModal}
          onClose={() => setShowFairnessTreeModal(false)}
          gid={currentFairnessTree.gid}
          cid={currentFairnessTree.cid}
        />
      )}
    </div>
  );
}
