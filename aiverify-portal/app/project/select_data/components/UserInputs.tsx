'use client';

import Link from 'next/link';
import React from 'react';
import { useState } from 'react';
import { useMDXBundle } from '@/app/inputs/checklists/[groupId]/[checklistId]/hooks/useMDXBundle';
import { FairnessTreeModalWrapper } from '@/app/inputs/fairnesstree/page';
import { Checklist, FairnessTree } from '@/app/inputs/utils/types';
import { InputBlockData, InputBlock as ProjectInputBlock } from '@/app/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import PluginInputModal from './PluginInputModal';

interface UserInputsProps {
  projectId?: string | null;
  requiredInputBlocks: ProjectInputBlock[];
  onInputBlocksChange: (
    inputBlocks: Array<{ gid: string; cid: string; id: number }>
  ) => void;
  allChecklists: Checklist[];
  allFairnessTrees: FairnessTree[];
  allInputBlockDatas: InputBlockData[];
  flow: string;
  initialInputBlocks?: Array<{ gid: string; cid: string; id: number }>;
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
  allInputBlockDatas,
  flow,
  initialInputBlocks = [],
}: UserInputsProps) {
  // Initialize selectedGroup based on initialInputBlocks
  const initialGroup = (() => {
    const checklistBlock = initialInputBlocks.find(
      (block) => block.gid === 'aiverify.stock.process_checklist'
    );
    if (checklistBlock) {
      const matchingChecklist = allChecklists.find(
        (checklist) => checklist.id === checklistBlock.id
      );
      return matchingChecklist?.group || '';
    }
    return '';
  })();

  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup);

  // Initialize fairness trees based on initialInputBlocks
  const initialFairnessTrees = (() => {
    const fairnessBlocks = initialInputBlocks.filter(
      (block) => block.gid !== 'aiverify.stock.process_checklist'
    );

    return fairnessBlocks.reduce(
      (acc, block) => {
        const matchingTree = allFairnessTrees.find(
          (tree) => tree.id === block.id
        );
        if (matchingTree?.id) {
          acc[`${block.gid}-${block.cid}`] = matchingTree.id.toString();
        }
        return acc;
      },
      {} as { [key: string]: string }
    );
  })();

  const [selectedFairnessTrees, setSelectedFairnessTrees] = useState<{
    [key: string]: string;
  }>(initialFairnessTrees);

  // Initialize other input blocks based on initialInputBlocks
  const initialOtherInputs = (() => {
    const otherBlocks = initialInputBlocks.filter(
      (block) =>
        block.gid !== 'aiverify.stock.process_checklist' &&
        block.gid !==
          'aiverify.stock.fairness_metrics_toolbox_for_classification'
    );

    return otherBlocks.reduce(
      (acc, block) => {
        const key = `${block.gid}-${block.cid}`;
        acc[key] = block.id.toString();
        return acc;
      },
      {} as { [key: string]: string }
    );
  })();

  const [selectedOtherInputs, setSelectedOtherInputs] = useState<{
    [key: string]: string;
  }>(initialOtherInputs);

  const [showFairnessTreeModal, setShowFairnessTreeModal] = useState(false);
  const [currentFairnessTree, setCurrentFairnessTree] = useState<{
    gid: string;
    cid: string;
  } | null>(null);

  const [selectedPlugin, setSelectedPlugin] = useState<{
    name: string;
    inputBlock: string;
    gid: string;
    cid: string;
  } | null>(null);

  // Use the MDX bundle hook when a plugin is selected
  const { data: mdxBundle } = useMDXBundle(
    selectedPlugin?.gid,
    selectedPlugin?.cid
  );

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
    newFairnessTrees: { [key: string]: string } = selectedFairnessTrees,
    newOtherInputs: { [key: string]: string } = selectedOtherInputs
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

    // Add selected other inputs
    Object.entries(newOtherInputs).forEach(([key, inputId]) => {
      if (inputId) {
        const [gid, cid] = key.split('-');
        selectedBlocks.push({
          gid,
          cid,
          id: parseInt(inputId),
        });
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

  // Handle other input selection
  const handleOtherInputSelection = (
    inputBlock: ProjectInputBlock,
    inputId: string
  ) => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    const newOtherInputs = {
      ...selectedOtherInputs,
      [key]: inputId,
    };
    setSelectedOtherInputs(newOtherInputs);
    updateParentWithSelectedBlocks(
      selectedGroup,
      selectedFairnessTrees,
      newOtherInputs
    );
  };

  const getInputBlocksForList = (gid: string) => {
    return allFairnessTrees.filter((block) => block.gid === gid);
  };

  const getOtherInputBlocksForList = (gid: string, cid: string) => {
    return allInputBlockDatas.filter(
      (block) =>
        block.gid === gid &&
        block.cid === cid &&
        block.gid !== 'aiverify.stock.process_checklist' &&
        block.gid !==
          'aiverify.stock.fairness_metrics_toolbox_for_classification'
    );
  };

  const handleAddTree = (inputBlock: ProjectInputBlock) => {
    setCurrentFairnessTree({
      gid: inputBlock.gid,
      cid: inputBlock.cid,
    });
    setShowFairnessTreeModal(true);
  };

  const handleAddInput = (inputBlock: ProjectInputBlock) => {
    setSelectedPlugin({
      name: inputBlock.name,
      inputBlock: inputBlock.cid,
      gid: inputBlock.gid,
      cid: inputBlock.cid,
    });
  };

  const handlePluginSubmit = async (data: Record<string, unknown>) => {
    // Handle the form submission for plugin input
    console.log('Plugin input submitted:', data);
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

        {/* Fairness Trees */}
        {requiredInputBlocks
          .filter(
            (block) =>
              block.gid ===
              'aiverify.stock.fairness_metrics_toolbox_for_classification'
          )
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
                  text="ADD INPUT"
                  size="xs"
                  pill
                  onClick={() => handleAddTree(inputBlock)}
                />
              </div>
            );
          })}

        {/* Other Input Blocks */}
        {requiredInputBlocks
          .filter(
            (block) =>
              block.gid !== 'aiverify.stock.process_checklist' &&
              block.gid !==
                'aiverify.stock.fairness_metrics_toolbox_for_classification'
          )
          .map((inputBlock) => {
            const key = `${inputBlock.gid}-${inputBlock.cid}`;
            const selectedInputId = selectedOtherInputs[key] || '';
            const availableInputs = getOtherInputBlocksForList(
              inputBlock.gid,
              inputBlock.cid
            );

            // Get the plugin name from gid if it's a plugin input block
            const isPluginInput = inputBlock.gid.startsWith('aiverify.plugin.');
            const pluginName = isPluginInput
              ? inputBlock.gid.split('.')[2]
              : null;

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <label className="w-64 text-white">{inputBlock.name}</label>
                  {isPluginInput && (
                    <span className="text-xs text-gray-400">
                      Plugin: {pluginName}
                    </span>
                  )}
                </div>
                <div className="relative flex-1">
                  <select
                    value={selectedInputId}
                    onChange={(e) =>
                      handleOtherInputSelection(inputBlock, e.target.value)
                    }
                    className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-gray-300">
                    <option value="">Choose User Input</option>
                    {availableInputs.map((input) => (
                      <option
                        key={input.id}
                        value={input.id?.toString() || ''}>
                        {input.name}
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
                  text="ADD INPUT"
                  size="xs"
                  pill
                  onClick={() => handleAddInput(inputBlock)}
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

      <PluginInputModal
        isOpen={!!selectedPlugin}
        onClose={() => setSelectedPlugin(null)}
        pluginName={selectedPlugin?.name || ''}
        inputBlockName={selectedPlugin?.inputBlock || ''}
        mdxContent={mdxBundle?.code || ''}
        onSubmit={handlePluginSubmit}
        gid={selectedPlugin?.gid || ''}
        cid={selectedPlugin?.cid || ''}
      />
    </div>
  );
}
