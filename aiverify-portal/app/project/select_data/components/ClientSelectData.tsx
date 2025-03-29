'use client';

import { RiArrowLeftLine, RiArrowRightLine } from '@remixicon/react';
import { RiAlertLine } from '@remixicon/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Checklist, FairnessTree } from '@/app/inputs/utils/types';
import { TestModel } from '@/app/models/utils/types';
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
  allChecklists: Checklist[];
  allFairnessTrees: FairnessTree[];
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
  allChecklists,
  allFairnessTrees,
  allInputBlockDatas,
  flow,
  initialModelId,
  initialTestResults = [],
  initialInputBlocks = [],
}: ClientSelectDataProps) {
  console.log('ClientSelectData received props:', {
    initialModelId,
    initialTestResults,
    initialInputBlocks,
  });

  console.log('flow clientselectdata', flow);

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

  // Effect to log the initial state and changes for debugging
  useEffect(() => {
    console.log(
      'ClientSelectData - selectedTestResults updated:',
      selectedTestResults
    );
  }, [selectedTestResults]);

  // State for input blocks selection
  const [selectedInputBlocks, setSelectedInputBlocks] = useState<
    SelectedInputBlock[]
  >(
    initialInputBlocks.map((block) => ({
      gid: block.gid,
      cid: block.cid,
      id: block.id,
    }))
  );

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
      processValidationResults(validationResults);
    }
  }, [selectedInputBlocks]);

  console.log('ClientSelectData initialized states:', {
    selectedModelId,
    selectedTestResults,
    selectedInputBlocks,
  });

  const handleModelChange = (modelId: string | undefined) => {
    setSelectedModelId(modelId);

    // Instead of clearing all test results, filter out those that don't match the new model
    if (modelId) {
      const selectedModel = allModels.find(
        (model) => model.id.toString() === modelId
      );
      if (selectedModel) {
        const validTestResults = selectedTestResults.filter((result) => {
          const testResult = allTestResults.find((tr) => tr.id === result.id);
          return (
            testResult &&
            testResult.testArguments.modelFile === selectedModel.name
          );
        });
        setSelectedTestResults(validTestResults);
      } else {
        // If no model is found, clear the test results
        setSelectedTestResults([]);
      }
    } else {
      // If no model is selected, clear the test results
      setSelectedTestResults([]);
    }
  };

  const handleTestResultsChange = (testResults: SelectedTestResult[]) => {
    setSelectedTestResults(testResults);
  };

  const handleInputBlocksChange = (inputBlocks: SelectedInputBlock[]) => {
    setSelectedInputBlocks(inputBlocks);
  };

  // Handler to receive validation results from UserInputs
  const handleValidationResultsChange = (results: ValidationResults) => {
    console.log('ClientSelectData received validation results:', results);
    // Only update the validation results without immediately processing them
    // This avoids potentially triggering multiple state updates in succession
    setValidationResults(results);
    // The useEffect with validationResults dependency will handle processing
  };

  // Function to process validation results and update invalid blocks list
  const processValidationResults = (
    results: ValidationResults,
    currentSelectedBlocksJson?: string
  ) => {
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

    // Collect names and messages of invalid input blocks, grouped by type
    const invalidBlocks: InvalidInputBlock[] = [];

    // Function to find input block name by gid, cid and id
    const findInputBlockInfo = (
      gid: string,
      cid: string,
      id?: number
    ): { name: string; type: string } => {
      // Default fallback values
      let type = 'Other';
      let name = cid;

      // Special case for Process Checklists, which is a dropdown with multiple options but one label
      if (gid === 'aiverify.stock.process_checklist') {
        type = 'Process Checklists';

        // For process checklists, find the checklist name based on id
        if (id !== undefined) {
          const checklist = allChecklists.find(
            (c) => c.gid === gid && c.cid === cid && c.id === id
          );
          if (checklist) {
            name = checklist.name || `${cid}`;
            return { name, type };
          }
        }
        return { name, type };
      }

      // For other input blocks, find the matching required input block to get its display name
      const requiredInputBlock = requiredInputBlocks.find(
        (block) => block.gid === gid && block.cid === cid
      );

      // If we found a matching required input block, use its name as the category header
      if (requiredInputBlock) {
        type = requiredInputBlock.name;

        // Now find the actual instance name based on id
        if (id !== undefined) {
          // Check in fairness trees
          if (
            gid === 'aiverify.stock.fairness_metrics_toolbox_for_classification'
          ) {
            const fairnessTree = allFairnessTrees.find(
              (f) => f.gid === gid && f.cid === cid && f.id === id
            );
            if (fairnessTree) {
              name = fairnessTree.name || `${cid}`;
              return { name, type };
            }
          }

          // Check in other input block datas
          const inputBlock = allInputBlockDatas.find(
            (i) => i.gid === gid && i.cid === cid && i.id === id
          );
          if (inputBlock) {
            name = inputBlock.name || `${cid}`;
            return { name, type };
          }
        }
      } else {
        // Fallback for blocks not in requiredInputBlocks
        if (gid.includes('fairness')) {
          type = 'Fairness Metrics';
        } else if (gid.startsWith('aiverify.plugin.')) {
          // Extract plugin name from gid
          const pluginParts = gid.split('.');
          if (pluginParts.length > 2) {
            type = `${pluginParts[2].charAt(0).toUpperCase() + pluginParts[2].slice(1)} Plugin`;
          } else {
            type = 'Plugin';
          }
        }
      }

      return { name, type };
    };

    // Create a map of selected block keys for faster lookup
    const selectedBlockKeys = blocksToCheck.map(
      (block: SelectedInputBlock) => `${block.gid}-${block.cid}-${block.id}`
    );

    // Check if any selected input has a validation error
    let hasErrors = false;

    // Collect names and messages of invalid inputs, but only for selected input blocks
    Object.entries(results).forEach(([key, result]) => {
      // Only process results for invalid blocks
      if (!result.isValid) {
        // Parse the key to extract gid, cid, and id
        const keyParts = key.split('-');
        let gid: string, cid: string, id: string | undefined;

        if (keyParts.length === 3) {
          // Key includes ID: gid-cid-id
          [gid, cid, id] = keyParts;

          // Check if this is a selected input block
          const isSelected = selectedBlockKeys.includes(key);

          if (!isSelected) {
            return; // Skip this validation result if it's not for a selected input block
          }

          // Mark that we have errors for selected blocks
          hasErrors = true;
        } else if (keyParts.length === 2) {
          // Key is just gid-cid
          [gid, cid] = keyParts;
          id = undefined;

          // Check if any selected input block matches this gid-cid
          const isSelected = blocksToCheck.some(
            (block: SelectedInputBlock) =>
              block.gid === gid && block.cid === cid
          );

          if (!isSelected) {
            return; // Skip this validation result if it's not for a selected input block
          }

          // Mark that we have errors for selected blocks
          hasErrors = true;
        } else {
          // Invalid key format
          console.error(`Invalid validation result key format: ${key}`);
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
        }
      }
    });

    console.log('Invalid input blocks after processing:', invalidBlocks);
    setHasValidationErrors(hasErrors);
    setInvalidInputBlocks(invalidBlocks);
  };

  const handleNext = async () => {
    if (!projectId) return;

    try {
      // Transform the data to only include IDs
      const transformedData = {
        testModelId: selectedModelId,
        testResults: selectedTestResults.map((result) => result.id),
        inputBlocks: selectedInputBlocks.map((block) => block.id),
      };

      // Send all changes in a single patch request
      await patchProject(projectId, transformedData);

      // Update flow based on current flow
      let updatedFlow = flow;
      if (flow === UserFlows.NewProjectWithNewTemplate) {
        updatedFlow = UserFlows.NewProjectWithNewTemplateAndResults;
      } else if (flow === UserFlows.NewProjectWithExistingTemplate) {
        updatedFlow = UserFlows.NewProjectWithExistingTemplateAndResults;
      } else if (flow === UserFlows.NewProjectWithEditingExistingTemplate) {
        updatedFlow = UserFlows.NewProjectWithEditingExistingTemplateAndResults;
      }

      // Construct the URL with all selected data
      const queryString = [
        `flow=${encodeURIComponent(updatedFlow)}`,
        `projectId=${encodeURIComponent(projectId)}`,
        ...(selectedModelId
          ? [`modelId=${encodeURIComponent(selectedModelId)}`]
          : []),
        // Always include testResultIds parameter, even if empty
        `testResultIds=${selectedTestResults.map((r) => r.id).join(',')}`,
        // Always include iBlockIds parameter, even if empty
        `iBlockIds=${selectedInputBlocks.map((b) => b.id).join(',')}`,
      ].join('&');

      if (flow === UserFlows.EditExistingProject) {
        window.location.href = `/canvas?${queryString}&mode=edit`;
      } else {
        window.location.href = `/canvas?${queryString}&mode=view`;
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      // You might want to show an error message to the user here
    }
  };

  let backButtonLink = `/templates?flow=${flow}&=projectId=${projectId}`;
  if (
    flow === UserFlows.NewProjectWithNewTemplate ||
    flow === UserFlows.NewProjectWithNewTemplateAndResults ||
    flow === UserFlows.NewProjectWithEditingExistingTemplate ||
    flow === UserFlows.NewProjectWithEditingExistingTemplateAndResults
  ) {
    backButtonLink = `/canvas?flow=${flow}&projectId=${projectId}`;
  } else {
    backButtonLink = `/templates?flow=${flow}&projectId=${projectId}`;
  }
  console.log('backButtonLink', backButtonLink);

  // Get the selected model object
  const selectedModel = selectedModelId
    ? allModels.find((model) => model.id.toString() === selectedModelId)
    : undefined;

  console.log('selectedModel', selectedModel);
  console.log('selectedModelId', selectedModelId);
  console.log('selectedTestResults', selectedTestResults);
  console.log('selectedInputBlocks', selectedInputBlocks);

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
          allChecklists={allChecklists}
          allFairnessTrees={allFairnessTrees}
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

                    {/* Group validation errors by their input block types as shown in UserInputs.tsx */}
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
                              .map((block, index) => (
                                <li key={`invalid-${type}-${index}`}>
                                  <span className="font-medium">
                                    {block.name}
                                  </span>
                                  : {block.message}
                                </li>
                              ))}
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
        className={`flex ${flow !== UserFlows.EditExistingProject ? 'justify-between' : 'justify-end'}`}>
        {flow !== UserFlows.EditExistingProject ? (
          <Link href={backButtonLink}>
            <Button
              className="w-[130px] gap-4 p-2 text-white"
              variant="secondary">
              <RiArrowLeftLine /> Back
            </Button>
          </Link>
        ) : null}
        {selectedInputBlocks.length === 0 &&
          !hasValidationErrors &&
          invalidInputBlocks.length === 0 && (
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
