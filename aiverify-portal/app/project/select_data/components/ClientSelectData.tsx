'use client';

import { RiArrowLeftLine, RiArrowRightLine } from '@remixicon/react';
import Link from 'next/link';
import { useState } from 'react';
import { Checklist, FairnessTree } from '@/app/inputs/utils/types';
import { TestModel } from '@/app/models/utils/types';
import { Algorithm, InputBlock } from '@/app/types';
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
  flow: string;
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
  flow,
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
      // Transform the data to only include IDs
      const transformedData = {
        testModelId: selectedModelId,
        testResults: selectedTestResults.map((result) => result.id),
        inputBlocks: selectedInputBlocks.map((block) => block.id),
      };

      // Send all changes in a single patch request
      await patchProject(projectId, transformedData);

      const flow = UserFlows.NewProjectWithNewTemplateAndResults;

      // Construct the URL with all selected data
      const queryString = [
        `flow=${encodeURIComponent(flow)}`,
        `projectId=${encodeURIComponent(projectId)}`,
        ...(selectedModelId
          ? [`modelId=${encodeURIComponent(selectedModelId)}`]
          : []),
        ...(selectedTestResults.length
          ? [`testResultIds=${selectedTestResults.map((r) => r.id).join(',')}`]
          : []),
        ...(selectedInputBlocks.length
          ? [`iBlockIds=${selectedInputBlocks.map((b) => b.id).join(',')}`]
          : []),
      ].join('&');

      window.location.href = `/canvas?${queryString}&mode=view`;
    } catch (error) {
      console.error('Failed to update project:', error);
      // You might want to show an error message to the user here
    }
  };

  let backButtonLink = `/templates?flow=${flow}&=projectId=${projectId}`;
  if (flow === UserFlows.NewProjectWithNewTemplate) {
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
        />
        <UserInputs
          projectId={projectId}
          flow={flow}
          requiredInputBlocks={requiredInputBlocks}
          onInputBlocksChange={handleInputBlocksChange}
          allChecklists={allChecklists}
          allFairnessTrees={allFairnessTrees}
        />
      </div>

      <div className="flex justify-between">
        <Link href={backButtonLink}>
          <Button
            className="w-[130px] gap-4 p-2 text-white"
            variant="secondary">
            <RiArrowLeftLine /> Back
          </Button>
        </Link>
        {selectedModelId &&
          selectedTestResults.length > 0 &&
          selectedInputBlocks.length > 0 && (
            <Button
              className="w-[130px] gap-4 p-2 text-white"
              variant="secondary"
              onClick={handleNext}>
              Next <RiArrowRightLine />
            </Button>
          )}
      </div>
    </div>
  );
}
