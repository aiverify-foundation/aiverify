'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Algorithm, InputBlock, ProjectData } from '@/app/types';
import ModelSelection from './components/ModelSelection';
import TestResults from './components/TestResults';
import UserInputs from './components/UserInputs';

async function updateProjectData(
  projectId: string,
  data: Partial<ProjectData>
) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update project data');
  }

  return response.json();
}

export default function SelectDataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const templateId = searchParams.get('templateId');

  const [requiredAlgorithms, setRequiredAlgorithms] = useState<Algorithm[]>([]);
  const [requiredInputBlocks, setRequiredInputBlocks] = useState<InputBlock[]>(
    []
  );
  const [projectData, setProjectData] = useState<ProjectData>({
    testModelId: undefined,
    inputBlocks: [],
    testResults: [],
  });

  // Fetch required algorithms and input blocks based on template
  useEffect(() => {
    if (!projectId || !templateId) return;

    // This would be replaced with actual API calls to get the required algorithms and input blocks
    // For now, we'll use mock data
    setRequiredAlgorithms([
      {
        cid: 'aiverify_general_corruptions',
        gid: 'aiverify.stock.image_corruption_toolbox',
        name: 'Image Corruption Test',
        modelType: ['classification'],
        version: '0.9.0',
        author: 'AI Verify',
        description: 'Tests image model robustness against corruptions',
        tags: ['computer vision', 'robustness'],
        requireGroundTruth: true,
        language: 'python',
        script: 'corruption_test.py',
        module_name: 'corruption_test',
        inputSchema: {
          title: 'Input Schema',
          description: 'Input schema for corruption test',
          type: 'object',
          required: [],
          properties: {},
        },
        outputSchema: {
          title: 'Output Schema',
          description: 'Output schema for corruption test',
          type: 'object',
          required: [],
          minProperties: 0,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Feature names',
              minItems: 0,
              items: {
                type: 'string',
              },
            },
            results: {
              title: 'Results',
              description: 'Test results',
              type: 'array',
              minItems: 0,
              items: {
                description: 'Result item',
                type: 'object',
                required: [],
                minProperties: 0,
                properties: {
                  indices: {
                    title: 'Indices',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  ale: {
                    title: 'ALE',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  size: {
                    title: 'Size',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          },
        },
        zip_hash: 'abc123',
      },
    ]);

    setRequiredInputBlocks([
      {
        cid: 'checklist',
        gid: 'aiverify.stock.process_checklist',
        name: 'Process Checklist',
        version: '0.9.0',
        author: 'AI Verify',
        tags: 'process,checklist',
        description: 'AI Verify process checklist',
        group: 'Default',
        groupNumber: '1',
        width: 'full',
        fullScreen: false,
      },
    ]);
  }, [projectId, templateId]);

  const handleModelChange = async (modelId: string | undefined) => {
    if (!projectId) return;

    try {
      const newData = { ...projectData, testModelId: modelId };
      await updateProjectData(projectId, newData);
      setProjectData(newData);
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const handleTestResultsChange = async (
    testResults: Array<{ gid: string; cid: string; id: number }>
  ) => {
    if (!projectId) return;

    try {
      const newData = { ...projectData, testResults };
      await updateProjectData(projectId, newData);
      setProjectData(newData);
    } catch (error) {
      console.error('Failed to update test results:', error);
    }
  };

  const handleInputBlocksChange = async (
    inputBlocks: Array<{ gid: string; cid: string; id: number }>
  ) => {
    if (!projectId) return;

    try {
      const newData = { ...projectData, inputBlocks };
      await updateProjectData(projectId, newData);
      setProjectData(newData);
    } catch (error) {
      console.error('Failed to update input blocks:', error);
    }
  };

  const handleNext = () => {
    if (!projectId || !templateId) return;

    // Construct the URL with all selected data
    const params = new URLSearchParams({
      projectId,
      templateId,
      ...(projectData.testModelId && { modelId: projectData.testModelId }),
      ...(projectData.testResults.length && {
        testResultIds: projectData.testResults.map((r) => r.id).join(','),
      }),
      ...(projectData.inputBlocks.length && {
        iBlockIds: projectData.inputBlocks.map((b) => b.id).join(','),
      }),
    });

    router.push(`/canvas?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">
          Select the Model, Test Results and User Input
        </h1>
        <p className="text-gray-500">
          Please select the AI Model, Test Result(s) and User Input(s) required
          for report generation.
        </p>
      </div>

      <div className="space-y-6">
        <ModelSelection
          projectId={projectId}
          selectedModelId={projectData.testModelId}
          onModelChange={handleModelChange}
        />
        <TestResults
          projectId={projectId}
          requiredAlgorithms={requiredAlgorithms}
          onTestResultsChange={handleTestResultsChange}
        />
        <UserInputs
          projectId={projectId}
          requiredInputBlocks={requiredInputBlocks}
          onInputBlocksChange={handleInputBlocksChange}
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
