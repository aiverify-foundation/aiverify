'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useMDXBundle } from '@/app/inputs/checklists/[groupId]/[checklistId]/hooks/useMDXBundle';
import { FairnessTreeModalWrapper } from '@/app/inputs/fairnesstree/components/ModalView';
import { Checklist, FairnessTree } from '@/app/inputs/utils/types';
import {
  ValidationResults,
  validateInputBlock,
  processBatchValidations,
} from '@/app/project/select_data/utils/validationUtils';
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
  onValidationResultsChange?: (results: ValidationResults) => void;
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
  onValidationResultsChange,
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
  const router = useRouter();

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

  // State for validation results
  const [validationResults, setValidationResults] = useState<ValidationResults>(
    {}
  );

  // Ref to prevent multiple validation updates
  const didRunValidationUpdate = React.useRef(false);

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

  // State to track when to fetch fresh data
  const [shouldFetchData, setShouldFetchData] = useState(false);

  // Effect to prevalidate all available input blocks on mount
  useEffect(() => {
    const prevalidateAllInputs = async () => {
      setValidationResults({});

      // Prevalidate all available input blocks for potential selection
      const allInputsToValidate = [
        ...Object.values(groupedChecklists).flat(),
        ...allFairnessTrees,
        ...allInputBlockDatas,
      ].map((input) => ({
        gid: input.gid,
        cid: input.cid,
        data: input.data,
        id: input.id,
      }));

      const results = await processBatchValidations(allInputsToValidate);
      setValidationResults(results);

      // Don't call onValidationResultsChange here, let the dedicated effect handle it
      // This avoids potential setState during render issues
    };

    prevalidateAllInputs();
  }, [allInputBlockDatas]);

  // Simplified effect to handle selection changes
  useEffect(() => {
    // Only notify if we have validation results and the callback exists
    if (
      !onValidationResultsChange ||
      Object.keys(validationResults).length === 0
    ) {
      return;
    }

    // Prevent multiple calls within the same render cycle
    if (!didRunValidationUpdate.current) {
      didRunValidationUpdate.current = true;

      // Use requestAnimationFrame to ensure we're not updating state during render
      const frameId = requestAnimationFrame(() => {
        onValidationResultsChange(validationResults);
        didRunValidationUpdate.current = false;
      });

      return () => {
        cancelAnimationFrame(frameId);
        didRunValidationUpdate.current = false;
      };
    }
  }, [
    // Use stable references without JSON.stringify
    selectedGroup,
    selectedFairnessTrees,
    selectedOtherInputs,
    validationResults,
    onValidationResultsChange,
  ]);

  // Effect to handle data refresh
  useEffect(() => {
    if (shouldFetchData) {
      console.log('Refreshing data in UserInputs');
      setShouldFetchData(false);

      // Force a router refresh to get fresh data from the server
      router.refresh();
    }
  }, [shouldFetchData, router]);

  // Function to force refresh when new data is submitted
  const refreshData = () => {
    console.log('Manual data refresh triggered');
    setShouldFetchData(true);
  };

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
    // If the group is the same, do nothing to avoid unnecessary updates
    if (selectedGroup === groupName) {
      return;
    }

    setSelectedGroup(groupName);

    // Notify parent of selection change directly without using setTimeout
    const selectedBlocks = groupName ? groupedChecklists[groupName] || [] : [];
    onInputBlocksChange(selectedBlocks);
  };

  // Handle fairness tree selection
  const handleFairnessTreeSelection = (
    inputBlock: ProjectInputBlock,
    treeId: string
  ) => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    // If the tree ID is the same, do nothing to avoid unnecessary updates
    if (selectedFairnessTrees[key] === treeId) {
      return;
    }

    const newFairnessTrees = {
      ...selectedFairnessTrees,
      [key]: treeId,
    };
    setSelectedFairnessTrees(newFairnessTrees);

    // Build selected blocks and notify parent directly
    updateParentWithSelectedBlocks(selectedGroup, newFairnessTrees);
  };

  // Handle other input selection
  const handleOtherInputSelection = (
    inputBlock: ProjectInputBlock,
    inputId: string
  ) => {
    // If the input ID is the same, do nothing to avoid unnecessary updates
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    if (selectedOtherInputs[key] === inputId) {
      return;
    }

    const newOtherInputs = {
      ...selectedOtherInputs,
      [key]: inputId,
    };
    setSelectedOtherInputs(newOtherInputs);

    // Directly notify parent
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
    if (data && data.id && selectedPlugin) {
      const key = `${selectedPlugin.gid}-${selectedPlugin.cid}`;
      const newOtherInputs = {
        ...selectedOtherInputs,
        [key]: data.id.toString(),
      };
      setSelectedOtherInputs(newOtherInputs);

      // Notify parent of selection change directly
      updateParentWithSelectedBlocks(
        selectedGroup,
        selectedFairnessTrees,
        newOtherInputs
      );

      if (data.gid && data.cid && typeof data.data === 'object') {
        const result = await validateInputBlock(
          data.gid as string,
          data.cid as string,
          data.data as Record<string, unknown>,
          data.id as number
        );

        // Update validation results and notify parent in one go
        setValidationResults((prev) => {
          const newResults = {
            ...prev,
            [`${data.gid}-${data.cid}-${data.id}`]: result,
          };

          // Notify parent of validation change
          if (onValidationResultsChange) {
            onValidationResultsChange(newResults);
          }

          return newResults;
        });
      }
    }
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
        {requiredInputBlocks.some(
          (block) => block.gid === 'aiverify.stock.process_checklist'
        ) && (
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
        )}

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
                className="space-y-1">
                <div className="flex items-center justify-between gap-4">
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

            const isPluginInput = inputBlock.gid.startsWith('aiverify.plugin.');
            const pluginName = isPluginInput
              ? inputBlock.gid.split('.')[2]
              : null;

            return (
              <div
                key={key}
                className="space-y-1">
                <div className="flex items-center justify-between gap-4">
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
              </div>
            );
          })}
      </div>

      {/* Fairness Tree Modal */}
      {showFairnessTreeModal && currentFairnessTree && (
        <FairnessTreeModalWrapper
          isOpen={showFairnessTreeModal}
          onClose={() => {
            setShowFairnessTreeModal(false);
            // Force refresh to ensure the dropdown shows new fairness trees
            refreshData();
          }}
          gid={currentFairnessTree.gid}
          cid={currentFairnessTree.cid}
        />
      )}

      <PluginInputModal
        isOpen={!!selectedPlugin}
        onClose={(shouldRefresh) => {
          setSelectedPlugin(null);
          if (shouldRefresh) {
            refreshData();
          }
        }}
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
