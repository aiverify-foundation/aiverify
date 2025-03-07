'use client';

import { useEffect, useState } from 'react';
import { InputBlock } from '@/app/inputs/utils/types';
import { Checklist } from '@/app/inputs/utils/types';
import { InputBlock as ProjectInputBlock } from '@/app/types';
import { getAllChecklists } from '@/lib/fetchApis/getAllChecklists';

interface UserInputsProps {
  projectId?: string | null;
  requiredInputBlocks: InputBlock[];
  onInputBlocksChange: (
    inputBlocks: Array<{ gid: string; cid: string; id: number }>
  ) => void;
}

interface GroupedChecklists {
  [key: string]: Checklist[];
}

export default function UserInputs({
  projectId,
  requiredInputBlocks,
  onInputBlocksChange,
}: UserInputsProps) {
  const [allChecklists, setAllChecklists] = useState<Checklist[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedInputBlocks, setSelectedInputBlocks] = useState<{
    [key: string]: (Checklist | InputBlock) | null;
  }>({});

  // Fetch all checklists on mount
  useEffect(() => {
    async function fetchChecklists() {
      try {
        const checklists = await getAllChecklists();
        setAllChecklists(checklists);
      } catch (error) {
        console.error('Failed to fetch checklists:', error);
      }
    }
    fetchChecklists();
  }, []);

  // Group checklists by group name
  const groupedChecklists = allChecklists.reduce((groups, checklist) => {
    const groupName = checklist.group || 'Ungrouped';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(checklist);
    return groups;
  }, {} as GroupedChecklists);

  // Handle checklist group selection
  const handleGroupSelection = (groupName: string) => {
    const newSelectedGroups = new Set(selectedGroups);
    const groupChecklists = groupedChecklists[groupName];

    if (selectedGroups.has(groupName)) {
      newSelectedGroups.delete(groupName);
      // Remove all checklists from this group from selected input blocks
      groupChecklists.forEach((checklist) => {
        const key = `${checklist.gid}-${checklist.cid}`;
        setSelectedInputBlocks((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      });
    } else {
      newSelectedGroups.add(groupName);
      // Add all checklists from this group to selected input blocks
      groupChecklists.forEach((checklist) => {
        const key = `${checklist.gid}-${checklist.cid}`;
        setSelectedInputBlocks((prev) => ({
          ...prev,
          [key]: checklist,
        }));
      });
    }

    setSelectedGroups(newSelectedGroups);
  };

  // Handle other input block selection
  const handleInputBlockChange = (
    inputBlock: InputBlock,
    selected: boolean
  ) => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    setSelectedInputBlocks((prev) => ({
      ...prev,
      [key]: selected ? inputBlock : null,
    }));
  };

  // Update parent component when selections change
  useEffect(() => {
    const selectedBlocks = Object.values(selectedInputBlocks)
      .filter((block): block is Checklist | InputBlock => block !== null)
      .map((block) => ({
        gid: block.gid,
        cid: block.cid,
        id: 1, // You might need to adjust this based on your requirements
      }));
    onInputBlocksChange(selectedBlocks);
  }, [selectedInputBlocks, onInputBlocksChange]);

  return (
    <div className="rounded-lg bg-[#2D3142] p-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-white">User Inputs</h2>
        <p className="mb-6 text-sm text-gray-400">
          Upload new User Input or select existing User Input.
        </p>
      </div>

      <div className="space-y-4">
        {/* Process Checklists */}
        {Object.entries(groupedChecklists).map(([groupName, checklists]) => (
          <div
            key={groupName}
            className="flex items-center justify-between gap-4">
            <label className="w-64 text-white">{groupName}</label>
            <div className="relative flex-1">
              <select
                value={selectedGroups.has(groupName) ? groupName : ''}
                onChange={() => handleGroupSelection(groupName)}
                className="w-full cursor-pointer appearance-none rounded bg-[#1F2937] p-3 pr-10 text-gray-300">
                <option value="">Choose User Input</option>
                <option value={groupName}>
                  {checklists.length} checklists
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg
                  className="h-4 w-4 fill-current text-gray-400"
                  viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <button
              className="w-32 rounded bg-[#4B5563] px-4 py-2 text-sm text-gray-300 hover:bg-[#374151]"
              onClick={() => {}}>
              ADD INPUT
            </button>
          </div>
        ))}

        {/* Other Input Blocks */}
        {requiredInputBlocks
          .filter((block) => block.gid !== 'aiverify.stock.process_checklist')
          .map((inputBlock) => {
            const key = `${inputBlock.gid}-${inputBlock.cid}`;
            const isSelected = !!selectedInputBlocks[key];

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-4">
                <label className="w-64 text-white">{inputBlock.name}</label>
                <div className="relative flex-1">
                  <select
                    value={isSelected ? 'selected' : ''}
                    onChange={(e) =>
                      handleInputBlockChange(
                        inputBlock,
                        e.target.value === 'selected'
                      )
                    }
                    className="w-full cursor-pointer appearance-none rounded bg-[#1F2937] p-3 pr-10 text-gray-300">
                    <option value="">Choose User Input</option>
                    <option value="selected">Select this input</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <svg
                      className="h-4 w-4 fill-current text-gray-400"
                      viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                <button
                  className="w-32 rounded bg-[#4B5563] px-4 py-2 text-sm text-gray-300 hover:bg-[#374151]"
                  onClick={() => {}}>
                  ADD INPUT
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
