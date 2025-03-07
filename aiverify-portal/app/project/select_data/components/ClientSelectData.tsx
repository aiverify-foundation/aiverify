'use client';

import { useState } from 'react';
import { Checklist, FairnessTree } from '@/app/inputs/utils/types';
import { TestModel } from '@/app/models/utils/types';
import { Algorithm, InputBlock } from '@/app/types';
import { TestResult } from '@/app/types';
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

export default function ClientSelectData({
  projectId,
  requiredAlgorithms,
  requiredInputBlocks,
  allModels,
  allTestResults,
  allChecklists,
  allFairnessTrees,
}: ClientSelectDataProps) {
  // State for model selection
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>();

  // State for test results selection
  const [selectedTestResults, setSelectedTestResults] = useState<
    SelectedTestResult[]
  >([]);

  // State for input blocks selection
  const [selectedInputBlocks, setSelectedInputBlocks] = useState<
    SelectedInputBlock[]
  >([]);

  const handleModelChange = (modelId: string | undefined) => {
    setSelectedModelId(modelId);
    // Clear test results when model changes
    setSelectedTestResults([]);
  };

  const handleTestResultsChange = (testResults: SelectedTestResult[]) => {
    setSelectedTestResults(testResults);
  };

  const handleInputBlocksChange = (inputBlocks: SelectedInputBlock[]) => {
    setSelectedInputBlocks(inputBlocks);
  };

  const handleNext = async () => {
    if (!projectId) return;

    try {
      // Send all changes in a single patch request
      await patchProject(projectId, {
        testModelId: selectedModelId,
        testResults: selectedTestResults,
        inputBlocks: selectedInputBlocks,
      });

      // Construct the URL with all selected data
      const params = new URLSearchParams({
        projectId,
        ...(selectedModelId && { modelId: selectedModelId }),
        ...(selectedTestResults.length && {
          testResultIds: selectedTestResults.map((r) => r.id).join(','),
        }),
        ...(selectedInputBlocks.length && {
          iBlockIds: selectedInputBlocks.map((b) => b.id).join(','),
        }),
      });

      window.location.href = `/canvas?${params.toString()}`;
    } catch (error) {
      console.error('Failed to update project:', error);
      // You might want to show an error message to the user here
    }
  };

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
          selectedModelId={selectedModelId}
          onModelChange={handleModelChange}
          models={allModels}
        />
        <TestResults
          projectId={projectId}
          requiredAlgorithms={requiredAlgorithms}
          onTestResultsChange={handleTestResultsChange}
          allTestResults={allTestResults}
          selectedModel={selectedModel}
        />
        <UserInputs
          projectId={projectId}
          requiredInputBlocks={requiredInputBlocks}
          onInputBlocksChange={handleInputBlocksChange}
          allChecklists={allChecklists}
          allFairnessTrees={allFairnessTrees}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Next
        </button>
      </div>
    </div>
  );
}
