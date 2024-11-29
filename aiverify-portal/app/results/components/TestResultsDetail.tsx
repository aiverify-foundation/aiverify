'use client';

import React, { useState, useEffect } from 'react';
import { TestResults } from '../../types';
import { ResultsNameHeader } from './ResultsNameHeader';
import { updateResultName } from '@/lib/fetchApis/updateResultName';
import { deleteResult } from '@/lib/fetchApis/deleteTestResult';
import { getArtifacts } from '@/lib/fetchApis/getArtifacts';
import ArtifactModal from './ArtifactPopup';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import JSZip from 'jszip';

type Props = {
  result: TestResults | null;
  onUpdateResult?: (updatedResult: TestResults) => void; 
};

export default function TestResultDetail({ result, onUpdateResult }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'testArguments' | 'outputArtifacts'>('testArguments');
  const [currentResult, setCurrentResult] = useState<TestResults | null>(result);
  const [modalOpen, setModalOpen] = useState(false); // State for modal
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    setCurrentResult(result);
  }, [result]);

  const handleSaveName = async (id: number, newName: string) => {
    setIsSaving(true);
    try {
      await updateResultName(id, newName);
      setModalMessage('Name updated successfully!');
      setIsModalVisible(true);
      if (onUpdateResult && currentResult) {
        setCurrentResult({ ...currentResult, name: newName });
        onUpdateResult({ ...currentResult, name: newName });
      }
    } catch (error) {
      setModalMessage('Failed to update the result name. Please try again.');
      setIsModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteResult(id);
      setModalMessage('Result deleted successfully!');
      setIsModalVisible(true);
    } catch (error) {
      console.error('Failed to delete result:', error);
      setModalMessage('Failed to delete the result.');
      setIsModalVisible(true);
    }
  };

  const handleDownloadJson = (dataType: string) => {
    if (!currentResult) return;
  
    let jsonData = "";
    if (dataType === 'algorithmArgs') {
      jsonData = currentResult.testArguments.algorithmArgs;
      console.log(jsonData)
    } else if (dataType === 'output') {
      jsonData = currentResult.output;
    }
  
    const blob = new Blob([JSON.parse(jsonData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentResult.name || 'test_result'}_${dataType}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleArtifactClick = async (artifact: { id: number; name: string }) => {
    try {
      console.log("Fetching artifact:", artifact);

      // Fetch the artifact data
      const fetchedArtifact = await getArtifacts(artifact.id, artifact.name);
      console.log("Fetched artifact:", fetchedArtifact);

      // Set the artifact in modal
      setSelectedArtifact(fetchedArtifact);
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch artifact:", error);
      alert("Failed to load artifact. Please try again.");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedArtifact(null);
  };

  const handleDownloadArtifact = () => {
    if (selectedArtifact) {
      let blob;
      const fileName = selectedArtifact.name || 'artifact';

      // Use the Blob directly if it's an image or any binary file
      if (selectedArtifact.data instanceof Blob) {
        blob = selectedArtifact.data;
      } else if (selectedArtifact.type === 'application/json') {
        // Handle JSON data
        const jsonData =
          typeof selectedArtifact.data === 'string'
            ? JSON.parse(selectedArtifact.data)
            : selectedArtifact.data;
        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      } else if (selectedArtifact.type.startsWith('text/')) {
        // Handle text files
        blob = new Blob([selectedArtifact.data], { type: 'text/plain' });
      } else {
        // Fallback for other data types
        console.error('Unsupported artifact data:', selectedArtifact);
        return;
      }

      // Create a downloadable link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName; // Use the artifact's name as the file name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAllArtifacts = async () => {
    if (!currentResult || !Array.isArray(currentResult.artifacts) || currentResult.artifacts.length === 0) {
      alert('No artifacts to download.');
      return;
    }

    setIsDownloading(true);
    const zip = new JSZip();

    try {
      for (const artifactName of currentResult.artifacts) {
        try {
          const fetchedArtifact = await getArtifacts(currentResult.id, artifactName);

          // Check if fetchedArtifact and its type are valid
          if (!fetchedArtifact || !fetchedArtifact.data) {
            console.error(`Invalid fetched artifact for ${artifactName}:`, fetchedArtifact);
            continue;
          }

          let blob;
          if (fetchedArtifact.data instanceof Blob) {
            blob = fetchedArtifact.data;
          } else if (fetchedArtifact.type === 'application/json') {
            // Handle JSON data
            const jsonData =
              typeof fetchedArtifact.data === 'string'
                ? JSON.parse(fetchedArtifact.data)
                : fetchedArtifact.data;
            blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          } else if (fetchedArtifact.type?.startsWith('text/')) {
            // Handle text files
            blob = new Blob([fetchedArtifact.data], { type: 'text/plain' });
          } else {
            // Fallback for other data types
            console.error(`Unsupported artifact data type for ${artifactName}:`, fetchedArtifact);
            continue;
          }

          zip.file(artifactName, blob);
        } catch (error) {
          console.error(`Failed to fetch artifact ${artifactName}:`, error);
        }
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentResult.name || 'artifacts'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the object URL to free up memory
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate ZIP file:', error);
      alert('Failed to download all artifacts. Please try again.');
    } finally {
      setIsDownloading(false);
    }
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
      {/* popup for name update and deleting */}
      {isModalVisible && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={() => setIsModalVisible(false)}
            enableScreenOverlay
            heading=""
            height={150}
          >
            <p>{modalMessage}</p>
          </Modal>
        </div>
      )}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <ResultsNameHeader
          id={currentResult.id}
          name={currentResult.name}
          isSaving={isSaving}
          onSave={handleSaveName}
          onDelete={handleDelete}
        />

        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Model File:</span> {currentResult.testArguments.modelFile.split('/').pop()}</p>
          <p><span className="font-semibold">Model Type:</span> {currentResult.testArguments.modelType}</p>
          <p><span className="font-semibold">Test Date:</span>{' '}
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
          <p><span className="font-semibold">Test Dataset:</span> {currentResult.testArguments.testDataset.split('/').pop()}</p>
          <p><span className="font-semibold">Ground Truth Dataset:</span> {currentResult.testArguments.groundTruthDataset.split('/').pop()}</p>
          <p><span className="font-semibold">GID:</span> {currentResult.gid}</p>
          <p><span className="font-semibold">Version:</span> {currentResult.version}</p>
          <p><span className="font-semibold">Duration:</span> {currentResult.timeTaken}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-start space-x-1 mb-4">
          <button
            className={`py-2 px-6 rounded-t ${activeTab === 'testArguments' ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold' : 'text-secondary-950 bg-secondary-300'
              }`}
            onClick={() => setActiveTab('testArguments')}
          >
            Algorithm Arguments
          </button>
          <button
            className={`py-2 px-6 rounded-t ${activeTab === 'outputArtifacts' ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold' : 'text-secondary-950 bg-secondary-300'
              }`}
            onClick={() => setActiveTab('outputArtifacts')}
          >
            Output & Artifacts
          </button>
        </div>

        <div className="rounded-b-lg shadow-inner">
          {activeTab === 'testArguments' && (
            <div className="rounded text-sm">
              <h3 className="text-lg font-semibold mb-2">Algorithm Arguments</h3>
              <div className='max-h-64 overflow-y-auto'>
                <pre className="bg-secondary-800 p-4 whitespace-pre-wrap">
                  {typeof currentResult.testArguments.algorithmArgs === 'string'
                    ? JSON.stringify(
                      JSON.parse(JSON.parse(currentResult.testArguments.algorithmArgs)), // Double parse
                      null,
                      2
                    )
                    : JSON.stringify(currentResult.testArguments.algorithmArgs, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end mt-4 overflow-y-auto">
                <Button
                  pill
                  textColor="white"
                  variant={ButtonVariant.PRIMARY}
                  size="sm"
                  text="DOWNLOAD"
                  color='primary-950'
                  onClick={() => handleDownloadJson('algorithmArgs')}
                />
              </div>
            </div>
          )}
          {activeTab === 'outputArtifacts' && (
            <div>
              <div className="rounded text-sm mb-4">
                <h3 className="text-lg font-semibold mb-2">Outputs</h3>
                <div className='max-h-64 overflow-y-auto'>
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
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  pill
                  textColor="white"
                  variant={ButtonVariant.PRIMARY}
                  size="sm"
                  text="DOWNLOAD"
                  color='primary-950'
                  onClick={() => handleDownloadJson('output')}
                />
              </div>
              <div className="rounded text-sm">
                <h3 className="text-lg font-semibold mb-2">Artifacts</h3>
                <div className="bg-secondary-800 max-h-64 overflow-y-auto p-4 whitespace-pre-wrap">
                  {Array.isArray(currentResult.artifacts) ? (
                    <ul className="space-y-1 pl-6 list-disc">
                      {currentResult.artifacts.map((artifact, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleArtifactClick({ id: currentResult.id, name: artifact })}
                            className="text-primary-500 hover:underline"
                          >
                            {typeof artifact === 'string' ? artifact : JSON.stringify(artifact, null, 2)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <pre>
                      {typeof currentResult.artifacts === 'string'
                        ? currentResult.artifacts // Display as is if it’s a string
                        : JSON.stringify(currentResult.artifacts, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    pill
                    textColor="white"
                    variant={ButtonVariant.PRIMARY}
                    size="sm"
                    text="DOWNLOAD"
                    color='primary-950'
                    onClick={handleDownloadAllArtifacts}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedArtifact && modalOpen && (
        <ArtifactModal
          isOpen={modalOpen}
          artifact={selectedArtifact}
          onClose={closeModal}
          onDownload={() => handleDownloadArtifact()}
        />
      )}
    </div>
  );
}
