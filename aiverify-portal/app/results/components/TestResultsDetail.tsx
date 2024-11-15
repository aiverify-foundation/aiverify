'use client';

import React, { useState } from 'react';
import { TestResults } from '../../types';
import { ResultsNameHeader } from './ResultsNameHeader';
import { updateResultName } from '../../../lib/fetchApis/updateResultName';

type Props = {
  result: TestResults | null;
  onUpdateResult?: (updatedResult: TestResults) => void; // Optional callback if parent wants to update
};

export default function TestResultDetail({ result, onUpdateResult }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'testArguments' | 'outputArtifacts'>('testArguments');
  const [currentResult, setCurrentResult] = useState<TestResults | null>(result); // Local state to store result

  const handleSaveName = async (id: number, newName: string) => {
    setIsSaving(true);
    try {
      const data = await updateResultName(id, newName); // Call the helper function to update the name
      alert('Name updated successfully!');
      
      // Update the result name in local state after the update
      if (currentResult) {
        setCurrentResult({ ...currentResult, name: newName });
      }

      // Optionally notify the parent to update the result (if you have onUpdateResult callback)
      if (onUpdateResult && currentResult) {
        onUpdateResult({ ...currentResult, name: newName });
      }
    } catch (error) {
      alert('Failed to update the result name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJson = () => {
    if (!currentResult) return;

    const jsonData = {
      algorithmArgs: currentResult.testArguments.algorithmArgs,
      output: currentResult.output,
      artifacts: currentResult.artifacts,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentResult.name || 'test_result'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentResult) {
    return (
      <div className="text-white text-center mt-20">
        <p>Select a test result to see details here.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-950 h-full text-white rounded-lg shadow-lg p-6 overflow-y-auto">
      <div className="border-b border-gray-700 pb-4 mb-4">
        <ResultsNameHeader
          id={currentResult.id}
          name={currentResult.name}
          isSaving={isSaving}
          onSave={handleSaveName}
        />

        <div className="space-y-1 text-sm">
          <p>
            <span className="font-semibold">Model File:</span> {currentResult.testArguments.modelFile.split('/').pop()}
          </p>
          <p>
            <span className="font-semibold">Model Type:</span> {currentResult.testArguments.modelType}
          </p>
          <p>
            <span className="font-semibold">Test Date:</span>{' '}
            {new Date(currentResult.created_at).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
              timeZone: 'Asia/Singapore',
            })}
          </p>
          <p>
            <span className="font-semibold">Test Dataset:</span> {currentResult.testArguments.testDataset.split('/').pop()}
          </p>
          <p>
            <span className="font-semibold">Ground Truth Dataset:</span> {currentResult.testArguments.groundTruthDataset.split('/').pop()}
          </p>
          <p>
            <span className="font-semibold">GID:</span> {currentResult.gid}
          </p>
          <p>
            <span className="font-semibold">Version:</span> {currentResult.version}
          </p>
          <p>
            <span className="font-semibold">Duration:</span> {currentResult.timeTaken}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-start space-x-1 mb-4">
          <button
            className={`py-2 px-6 rounded-t ${
              activeTab === 'testArguments' ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold' : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('testArguments')}
          >
            Test Arguments
          </button>
          <button
            className={`py-2 px-6 rounded-t ${
              activeTab === 'outputArtifacts' ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold' : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('outputArtifacts')}
          >
            Output & Artifacts
          </button>
        </div>

        <div className="rounded-b-lg shadow-inner">
          {activeTab === 'testArguments' && (
            <div className="rounded text-sm max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">Algorithm Arguments</h3>
              <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">
                {typeof currentResult.testArguments.algorithmArgs === 'string'
                  ? JSON.stringify(
                      JSON.parse(JSON.parse(currentResult.testArguments.algorithmArgs)), // Double parse
                      null,
                      2
                    )
                  : JSON.stringify(currentResult.testArguments.algorithmArgs, null, 2)}
              </pre>
              <div className="flex justify-end mt-4 overflow-y-auto">
                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  DOWNLOAD
                </button>
              </div>
            </div>
          )}
          {activeTab === 'outputArtifacts' && (
            <div>
              <div className="rounded text-sm max-h-64 overflow-y-auto mb-4">
                <h3 className="text-lg font-semibold mb-2">Outputs</h3>
                <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">
                  {typeof currentResult.output === 'string'
                    ? JSON.stringify(
                        JSON.parse(JSON.parse(currentResult.output)), // Double parse
                        null,
                        2
                      )
                    : JSON.stringify(currentResult.output, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  DOWNLOAD
                </button>
              </div>
              <div className="rounded text-sm max-h-64 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-2">Artifacts</h3>
                <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">
                  {typeof currentResult.artifacts === 'string'
                    ? JSON.stringify(
                        JSON.parse(JSON.parse(currentResult.artifacts)), // Double parse
                        null,
                        2
                      )
                    : JSON.stringify(currentResult.artifacts, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
