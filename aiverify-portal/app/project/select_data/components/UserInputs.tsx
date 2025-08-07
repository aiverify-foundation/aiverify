'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useTransition } from 'react';
import { useMDXBundle } from '@/app/inputs/groups/[gid]/[group]/[groupId]/[cid]/hooks/useMDXBundle';
import {
  ValidationResults,
  validateInputBlock,
  processBatchValidations,
} from '@/app/project/select_data/utils/validationUtils';
import { InputBlockGroupData } from '@/app/types';
import { InputBlockData, InputBlock, InputBlock as ProjectInputBlock, Plugin } from '@/app/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { getPlugins } from '@/lib/fetchApis/getPlugins';
import PluginInputModal from './PluginInputModal';

// Enum for different types of input blocks
enum InputBlockType {
  GROUP_BASED = 'GROUP_BASED',
  SINGLE = 'SINGLE'
}

// Function to determine the type of an input block based on its properties
function getInputBlockType(block: ProjectInputBlock): InputBlockType {
  // Check if it's a group-based input block (has a group property)
  if (block.group) {
    return InputBlockType.GROUP_BASED;
  }
  
  // All non-grouped blocks are SINGLE type
  return InputBlockType.SINGLE;
}

// Add API call to submit input block group
async function submitInputBlockGroup(data: {
  gid: string;
  group: string;
  name: string;
  input_blocks: Array<{
    cid: string;
    data?: Record<string, unknown>;
  }>;
}) {
  try {
    console.log('data:', data);
    const response = await fetch('/api/input_block_data/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to submit input block group:', error);
    return null;
  }
}

interface UserInputsProps {
  projectId?: string | null;
  requiredInputBlocks: ProjectInputBlock[];
  onInputBlocksChange: (
    inputBlocks: Array<{
      gid: string;
      cid: string;
      id: number;
      group: string | null;
      isGroupSelection?: boolean;
      groupId?: number;
    }>
  ) => void;
  allInputBlockGroups: InputBlockGroupData[];
  allInputBlockDatas: InputBlockData[];
  flow: string;
  initialInputBlocks?: Array<{ gid: string; cid: string; id: number }>;
  onValidationResultsChange?: (results: ValidationResults) => void;
}

// Interface for input block properties from plugins
interface InputBlockProperties {
  width?: string;
  fullScreen?: boolean;
}

export default function UserInputs({
  requiredInputBlocks,
  onInputBlocksChange,
  allInputBlockGroups,
  allInputBlockDatas,
  initialInputBlocks = [],
  onValidationResultsChange,
  projectId,
  flow,
}: UserInputsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [, setPluginsData] = useState<Record<string, Plugin>>({});
  const [inputBlockProperties, setInputBlockProperties] = useState<Record<string, InputBlockProperties>>({});

  // Fetch plugins data to get input block properties
  useEffect(() => {
    const fetchPluginsData = async () => {
      try {
        const response = await getPlugins({ groupByPluginId: true });
        
        if ('status' in response && response.status === 'success' && 'data' in response) {
          const plugins = response.data as Record<string, Plugin>;
          setPluginsData(plugins);
          
          // Extract input block properties from plugins
          const properties: Record<string, InputBlockProperties> = {};
          
          Object.values(plugins).forEach((plugin: Plugin) => {
            if (plugin.input_blocks && Array.isArray(plugin.input_blocks)) {
              plugin.input_blocks.forEach((inputBlock: InputBlock) => {
                const key = `${plugin.gid}-${inputBlock.cid}`;
                properties[key] = {
                  width: inputBlock.width,
                  fullScreen: inputBlock.fullScreen,
                };
              });
            }
          });
          
          setInputBlockProperties(properties);
        }
      } catch (error) {
        console.error('Failed to fetch plugins data:', error);
      }
    };
    
    fetchPluginsData();
  }, []);

  // Initialize single input blocks based on initialInputBlocks
  const initialSingleInputs = (() => {
    const singleBlocks = initialInputBlocks.filter(
      (block) => {
        const matchingBlock = requiredInputBlocks.find(
          (reqBlock) => reqBlock.gid === block.gid && reqBlock.cid === block.cid
        );
        return matchingBlock && getInputBlockType(matchingBlock) === InputBlockType.SINGLE;
      }
    );

    return singleBlocks.reduce(
      (acc, block) => {
        const key = `${block.gid}-${block.cid}`;
        acc[key] = block.id.toString();
        return acc;
      },
      {} as { [key: string]: string }
    );
  })();

  // Initialize group input blocks based on initialInputBlocks
  const initialGroupInput = (() => {
    // Find group blocks in initialInputBlocks
    const groupBlocks = initialInputBlocks.filter(
      (block) => {
        const matchingBlock = requiredInputBlocks.find(
          (reqBlock) => reqBlock.gid === block.gid && reqBlock.cid === block.cid
        );
        return matchingBlock && getInputBlockType(matchingBlock) === InputBlockType.GROUP_BASED;
      }
    );

    console.log('Group blocks found in initialInputBlocks:', groupBlocks);

    if (groupBlocks.length === 0) return null;

    // Get the first group block (assuming one group selection at a time)
    const firstGroupBlock = groupBlocks[0];
    console.log('First group block:', firstGroupBlock);
    
    // Find the matching input block group from allInputBlockGroups
    // We need to find which group contains an input block with the same ID as firstGroupBlock.id
    const matchingGroup = allInputBlockGroups.find((group) => {
      return group.gid === firstGroupBlock.gid && 
             group.input_blocks && 
             group.input_blocks.some(ib => 
               ib.cid === firstGroupBlock.cid && 
               ib.id === firstGroupBlock.id
             );
    });
    
    console.log('Matching group from allInputBlockGroups:', matchingGroup);
    
    // If no direct match found, log for debugging
    if (!matchingGroup) {
      console.log('No matching group found for block:', firstGroupBlock);
      console.log('Available groups for debugging:', allInputBlockGroups.filter(g => g.gid === firstGroupBlock.gid));
      
      // Try to find all groups that have input blocks with the same gid and cid
      const candidateGroups = allInputBlockGroups.filter(group => 
        group.gid === firstGroupBlock.gid && 
        group.input_blocks && 
        group.input_blocks.some(ib => ib.cid === firstGroupBlock.cid)
      );
      
      console.log('Candidate groups with matching gid and cid:', candidateGroups);
      
      // For each candidate group, log which input block IDs they contain
      candidateGroups.forEach(group => {
        const matchingBlocks = group.input_blocks.filter(ib => ib.cid === firstGroupBlock.cid);
        console.log(`Group ${group.name} (ID: ${group.id}) contains blocks with IDs:`, matchingBlocks.map(ib => ib.id));
      });
    }
    
    return matchingGroup || null;
  })();

  // Add console logs for debugging
  console.log('=== UserInputs Initialization Debug ===');
  console.log('Required input blocks:', requiredInputBlocks);
  console.log('All input block groups:', allInputBlockGroups);
  console.log('Initial input blocks from project data:', initialInputBlocks);
  console.log('Initial group input resolved:', initialGroupInput);
  
  // Also log the individual input block IDs for easy reference
  console.log('Individual input block IDs from project:', initialInputBlocks.map(block => ({
    gid: block.gid,
    cid: block.cid,
    id: block.id
  })));
  
  // Log available groups with their input block IDs for comparison
  console.log('Available groups with their input block IDs:');
  allInputBlockGroups.forEach(group => {
    if (group.input_blocks) {
      console.log(`Group "${group.name}" (ID: ${group.id}):`, group.input_blocks.map(ib => ({
        cid: ib.cid,
        id: ib.id
      })));
    }
  });
  console.log('=== End Debug ===');

  const [selectedGroup, setSelectedGroup] = useState<InputBlockGroupData | null>(
    initialGroupInput
  );
  const [selectedSingleInputs, setSelectedSingleInputs] = useState<{
    [key: string]: string;
  }>(initialSingleInputs);

  // State for validation results
  const [validationResults, setValidationResults] = useState<ValidationResults>(
    {}
  );

  // Ref to prevent multiple validation updates
  const didRunValidationUpdate = React.useRef(false);

  const [showInputModal, setShowInputModal] = useState(false);
  const [currentInputBlock, setCurrentInputBlock] = useState<ProjectInputBlock | null>(null);

  const { data: mdxBundle } = useMDXBundle(
    currentInputBlock?.gid,
    currentInputBlock?.cid
  );

  // Group all input blocks by their group property
  const groupedInputBlocks = requiredInputBlocks.reduce(
    (acc, block) => {
      if (!block.group) return acc;

      if (!acc[block.group]) {
        acc[block.group] = {
          gid: block.gid,
          cid: block.cid,
          blocks: [],
        };
      }

      acc[block.group].blocks.push(block);
      return acc;
    },
    {} as Record<
      string,
      { gid: string; cid: string; blocks: ProjectInputBlock[] }
    >
  );

  // Extract unique groups from the required input blocks
  const requiredGroups = Object.keys(groupedInputBlocks);
  console.log('Required groups:', requiredGroups);
  console.log('Grouped input blocks:', groupedInputBlocks);

  // Find available input block groups for each required group
  const availableGroupSelections = requiredGroups.map((groupName) => {
    const groupData = allInputBlockGroups.filter((g) => g.group === groupName);
    console.log(`Available groups for ${groupName}:`, groupData);
    return {
      groupName,
      gid: groupedInputBlocks[groupName].gid,
      availableGroups: groupData,
    };
  });
  console.log('Available group selections:', availableGroupSelections);

  // Get single input blocks
  const singleInputBlocks = requiredInputBlocks.filter(
    (block) => getInputBlockType(block) === InputBlockType.SINGLE
  );

  // State to track when to fetch fresh data
  const [shouldFetchData, setShouldFetchData] = useState(false);

  // Effect to prevalidate all available input blocks on mount
  useEffect(() => {
    const prevalidateAllInputs = async () => {
      setValidationResults({});

      // Prevalidate all available input blocks for potential selection
      const allInputsToValidate = [
        ...allInputBlockDatas,
      ].map((input) => ({
        gid: input.gid,
        cid: input.cid,
        data: input.data,
        id: input.id,
      }));

      // Add group input blocks to validation
      allInputBlockGroups.forEach((group) => {
        if (group.input_blocks) {
          group.input_blocks.forEach((ib) => {
            allInputsToValidate.push({
              gid: group.gid,
              cid: ib.cid,
              data: ib.data,
              id: group.id, // Use the group ID directly, not a compound ID
            });
          });
        }
      });

      const results = await processBatchValidations(allInputsToValidate);
      setValidationResults(results);
    };

    prevalidateAllInputs();
  }, [allInputBlockDatas, allInputBlockGroups]);

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
    selectedGroup,
    selectedSingleInputs,
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
    newGroup: InputBlockGroupData | null,
    newSingleInputs: { [key: string]: string } = selectedSingleInputs
  ) => {
    console.log('Updating parent with selected blocks:', { newGroup, newSingleInputs });
    
    let selectedBlocks: Array<{
      gid: string;
      cid: string;
      id: number;
      group: string | null;
      isGroupSelection?: boolean;
      groupId?: number;
    }> = [];

    // Add selected checklists
    if (newGroup) {
      console.log('Adding group input blocks from:', newGroup);
      console.log('Looking for required input blocks with group:', newGroup.group);
      console.log('All required input blocks:', requiredInputBlocks.map(block => ({
        gid: block.gid,
        cid: block.cid,
        name: block.name,
        group: block.group
      })));
      
      // Find the required input blocks for this group to get the correct gid/cid
      const requiredBlocksForGroup = requiredInputBlocks.filter(
        (block) => block.group === newGroup.group
      );
      
      console.log('Required blocks for group:', requiredBlocksForGroup.map(block => ({
        gid: block.gid,
        cid: block.cid,
        name: block.name,
        group: block.group
      })));
      
      // Map each input block in the selected group to the corresponding required input block
      selectedBlocks = [
        ...selectedBlocks,
        ...requiredBlocksForGroup.map((requiredBlock) => {
          console.log(`Looking for individual input block for ${requiredBlock.gid}-${requiredBlock.cid}`);
          
          // Find the individual input block within the selected group that matches the required block
          const matchingGroupInputBlock = newGroup.input_blocks.find(
            (groupInputBlock) => groupInputBlock.cid === requiredBlock.cid
          );
          
          console.log('Found matching group input block:', matchingGroupInputBlock);
          
          if (matchingGroupInputBlock) {
            return {
              gid: requiredBlock.gid,  // Use the required input block's gid
              cid: requiredBlock.cid,  // Use the required input block's cid
              id: matchingGroupInputBlock.id,  // Use the individual input block's ID from the group
              group: newGroup.group,
              isGroupSelection: true,  // Flag to indicate this is from a group selection
              groupId: newGroup.id,    // Include the group ID for context
            };
          } else {
            // Fallback: if no matching input block found in the group
            console.warn(`No input block found in group for ${requiredBlock.gid}-${requiredBlock.cid}`);
            return {
              gid: requiredBlock.gid,
              cid: requiredBlock.cid,
              id: newGroup.id, // Use group ID as fallback (this will likely cause issues but is better than crashing)
              group: newGroup.group,
              isGroupSelection: true,
              groupId: newGroup.id,
            };
          }
        }),
      ];
    }

    // Add selected single inputs
    Object.entries(newSingleInputs).forEach(([key, inputId]) => {
      if (inputId) {
        const [gid, cid] = key.split('-');
        const block = requiredInputBlocks.find(
          (b) => b.gid === gid && b.cid === cid
        );
        
        if (block) {
          // Regular input block
          const inputBlock = allInputBlockDatas.find((ib) => ib.id?.toString() === inputId);
          if (inputBlock?.id) {
            selectedBlocks.push({
              gid,
              cid,
              id: inputBlock.id,
              group: null,
              isGroupSelection: false,
            });
          } else {
            selectedBlocks.push({
              gid,
              cid,
              id: parseInt(inputId),
              group: null,
              isGroupSelection: false,
            });
          }
        }
      }
    });

    console.log('Final selected blocks:', selectedBlocks);
    console.log('Final selected blocks detailed:', selectedBlocks.map(block => ({
      gid: block.gid,
      cid: block.cid,
      id: block.id,
      group: block.group,
      isGroupSelection: block.isGroupSelection,
      groupId: block.groupId
    })));
    onInputBlocksChange(selectedBlocks);
  };

  // Handle checklist group selection
  const handleGroupSelection = (groupName: string, groupId: string) => {
    console.log('handleGroupSelection called with:', { groupName, groupId });
    
    // If groupId is empty, user is deselecting the group
    if (!groupId) {
      console.log('Deselecting group');
      setSelectedGroup(null);
      
      // Call updateParentWithSelectedBlocks with null group but keep single inputs
      updateParentWithSelectedBlocks(null, selectedSingleInputs);
      return;
    }
    
    // Find the selected group in allInputBlockGroups
    const group = allInputBlockGroups.find((g) => g.id?.toString() === groupId);
    console.log('Found group:', group);

    if (!group) {
      console.error('Unable to find group with ID:', groupId);
      return;
    }

    // If the group is the same, do nothing to avoid unnecessary updates
    if (selectedGroup?.id === group.id) {
      console.log('Group already selected, no update needed');
      return;
    }

    console.log('Setting selected group to:', group);
    setSelectedGroup(group);

    // Use updateParentWithSelectedBlocks to include both group and single inputs
    updateParentWithSelectedBlocks(group, selectedSingleInputs);
  };

  // Handle single input selection
  const handleSingleInputSelection = (
    inputBlock: ProjectInputBlock,
    inputId: string
  ) => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    // If the input ID is the same, do nothing to avoid unnecessary updates
    if (selectedSingleInputs[key] === inputId) {
      return;
    }

    const newSingleInputs = {
      ...selectedSingleInputs,
      [key]: inputId,
    };
    setSelectedSingleInputs(newSingleInputs);

    // Build selected blocks and notify parent directly
    updateParentWithSelectedBlocks(selectedGroup, newSingleInputs);
  };

  const getAvailableInputsForBlock = (inputBlock: ProjectInputBlock) => {
    return allInputBlockDatas.filter(
      (block) => block.gid === inputBlock.gid && block.cid === inputBlock.cid
    );
  };

  const handleAddInput = (inputBlock: ProjectInputBlock) => {
    setCurrentInputBlock(inputBlock);
    setShowInputModal(true);
  };

  const handleInputModalClose = (shouldRefresh = false) => {
    setCurrentInputBlock(null);
    setShowInputModal(false);
    
    // Only refresh if explicitly requested and not already triggered by handleInputSubmit
    if (shouldRefresh && !shouldFetchData) {
      refreshData();
    }
  };

  const handleInputSubmit = async (data: Record<string, unknown>) => {
    if (data && data.id && currentInputBlock) {
      const key = `${currentInputBlock.gid}-${currentInputBlock.cid}`;
      const newSingleInputs = {
        ...selectedSingleInputs,
        [key]: data.id.toString(),
      };
      setSelectedSingleInputs(newSingleInputs);

      // Force a router refresh to get the latest data from the server
      router.refresh();
      
      // Wait for the router refresh to complete before notifying parent
      // This ensures the parent component has access to the latest data
      setTimeout(() => {
        // Notify parent of selection change after refresh
        updateParentWithSelectedBlocks(selectedGroup, newSingleInputs);
        
        // Also validate the input block
        if (data.gid && data.cid && typeof data.data === 'object') {
          validateInputBlock(
            data.gid as string,
            data.cid as string,
            data.data as Record<string, unknown>,
            data.id as number
          ).then(result => {
            // Update validation results and notify parent
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
          });
        }
      }, 300); // Small delay to ensure refresh completes
    }
  };

  // Function to handle creating a new input block group
  const handleAddNewInputBlockGroup = (groupName: string, gid: string) => {
    console.log('Creating new input block group:', { groupName, gid });

    // Verify the gid is not empty
    if (!gid) {
      console.error(
        'Cannot create input block group: gid is empty for group',
        groupName
      );
      alert(`Cannot create input block: Missing information for ${groupName}`);
      return;
    }

    startTransition(async () => {
      const payload = {
        gid: gid,
        group: groupName,
        name: groupName,
        input_blocks: [],
      };

      console.log('Submitting payload:', payload);

      const res = await submitInputBlockGroup(payload);

      console.log('API response:', res);
      if (res && res['id']) {
        const encodedGID = encodeURIComponent(gid);
        const encodedGroup = encodeURIComponent(groupName);
        const groupId = res['id'];

        // Redirect to the edit page for the newly created input block group
        // Add flow and projectId query parameters if they exist
        let url = `/inputs/groups/${encodedGID}/${encodedGroup}/${groupId}`;
        
        // Check if flow and projectId are provided in the props
        const queryParams = new URLSearchParams();
        if (flow) {
          queryParams.append('flow', flow);
        }
        if (projectId) {
          queryParams.append('projectId', projectId);
        }
        
        // Append query parameters if any exist
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        window.location.href = url;
      } else {
        console.error('Failed to create input block group. API response:', res);
        alert('Failed to create input block. Please try again.');
      }
    });
  };

  // Get input block properties
  const getInputBlockProps = (inputBlock: ProjectInputBlock): InputBlockProperties => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    console.log('Getting properties for input block:', inputBlock);
    console.log('Input block key:', key);
    console.log('Available properties:', inputBlockProperties);
    console.log('Returning properties:', inputBlockProperties[key] || {});
    return inputBlockProperties[key] || {};
  };

  // Helper function to render a single input block
  const renderSingleInputBlock = (inputBlock: ProjectInputBlock) => {
    const key = `${inputBlock.gid}-${inputBlock.cid}`;
    const selectedInputId = selectedSingleInputs[key] || '';
    const availableInputs = getAvailableInputsForBlock(inputBlock);
    
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
                handleSingleInputSelection(inputBlock, e.target.value)
              }
              className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-gray-300">
              <option value="">Choose User Input</option>
              {availableInputs.map((input, index) => (
                <option
                  key={input.id || `input-${index}`}
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
  };

  if (currentInputBlock) {
    console.log("currentInputBlock", currentInputBlock);
    console.log("getInputBlockProps", getInputBlockProps(currentInputBlock));
  }

  // Effect to update parent with selected blocks when component mounts
  useEffect(() => {
    console.log('Initial mount effect - updating parent with selected blocks');
    if (initialGroupInput || Object.keys(initialSingleInputs).length > 0) {
      updateParentWithSelectedBlocks(initialGroupInput, initialSingleInputs);
    }
    // Only run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log the selectedGroup state after it's been set and update parent if needed
  useEffect(() => {
    console.log('Selected group state updated:', selectedGroup);
    
    // If selectedGroup is null and we previously had a group selection,
    // make sure to update the parent with the current selections
    if (!selectedGroup) {
      updateParentWithSelectedBlocks(null, selectedSingleInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  // Effect to update parent when allInputBlockDatas changes and we have selected inputs
  useEffect(() => {
    // Only run if we have selected inputs and allInputBlockDatas has been loaded
    if (Object.keys(selectedSingleInputs).length > 0 && allInputBlockDatas.length > 0) {
      //console.log('allInputBlockDatas changed, updating parent with current selections');
      updateParentWithSelectedBlocks(selectedGroup, selectedSingleInputs);
    }
  }, [allInputBlockDatas]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-lg border border-secondary-500 bg-secondary-950 p-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-white">User Inputs</h2>
        <p className="mb-6 text-sm text-gray-400">
          Upload new User Input or select existing User Input.
        </p>
      </div>

      <div className="space-y-4">
        {/* Group-based Input Blocks */}
        {availableGroupSelections.map((groupSelection) => {
          const dropdownValue = selectedGroup &&
            selectedGroup.group === groupSelection.groupName
              ? selectedGroup.id?.toString() || ''
              : '';
          
          console.log('Group selection dropdown:', {
            groupName: groupSelection.groupName,
            selectedGroup,
            dropdownValue,
            availableGroups: groupSelection.availableGroups
          });
          
          return (
            <div
              className="flex items-center justify-between gap-4"
              key={groupSelection.groupName}>
              <label className="w-64 text-white">
                {groupSelection.groupName}
              </label>
              <div className="relative flex-1">
                <select
                  value={dropdownValue}
                  onChange={(e) =>
                    handleGroupSelection(groupSelection.groupName, e.target.value)
                  }
                  className="w-full cursor-pointer appearance-none rounded bg-secondary-900 p-3 pr-10 text-gray-300">
                  <option value="">Choose User Input</option>
                  {groupSelection.availableGroups.map((group, index) => (
                    <option
                      key={group.id || `group-${index}`}
                      value={group.id?.toString() || ''}>
                      {group.name}
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
                text={
                  isPending
                    ? 'CREATING...'
                    : !groupSelection.gid
                      ? 'MISSING GID'
                      : 'ADD INPUT'
                }
                size="xs"
                pill
                onClick={() =>
                  handleAddNewInputBlockGroup(
                    groupSelection.groupName,
                    groupSelection.gid
                  )
                }
                disabled={isPending || !groupSelection.gid}
              />
            </div>
          );
        })}

        {/* Single Input Blocks */}
        {singleInputBlocks.map((inputBlock) => (
          <div key={`${inputBlock.gid}-${inputBlock.cid}`}>
            {renderSingleInputBlock(inputBlock)}
          </div>
        ))}
      </div>

      {/* Input Modal - will render the appropriate modal based on input block type */}
      {showInputModal && currentInputBlock && (
        <PluginInputModal
          isOpen={showInputModal}
          onClose={(shouldRefresh) => {
            handleInputModalClose(shouldRefresh);
          }}
          pluginName={currentInputBlock.name || ''}
          inputBlockName={currentInputBlock.cid || ''}
          mdxContent={mdxBundle?.code || ''}
          onSubmit={handleInputSubmit}
          gid={currentInputBlock.gid || ''}
          cid={currentInputBlock.cid || ''}
          width={currentInputBlock.width}
          fullScreen={currentInputBlock.fullScreen}
        />
      )}
    </div>
  );
}
