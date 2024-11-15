'use client';

import React, { useState } from 'react';
import { TestResults } from '../../types';
import { ResultsNameHeader } from './ResultsNameHeader';
import { updateResultNameServer } from './UpdateResultName'; // Import the server action

type Props = {
  result: TestResults | null;
};

export default function TestResultDetail({ result }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'testArguments' | 'outputArtifacts'>('testArguments');

  const handleSaveName = async (id: number, newName: string) => {
    setIsSaving(true);
    try {
      await updateResultNameServer(id, newName);
      alert('Name updated successfully!');
    } catch (error) {
      console.error('Error updating result name:', error);
      alert('Failed to update the result name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJson = () => {
    if (!result) return;

    const jsonData = {
      algorithmArgs: result.testArguments.algorithmArgs,
      output: result.output,
      artifacts: result.artifacts,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.name || 'test_result'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <div className="text-white text-center mt-20">
        <p>Select a test result to see details here.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-950 h-full text-white rounded-lg shadow-lg p-6 overflow-y-auto">
      {/* Header Section */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <ResultsNameHeader
          id={result.id}
          name={result.name}
          isSaving={isSaving}
          onSave={handleSaveName}
        />

        <div className="space-y-1 text-sm">
          <p>
            <span className="font-semibold">Model File:</span>{' '}
            {result.testArguments.modelFile.split('/').pop()}
          </p>
          <p>
            <span className="font-semibold">Model Type:</span> {result.testArguments.modelType}
          </p>
          <p>
            <span className="font-semibold">Test Date:</span>{' '}
            {new Date(result.created_at).toLocaleString('en-US', {
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
            <span className="font-semibold">Test Dataset:</span>{' '}
            {result.testArguments.testDataset.split('/').pop()}
          </p>
          <p>
            <span className="font-semibold">Ground Truth Dataset:</span>{' '}
            {result.testArguments.groundTruthDataset.split('/').pop()}
          </p>
          <p>
            <span className="font-semibold">GID:</span> {result.gid}
          </p>
          <p>
            <span className="font-semibold">Version:</span> {result.version}
          </p>
          <p>
            <span className="font-semibold">Duration:</span> {result.timeTaken}
          </p>
        </div>
      </div>

      {/* tabs */}
      <div>
        <div className="flex justify-start space-x-1 mb-4">
          <button
            className={`py-2 px-6 rounded-t ${
              activeTab === 'testArguments'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('testArguments')}
          >
            Test Arguments
          </button>
          <button
            className={`py-2 px-6 rounded-t ${
              activeTab === 'outputArtifacts'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('outputArtifacts')}
          >
            Output & Artifacts
          </button>
        </div>

        {/* Content Section */}
        <div className="rounded-b-lg shadow-inner ">
          {activeTab === 'testArguments' && (
            <div className="rounded text-sm max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">Algorithm Arguments</h3>
              <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">{JSON.stringify(result.testArguments.algorithmArgs, null, 2)}</pre>
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
                <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">{JSON.stringify(result.output, null, 2)}</pre>
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
                <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">{result.artifacts && result.artifacts.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {result.artifacts.map((artifact, index) => (
                      <li key={index}>{artifact}</li>
                    ))}
                  </ul>
                ) : null}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
