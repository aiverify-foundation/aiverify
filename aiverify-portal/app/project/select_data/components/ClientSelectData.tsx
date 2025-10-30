'use client';

import { RiArrowLeftLine, RiArrowRightLine } from '@remixicon/react';
import { RiAlertLine } from '@remixicon/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TestModel } from '@/app/models/utils/types';
import { InputBlockGroupData } from '@/app/types';
import { Algorithm, InputBlock, InputBlockData } from '@/app/types';
import { TestResult } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Button } from '@/lib/components/TremurButton';
import { patchProject } from '@/lib/fetchApis/getProjects';
import ModelSelection from './ModelSelection';
import TestResults from './TestResults';
import UserInputs from './UserInputs';

interface ClientSelectDataProps {
  projectId: string;
  requiredAlgorithms: Algorithm[];
  requiredInputBlocks: InputBlock[];
  allModels: TestModel[];
  allTestResults: TestResult[];
  allInputBlockGroups: InputBlockGroupData[];
  allInputBlockDatas: InputBlockData[];
  flow: string;
  initialModelId?: string;
  initialTestResults?: { id: number; gid: string; cid: string }[];
  initialInputBlocks?: { id: number; gid: string; cid: string }[];
  hasVisitedDataSelection?: boolean;
}

export type SelectedTestResult = {
  gid: string;
  cid: string;
  id: number;
};

export type SelectedInputBlock = {
  gid: string;
  cid: string;
  id: number;
  group?: string | null;
  isGroupSelection?: boolean;
  groupId?: number;
};

// Validation type
export type ValidationResult = {
  isValid: boolean;
  message: string;
  progress: number;
};

// Validation results map
export type ValidationResults = {
  [key: string]: ValidationResult;
};

export default function ClientSelectData({
  projectId,
  requiredAlgorithms,
  requiredInputBlocks,
  allModels,
  allTestResults,
  allInputBlockGroups,
  allInputBlockDatas,
  flow,
  initialModelId,
  initialTestResults = [],
  initialInputBlocks = [],
}: ClientSelectDataProps) {
  const router = useRouter();
  
  console.log('ClientSelectData received props:', {
    initialModelId,
    initialTestResults,
    initialInputBlocks,
  });

  // Debug: Log the required input blocks to see their group properties
  console.log('=== DEBUGGING REQUIRED INPUT BLOCKS ===');
  console.log('Total required input blocks:', requiredInputBlocks.length);
  requiredInputBlocks.forEach((block, index) => {
    console.log(`Required Input Block ${index + 1}:`, {
      gid: block.gid,
      cid: block.cid,
      name: block.name,
      group: block.group,
      fullBlock: block
    });
  });
  console.log('=== END DEBUGGING ===');

  // State for model selection
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    initialModelId
  );

  // State for test results selection
  const [selectedTestResults, setSelectedTestResults] = useState<
    SelectedTestResult[]
  >(
    initialTestResults.map((result) => ({
      gid: result.gid,
      cid: result.cid,
      id: result.id,
    }))
  );

  // State for validation results
  const [validationResults, setValidationResults] = useState<ValidationResults>(
    {}
  );

  // Track if there are any validation errors
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  // Track invalid input block names and messages
  type InvalidInputBlock = { name: string; message: string; type: string };
  const [invalidInputBlocks, setInvalidInputBlocks] = useState<
    InvalidInputBlock[]
  >([]);

  // State for input blocks selection
  const [selectedInputBlocks, setSelectedInputBlocks] = useState<
    SelectedInputBlock[]
  >(() => {
    
    // Initialize with group detection logic
    return initialInputBlocks.map((block) => {

      // Check if this block belongs to a group by looking through allInputBlockGroups
      const matchingGroup = allInputBlockGroups.find(group => {
        return group.gid === block.gid && 
               group.input_blocks.some(ib => ib.id === block.id);
      });

      if (matchingGroup) {
        // Check if all blocks in this group are present in initialInputBlocks
        const groupBlockIds = matchingGroup.input_blocks.map(ib => ib.id);
        const allGroupBlocksPresent = groupBlockIds.every(groupBlockId =>
          initialInputBlocks.some(initBlock => initBlock.id === groupBlockId)
        );

        if (allGroupBlocksPresent) {
          // This is a group selection
          return {
            gid: block.gid,
            cid: block.cid,
            id: block.id,
            isGroupSelection: true,
            groupId: matchingGroup.id,
            group: matchingGroup.group,
          };
        }
      }

      // Individual selection
      return {
        gid: block.gid,
        cid: block.cid,
        id: block.id,
      };
    });
  });

  // Add useEffect hooks to sync state with props when they change
  useEffect(() => {
    console.log('initialModelId prop changed:', initialModelId);
    setSelectedModelId(initialModelId);
  }, [initialModelId]);

  useEffect(() => {
    console.log('initialTestResults prop changed:', initialTestResults);
    const newTestResults = initialTestResults.map((result) => ({
      gid: result.gid,
      cid: result.cid,
      id: result.id,
    }));
    setSelectedTestResults(newTestResults);
  }, [initialTestResults]);

  useEffect(() => {
    console.log('initialInputBlocks prop changed:', initialInputBlocks);
    const newInputBlocks = initialInputBlocks.map((block) => {
      // Check if this block belongs to a group by looking through allInputBlockGroups
      const matchingGroup = allInputBlockGroups.find(group => {
        return group.gid === block.gid && 
               group.input_blocks.some(ib => ib.id === block.id);
      });

      if (matchingGroup) {
        // Check if all blocks in this group are present in initialInputBlocks
        const groupBlockIds = matchingGroup.input_blocks.map(ib => ib.id);
        const allGroupBlocksPresent = groupBlockIds.every(groupBlockId =>
          initialInputBlocks.some(initBlock => initBlock.id === groupBlockId)
        );

        if (allGroupBlocksPresent) {
          // This is a group selection
          return {
            gid: block.gid,
            cid: block.cid,
            id: block.id,
            isGroupSelection: true,
            groupId: matchingGroup.id,
            group: matchingGroup.group,
          };
        }
      }

      // Individual selection
      return {
        gid: block.gid,
        cid: block.cid,
        id: block.id,
      };
    });
    setSelectedInputBlocks(newInputBlocks);
  }, [initialInputBlocks, allInputBlockGroups]);

  // Add effect to refresh data when component mounts or when user navigates back
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking if data refresh is needed');
        // Clear any existing timeout
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        // Debounce the refresh to avoid rapid calls
        refreshTimeout = setTimeout(() => {
          console.log('Refreshing data to ensure latest selections are shown');
          router.refresh();
        }, 300); // 300ms delay
      }
    };

    // Add event listener for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check if we need to refresh on mount by comparing timestamps
    const lastSave = localStorage.getItem(`lastSave_${projectId}`);
    const lastRefresh = localStorage.getItem(`lastRefresh_${projectId}`);
    
    if (lastSave && lastRefresh) {
      const saveTime = parseInt(lastSave);
      const refreshTime = parseInt(lastRefresh);
      
      // Only refresh if the last save was more recent than the last refresh
      if (saveTime > refreshTime) {
        console.log('Detected stale data, refreshing to get latest selections');
        router.refresh();
        localStorage.setItem(`lastRefresh_${projectId}`, Date.now().toString());
      }
    } else {
      // If no timestamps found, refresh once on mount
      console.log('No refresh history found, refreshing to ensure latest selections');
      router.refresh();
      localStorage.setItem(`lastRefresh_${projectId}`, Date.now().toString());
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [router, projectId]);

  // Process validation results whenever they change
  useEffect(() => {
    if (Object.keys(validationResults).length > 0) {
      console.log('ValidationResults changed in useEffect:', validationResults);
      processValidationResults(validationResults);
    }
  }, [validationResults]);

  // Also process validation results whenever selected input blocks change
  useEffect(() => {
    if (Object.keys(validationResults).length > 0) {
      console.log(
        'SelectedInputBlocks changed, reprocessing validation:',
        selectedInputBlocks
      );
      console.log('Available validation result keys:', Object.keys(validationResults));
      console.log('Looking for validation keys:', selectedInputBlocks.map(block => `${block.gid}-${block.cid}-${block.id}`));
      processValidationResults(validationResults);
    }
  }, [selectedInputBlocks]);

  console.log('ClientSelectData initialized states:', {
    selectedModelId,
    selectedTestResults,
    selectedInputBlocks,
  });

  // Debug: Log the required input blocks to see their names
  console.log('Required input blocks with names:', 
    requiredInputBlocks.map(block => ({
      gid: block.gid,
      cid: block.cid, 
      name: block.name,
      group: block.group
    }))
  );

  // Add a function to save selections to API
  const saveSelectionsToAPI = async (
    modelId?: string,
    testResults?: SelectedTestResult[],
    inputBlocks?: SelectedInputBlock[]
  ) => {
    if (!projectId) return;

    try {
      // Use current state if parameters not provided
      const currentModelId = modelId !== undefined ? modelId : selectedModelId;
      const currentTestResults = testResults !== undefined ? testResults : selectedTestResults;
      const currentInputBlocks = inputBlocks !== undefined ? inputBlocks : selectedInputBlocks;

      // Transform the data for backend saving - always use individual input block IDs
      const transformedDataForBackend = {
        testModelId: currentModelId ? parseInt(currentModelId) : null,
        testResults: currentTestResults.map((result) => result.id),
        inputBlocks: currentInputBlocks.map((block) => block.id), // Use individual IDs for backend
      };

      console.log('Auto-saving selections to API:', transformedDataForBackend);

      // Send all changes in a single patch request using individual IDs
      await patchProject(projectId, transformedDataForBackend);
      console.log('Auto-save completed successfully');
      
      // Update the last save timestamp
      localStorage.setItem(`lastSave_${projectId}`, Date.now().toString());
    } catch (error) {
      console.error('Failed to auto-save selections:', error);
      // Note: We're not showing user-facing errors for auto-save to avoid interrupting UX
    }
  };

  const handleModelChange = (modelId: string | undefined) => {
    setSelectedModelId(modelId);

    // Instead of clearing all test results, filter out those that don't match the new model
    let validTestResults = selectedTestResults;
    if (modelId) {
      const selectedModel = allModels.find(
        (model) => model.id.toString() === modelId
      );
      if (selectedModel) {
        validTestResults = selectedTestResults.filter((result) => {
          const testResult = allTestResults.find((tr) => tr.id === result.id);
          return (
            testResult &&
            testResult.testArguments.modelFile === selectedModel.name
          );
        });
        setSelectedTestResults(validTestResults);
      } else {
        // If no model is found, clear the test results
        validTestResults = [];
        setSelectedTestResults([]);
      }
    } else {
      // If no model is selected, clear the test results
      validTestResults = [];
      setSelectedTestResults([]);
    }

    // Auto-save the model selection and updated test results
    saveSelectionsToAPI(modelId, validTestResults, selectedInputBlocks);
  };

  const handleTestResultsChange = (testResults: SelectedTestResult[]) => {
    setSelectedTestResults(testResults);
    
    // Auto-save the test results selection
    saveSelectionsToAPI(selectedModelId, testResults, selectedInputBlocks);
  };

  const handleInputBlocksChange = (inputBlocks: SelectedInputBlock[]) => {
    console.log('ClientSelectData received input blocks:', inputBlocks.map(block => ({
      gid: block.gid,
      cid: block.cid,
      id: block.id,
      group: block.group
    })));
    setSelectedInputBlocks(inputBlocks);

    // Auto-save the input blocks selection
    saveSelectionsToAPI(selectedModelId, selectedTestResults, inputBlocks);
  };

  // Handler to receive validation results from UserInputs
  const handleValidationResultsChange = (results: ValidationResults) => {
    console.log('ClientSelectData received validation results:', results);

    // Only update if the results have actually changed
    // Use a batch update approach to avoid expensive comparisons
    const resultsKeys = Object.keys(results);
    const currentKeys = Object.keys(validationResults);

    // Quick check if the number of keys is different
    if (resultsKeys.length !== currentKeys.length) {
      requestAnimationFrame(() => {
        setValidationResults(results);
      });
      return;
    }

    // Check if any keys or validation statuses have changed
    const hasChanged = resultsKeys.some((key) => {
      return (
        !validationResults[key] ||
        validationResults[key].isValid !== results[key].isValid ||
        validationResults[key].message !== results[key].message ||
        validationResults[key].progress !== results[key].progress
      );
    });

    if (hasChanged) {
      requestAnimationFrame(() => {
        setValidationResults(results);
      });
    }
  };

  // Function to process validation results and update invalid blocks list
  const processValidationResults = (
    results: ValidationResults,
    currentSelectedBlocksJson?: string
  ) => {
    // If no input blocks are required, don't show any validation errors
    if (requiredInputBlocks.length === 0) {
      setHasValidationErrors(false);
      setInvalidInputBlocks([]);
      return;
    }

    // Always use the current selectedInputBlocks from state unless explicitly overridden
    const blocksToCheck = currentSelectedBlocksJson
      ? JSON.parse(currentSelectedBlocksJson)
      : selectedInputBlocks;

    // If no input blocks are selected, don't show any validation errors
    if (!blocksToCheck || blocksToCheck.length === 0) {
      setHasValidationErrors(false);
      setInvalidInputBlocks([]);
      return;
    }

    console.log('=== PROCESSING VALIDATION RESULTS ===');
    console.log('Validation results received:', results);
    console.log('Selected input blocks to check:', blocksToCheck);

    // Create validation keys for matching - use groupId for group selections, individual id for others
    const validationKeys = blocksToCheck.map((block: SelectedInputBlock) => {
      // For group selections, use the groupId for validation matching
      if (block.isGroupSelection && block.groupId) {
        return `${block.gid}-${block.cid}-${block.groupId}`;
      }
      // For individual selections, use the individual id
      return `${block.gid}-${block.cid}-${block.id}`;
    });
    
    console.log('Validation keys for matching:', validationKeys);

    // Collect names and messages of invalid input blocks, grouped by type
    const invalidBlocks: InvalidInputBlock[] = [];

    // Function to find input block name by gid, cid and id
    const findInputBlockInfo = (
      gid: string,
      cid: string,
      id?: number
    ): { name: string; type: string } => {
      console.log(`=== FINDING INPUT BLOCK INFO FOR ${gid}-${cid} ===`);
      
      // Default fallback values
      let type = 'Input Block';
      let name = cid;

      // Find the matching required input block using BOTH gid and cid to ensure uniqueness
      const requiredInputBlock = requiredInputBlocks.find(
        (block) => block.gid === gid && block.cid === cid
      );

      // Debug: Log all available required input blocks for comparison
      console.log(`Looking for gid: "${gid}", cid: "${cid}"`);
      console.log('Available required input blocks:');
      requiredInputBlocks.forEach((block, index) => {
        console.log(`  [${index}] gid: "${block.gid}", cid: "${block.cid}", name: "${block.name}", group: "${block.group}"`);
        console.log(`    gid match: ${block.gid === gid}, cid match: ${block.cid === cid}`);
      });

      // Use the required input block's group as the type/category if available,
      // otherwise fall back to the name
      if (requiredInputBlock) {
        type = requiredInputBlock.group || requiredInputBlock.name;
        console.log(`✅ Found required input block for ${gid}-${cid}:`, {
          name: requiredInputBlock.name,
          group: requiredInputBlock.group,
          resolvedType: type
        });
      } else {
        console.log(`❌ No required input block found for gid: "${gid}", cid: "${cid}"`);
        
        // FALLBACK: Check if we can find group information from selectedInputBlocks
        const selectedBlock = selectedInputBlocks.find(
          (block) => block.gid === gid && block.cid === cid
        );
        
        if (selectedBlock && selectedBlock.group) {
          type = selectedBlock.group;
          console.log(`✅ Using group from selectedInputBlocks: "${type}"`);
        } else {
          console.log('This will fall back to type: "Input Block"');
        }
      }

      // If we have an ID, try to find the actual instance name from allInputBlockDatas
      if (id !== undefined) {
        const inputBlock = allInputBlockDatas.find(
          (i) => i.gid === gid && i.cid === cid && i.id === id
        );
        if (inputBlock) {
          name = inputBlock.name || cid;
          console.log(`Found input block data for ${gid}-${cid}-${id}:`, {
            name: inputBlock.name,
            finalName: name
          });
        } else {
          console.warn(`No input block data found for gid: ${gid}, cid: ${cid}, id: ${id}`);
        }
      }

      console.log(`=== FINAL RESULT FOR ${gid}-${cid}: name="${name}", type="${type}" ===`);
      return { name, type };
    };

    // Check if any selected input has a validation error
    let hasErrors = false;

    // Collect names and messages of invalid inputs, but only for selected input blocks
    Object.entries(results).forEach(([key, result]) => {
      // Only process results for invalid blocks
      if (!result.isValid) {
        console.log(`Processing validation result for key: ${key}`, result);
        
        // Check if this validation key matches any of our validation keys
        const isSelected = validationKeys.includes(key);
        
        console.log(`Validation key: ${key}, isSelected: ${isSelected}`);
        console.log(`Available validation keys for matching:`, validationKeys);

        if (!isSelected) {
          console.log(`  Skipping validation result - not selected`);
          return; // Skip this validation result if it's not for a selected input block
        }

        console.log(`  ✅ VALIDATION ERROR DETECTED FOR SELECTED BLOCK`);
        // Mark that we have errors for selected blocks
        hasErrors = true;

        // Parse the key to extract gid, cid, and id for finding block info
        const keyParts = key.split('-');
        let gid = '';
        let cid = '';
        let id: string | undefined;

        if (keyParts.length >= 3) {
          // Key format: gid-cid-id or gid-cid-more-parts-id
          // Since gid and cid can contain dots, we need to be smarter about parsing
          // The last part should be the numeric ID if it exists
          const lastPart = keyParts[keyParts.length - 1];
          
          // Check if the last part is a numeric ID
          if (/^\d+$/.test(lastPart)) {
            // Key includes ID: gid-cid-id (where gid or cid might contain dashes)
            id = lastPart;
            // Join all parts except the last one, then split by the last occurrence of '-'
            const gidCidPart = keyParts.slice(0, -1).join('-');
            
            // Find the split point by matching against known gid-cid combinations
            let foundMatch = false;
            
            // Try to match against all known input block data
            for (const inputBlockData of allInputBlockDatas) {
              const expectedPrefix = `${inputBlockData.gid}-${inputBlockData.cid}`;
              if (gidCidPart === expectedPrefix) {
                gid = inputBlockData.gid;
                cid = inputBlockData.cid;
                foundMatch = true;
                break;
              }
            }
            
            // If not found, try selected blocks
            if (!foundMatch) {
              for (const block of blocksToCheck) {
                const expectedPrefix = `${block.gid}-${block.cid}`;
                if (gidCidPart === expectedPrefix) {
                  gid = block.gid;
                  cid = block.cid;
                  foundMatch = true;
                  break;
                }
              }
            }
            
            if (!foundMatch) {
              console.warn(`Could not parse gid-cid from key: ${key}`);
              return;
            }
          } else {
            // Key is just gid-cid (no numeric ID at the end)
            // Try to match against all known gid-cid combinations
            let foundMatch = false;
            
            // Try all input block data
            for (const inputBlockData of allInputBlockDatas) {
              const expectedKey = `${inputBlockData.gid}-${inputBlockData.cid}`;
              if (key === expectedKey) {
                gid = inputBlockData.gid;
                cid = inputBlockData.cid;
                id = undefined;
                foundMatch = true;
                break;
              }
            }
            
            // If not found, try selected blocks
            if (!foundMatch) {
              for (const block of blocksToCheck) {
                const expectedKey = `${block.gid}-${block.cid}`;
                if (key === expectedKey) {
                  gid = block.gid;
                  cid = block.cid;
                  id = undefined;
                  foundMatch = true;
                  break;
                }
              }
            }
            
            if (!foundMatch) {
              console.warn(`Could not match key against any blocks: ${key}`);
              return;
            }
          }
        } else {
          // Invalid key format
          console.error(`Invalid validation result key format: ${key} - expected at least gid-cid format`);
          return;
        }

        const { name, type } = findInputBlockInfo(
          gid,
          cid,
          id ? parseInt(id) : undefined
        );

        // Avoid duplicate entries
        if (!invalidBlocks.some((block) => block.name === name)) {
          const invalidBlock = {
            name,
            message: result.message,
            type: type,
          };
          invalidBlocks.push(invalidBlock);
          console.log(`Added invalid block:`, invalidBlock);
        }
      }
    });

    console.log('Invalid input blocks after processing:', invalidBlocks);
    console.log('=== FINAL GROUPING DEBUG ===');
    const groupedForDebug = invalidBlocks.reduce((acc, block) => {
      if (!acc[block.type]) {
        acc[block.type] = [];
      }
      acc[block.type].push({
        name: block.name,
        message: block.message
      });
      return acc;
    }, {} as Record<string, Array<{name: string, message: string}>>);
    console.log('Final grouped invalid blocks:', groupedForDebug);
    console.log(`Has validation errors: ${hasErrors}`);
    console.log('=== END FINAL GROUPING DEBUG ===');
    
    setHasValidationErrors(hasErrors);
    setInvalidInputBlocks(invalidBlocks);
  };

  const handleNext = async () => {
    if (!projectId) return;

    try {
      // Since we're already auto-saving, we just need to handle navigation
      // But let's do a final save to ensure everything is up to date
      await saveSelectionsToAPI();
      
      console.log('Final save completed, proceeding to navigation');

      // For URL construction, use group context when available
      const inputBlockIdsForUrl = selectedInputBlocks.map((block) => {
        // If this is a group selection, use the group ID for URL consistency
        // This helps the designer understand the group context
        if (block.isGroupSelection && block.groupId) {
          return block.groupId;
        }
        // For individual selections, use the individual ID
        return block.id;
      });

      console.log('inputBlocks for URL (with group context):', inputBlockIdsForUrl);

      // Update flow based on current flow
      let updatedFlow = flow;
      if (flow === UserFlows.EditExistingProject) {
        updatedFlow = UserFlows.EditExistingProjectWithResults;
      } else if (flow === UserFlows.NewProjectWithNewTemplate) {
        updatedFlow = UserFlows.NewProjectWithNewTemplateAndResults;
      } else if (flow === UserFlows.NewProjectWithExistingTemplate) {
        updatedFlow = UserFlows.NewProjectWithExistingTemplateAndResults;
      } else if (flow === UserFlows.NewProjectWithEditingExistingTemplate) {
        updatedFlow = UserFlows.NewProjectWithEditingExistingTemplateAndResults;
      }
      
      // Construct the URL with group-context data for designer
      const queryString = [
        `flow=${encodeURIComponent(updatedFlow)}`,
        `projectId=${encodeURIComponent(projectId)}`,
        ...(selectedModelId
          ? [`modelId=${encodeURIComponent(selectedModelId)}`]
          : []),
        // Always include testResultIds parameter, even if empty
        `testResultIds=${selectedTestResults.map((r) => r.id).join(',')}`,
        // Use group-context IDs for URL to help designer understand group relationships
        `iBlockIds=${inputBlockIdsForUrl.join(',')}`,
      ].join('&');

      if (updatedFlow === UserFlows.EditExistingProjectWithResults) {
        window.location.href = `/canvas?${queryString}&mode=view`;
      } else {
        window.location.href = `/canvas?${queryString}&mode=view`;
      }
    } catch (error) {
      console.error('Failed to complete navigation:', error);
      // You might want to show an error message to the user here
    }
  };

  let backButtonLink = `/templates?flow=${flow}&=projectId=${projectId}`;
  if (
    flow === UserFlows.NewProjectWithNewTemplate ||
    flow === UserFlows.NewProjectWithNewTemplateAndResults ||
    flow === UserFlows.NewProjectWithEditingExistingTemplate ||
    flow === UserFlows.NewProjectWithEditingExistingTemplateAndResults ||
    flow === UserFlows.EditExistingProject ||
    flow === UserFlows.EditExistingProjectWithResults
  ) {
    backButtonLink = `/canvas?flow=${flow}&projectId=${projectId}&mode=edit`;
  } else {
    backButtonLink = `/templates?flow=${flow}&projectId=${projectId}`;
  }
  console.log('backButtonLink', backButtonLink);

  console.log('requiredinputblocks length', requiredInputBlocks);
  console.log('selectedinputblocks length', selectedInputBlocks);
  console.log(
    'requiredInputBlocks.length === 0 || requiredInputBlocks.length === selectedInputBlocks.length',
    requiredInputBlocks.length === 0 ||
      requiredInputBlocks.length === selectedInputBlocks.length
  );
  console.log('hasValidationErrors', hasValidationErrors);
  console.log('invalidInputBlocks.length', invalidInputBlocks.length);
  console.log(
    'flag',
    requiredInputBlocks.length === 0 &&
      !hasValidationErrors &&
      invalidInputBlocks.length === 0
  );

  // Get the selected model object
  const selectedModel = selectedModelId
    ? allModels.find((model) => model.id.toString() === selectedModelId)
    : undefined;

  return (
    <div className="flex max-w-[1000px] flex-col gap-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">
          Select the Model, Test Results and User Input
        </h1>
        <p className="text-secondary-300">
          Please select the AI Model, Test Result(s) and User Input(s) required
          for report generation.
        </p>
      </div>

      <div className="space-y-6">
        <ModelSelection
          projectId={projectId}
          flow={flow}
          selectedModelId={selectedModelId}
          onModelChange={handleModelChange}
          models={allModels}
        />
        <TestResults
          projectId={projectId}
          flow={flow}
          requiredAlgorithms={requiredAlgorithms}
          onTestResultsChange={handleTestResultsChange}
          allTestResults={allTestResults}
          selectedModel={selectedModel}
          initialTestResults={selectedTestResults}
        />
        <UserInputs
          projectId={projectId}
          flow={flow}
          requiredInputBlocks={requiredInputBlocks}
          onInputBlocksChange={handleInputBlocksChange}
          allInputBlockGroups={allInputBlockGroups}
          allInputBlockDatas={allInputBlockDatas}
          initialInputBlocks={initialInputBlocks}
          onValidationResultsChange={handleValidationResultsChange}
        />

        {/* Validation Errors Warning */}
        {selectedInputBlocks.length > 0 &&
          hasValidationErrors &&
          invalidInputBlocks.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <RiAlertLine
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Validation Warnings
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="mb-4">
                      The following selected user inputs have missing required
                      fields. Please either fill in the necessary fields and try
                      again or choose a different option from the dropdown.
                    </p>

                    {/* Group validation errors by their input block types */}
                    {(() => {
                      // Get unique types from invalidInputBlocks and sort them
                      const types = [
                        ...new Set(
                          invalidInputBlocks.map((block) => block.type)
                        ),
                      ].sort();

                      return types.map((type) => (
                        <div
                          key={type}
                          className="mb-6">
                          <h4 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-100">
                            {type}
                          </h4>
                          <ul className="ml-4 list-disc space-y-1">
                            {invalidInputBlocks
                              .filter((block) => block.type === type)
                              .map((block, index) => {
                                // Format the message to match "0 out of X Checks done" pattern
                                const formattedMessage = block.message.includes(
                                  'Checks done'
                                )
                                  ? block.message
                                  : (() => {
                                      // Extract number of checks from the message if available
                                      const checksMatch =
                                        block.message.match(/(\d+)/);
                                      if (checksMatch && checksMatch[1]) {
                                        return `0 out of ${checksMatch[1]} Checks done`;
                                      }
                                      return block.message;
                                    })();

                                return (
                                  <li key={`invalid-${type}-${index}`}>
                                    {/* For process checklists, format as "name: message" */}
                                    {block.name
                                      .toLowerCase()
                                      .includes('process_checklist') ||
                                    block.name
                                      .toLowerCase()
                                      .includes('checklist') ? (
                                      <>
                                        {block.name.toLowerCase()}:{' '}
                                        {formattedMessage}
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-medium">
                                          {block.name}
                                        </span>
                                        : {formattedMessage}
                                      </>
                                    )}
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      <div
        className='flex justify-between'>
        
          <Link href={backButtonLink}>
            <Button
              className="w-[130px] gap-4 p-2 text-white"
              variant="secondary">
              <RiArrowLeftLine /> Back
            </Button>
          </Link>
        
        {(() => {
          // Filter required input blocks to only include group-based ones (those with a 'group' property)
          // This makes individual input blocks like decision tree optional
          const requiredGroupInputBlocks = requiredInputBlocks.filter(block => block.group);
          
          return (requiredGroupInputBlocks.length === 0 ||
            requiredGroupInputBlocks.length <= selectedInputBlocks.length) &&
            !hasValidationErrors;
        })() && (
            <Button
              className={`w-[130px] gap-4 p-2 text-white ${flow}`}
              variant="secondary"
              onClick={handleNext}
              disabled={hasValidationErrors}>
              Next <RiArrowRightLine />
            </Button>
          )}
      </div>
    </div>
  );
}
