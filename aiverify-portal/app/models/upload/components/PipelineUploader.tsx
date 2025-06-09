'use client';

import { useState } from 'react';
import useUploadFolder from '@/app/models/upload/hooks/useUploadFolder';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';
import { folder } from 'jszip';
import { reject } from 'lodash';

// Extended File interface with webkitRelativePath
interface FileWithPath extends File {
  webkitRelativePath: string;
}

const PipelineUploader = ({ onBack }: { onBack: () => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [folderName, setFolderName] = useState('');
  const [modelType, setModelType] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { mutate, status } = useUploadFolder();
  const isLoading = status === 'pending';

  const handleFiles = (files: FileList | FileWithPath[]) => {
    console.log('files:', files instanceof FileList, files);

    if (files instanceof FileList) {
      files = Array.from(files) as FileWithPath[];
    }

    // Only allow one folder upload at a time
    // Clear previous selections when a new folder is selected
    if (files.length > 0 && 'webkitRelativePath' in files[0]) {
      // Get folder name from first file's path
      const folderPath = (files[0] as FileWithPath).webkitRelativePath.split('/')[0];

      // If there are already files selected, show a message that we're replacing them
      if (selectedFiles.length > 0) {
        const previousFolder =
          selectedFiles[0]?.webkitRelativePath?.split('/')[0] || '';
        if (previousFolder !== folderPath) {
          console.log(
            `Replacing folder "${previousFolder}" with "${folderPath}"`
          );
          setModalMessage(
            `Replaced folder "${previousFolder}" with "${folderPath}"`
          );
          setIsModalVisible(true);
        }
      }

      // Set folder name
      setFolderName(folderPath);

      // Replace the current selection instead of appending
      setSelectedFiles(Array.from(files) as FileWithPath[]);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setModalMessage('Please select files from a folder to upload.');
      setIsModalVisible(true);
      return;
    }

    if (!folderName || !modelType) {
      setModalMessage('Please fill in all required fields.');
      setIsModalVisible(true);
      return;
    }

    console.log('=== PREPARING PIPELINE UPLOAD ===');
    console.log(`Folder name: ${folderName}`);
    console.log(`Model type: ${modelType}`);
    console.log(`Total files selected: ${selectedFiles.length}`);

    // Group files by their direct parent folder for display purposes
    const folderCounts: Record<string, number> = {};
    selectedFiles.forEach((file) => {
      const path = file.webkitRelativePath || '';
      const parts = path.split('/');

      if (parts.length > 1) {
        const parentFolder =
          parts.length > 2 ? parts.slice(0, 2).join('/') : parts[0];
        folderCounts[parentFolder] = (folderCounts[parentFolder] || 0) + 1;
      }
    });

    console.log('Folder structure:');
    Object.entries(folderCounts).forEach(([folder, count]) => {
      console.log(`- ${folder}: ${count} files`);
    });

    // Get the root folder name from the first file's path
    const rootFolderName = selectedFiles[0]?.webkitRelativePath?.split('/')[0] || '';
    console.log(`Detected root folder name: ${rootFolderName}`);

    // Create a new FormData object
    const formData = new FormData();

    // Extract and add subfolder information for each file
    const subfolderPaths: string[] = [];
    const fileDetails: Array<{
      name: string;
      path: string;
      subfolder: string;
    }> = [];

    Array.from(selectedFiles).forEach((file) => {
      formData.append('files', file);

      // Extract the subfolder path from webkitRelativePath
      const relativePath = file.webkitRelativePath;
      let subfolderPath = './';

      if (relativePath) {
        const pathParts = relativePath.split('/');
        // If file is directly in root folder (no subfolder)
        if (pathParts.length <= 2) {
          subfolderPath = './';
        } else {
          // Extract the subfolder path (everything after the root folder name)
          subfolderPath = './' + pathParts.slice(1, -1).join('/');
        }
      }

      subfolderPaths.push(subfolderPath);

      // Store details for logging
      fileDetails.push({
        name: file.name,
        path: file.webkitRelativePath || '',
        subfolder: subfolderPath,
      });
    });

    console.log('Files to upload (first 5):');
    fileDetails.slice(0, 5).forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Full path: ${file.path}`);
      console.log(`   Subfolder: ${file.subfolder}`);
    });

    if (fileDetails.length > 5) {
      console.log(`... and ${fileDetails.length - 5} more files`);
    }

    // Add the rest of the required form data
    formData.append('foldername', folderName);
    formData.append('model_type', modelType);
    formData.append('file_type', 'pipeline');
    formData.append('subfolders', subfolderPaths.join(','));

    console.log(
      'Subfolders parameter:',
      subfolderPaths.join(',').substring(0, 100) +
        (subfolderPaths.join(',').length > 100 ? '...' : '')
    );
    console.log('=== SENDING UPLOAD REQUEST ===');

    // Clear selection immediately when submitting
    setSelectedFiles([]);

    mutate(formData, {
      onSuccess: (data) => {
        console.log('=== UPLOAD COMPLETED SUCCESSFULLY ===');
        console.log('Response data:', data);
        setModalMessage('Pipeline uploaded successfully!');
        setIsModalVisible(true);
        // Reset all fields to initial state
        setFolderName('');
        setModelType('');
        setSelectedFiles([]);
      },
      onError: (error) => {
        console.log('=== UPLOAD FAILED ===');
        console.error('Error details:', error);
        setModalMessage(
          `Error uploading pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setIsModalVisible(true);
        // Reset all fields to initial state
        setFolderName('');
        setModelType('');
        setSelectedFiles([]);
      },
    });
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="relative flex h-full overflow-y-auto scrollbar-hidden">
      {/* Modal Popup */}
      {isModalVisible && (
        <Modal
          bgColor="var(--color-primary-500)"
          textColor="white"
          onCloseIconClick={closeModal}
          enableScreenOverlay
          heading="Upload Status"
          height={200}>
          <p>{modalMessage}</p>
        </Modal>
      )}

      <div className="w-full pl-6 pr-6 pt-2">
        <div className="flex w-full flex-col overflow-y-auto scrollbar-hidden">
          {/* Back Button */}
          <div className="mb-4 flex items-center">
            <Icon
              name={IconName.ArrowLeft}
              color="white"
              onClick={() => {
                console.log('User cancelled pipeline upload');
                onBack();
              }}
            />
            <h3 className="ml-4 text-2xl font-semibold">
              Add New AI Model {'>'} Upload Model Pipeline
            </h3>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full">
            {/* Upload Requirements */}
            <div className="flex w-full items-start space-x-20 p-4">
              {/* Left Section: Header, Description, and Requirements */}
              <div className="w-1/2">
                <h2 className="text-lg font-semibold">Before uploading...</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Check that the model pipeline meets the following
                  requirements.
                </p>

                <div className="mt-4 rounded-lg border border-secondary-300 p-4">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      <strong>File Size:</strong> Less than 4GB
                    </li>
                    <li>
                      <strong>Data Format:</strong> Scikit-learn Pipeline
                    </li>
                    <li>
                      <strong>Serializer Type:</strong> Pickle or Joblib
                    </li>
                    <li>
                      <strong>Pipeline Structure:</strong> Must include
                      preprocessing steps
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Section: Drag & Drop Upload */}
              <div
                className={`${styles.dropzone} flex-1`}
                onClick={() =>
                  document.getElementById('pipelineInput')?.click()
                }
                onDrop={handleDrop}
                onDragOver={handleDragOver}>
                <UploadIcon size={80} />
                <p className="mt-2 text-sm text-gray-300">
                  <span className="text-purple-400">Drag & drop folder</span> or{' '}
                  <span className="cursor-pointer text-purple-400">
                    Click to Browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Select an entire folder with pipeline model files
                </p>
                <input
                  id="pipelineInput"
                  type="file"
                  {...{
                    webkitdirectory: '',
                    directory: '',
                    multiple: true,
                  }}
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files || [])}
                />
              </div>
            </div>

            <div className="flex justify-start gap-8 pl-4">
              <div className="w-1/2">
                <label className="mb-2 block font-medium text-white">
                  Pipeline Name:*
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  required
                  maxLength={128}
                  minLength={1}
                  className="h-10 w-full rounded-md border border-gray-300 p-2 text-black"
                  placeholder="Enter a name for this pipeline"
                />
              </div>
              <div>
                <label className="mb-2 block font-medium text-white">
                  Model Type:*
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  required
                  className="h-10 rounded-md border border-secondary-300 px-2 text-black">
                  <option value="">Select</option>
                  <option value="regression">Regression</option>
                  <option value="classification">Classification</option>
                </select>
              </div>
            </div>

            <h3 className="mb-2 p-4 text-lg font-medium text-white">
              Selected Files:{' '}
              <span className="text-sm font-normal text-gray-400">
                ({selectedFiles.length} files)
              </span>
            </h3>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mb-8 pl-4 pr-6">
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border-2 border-gray-400 p-6">
                  {/* Group files by folder */}
                  {(() => {
                    const filesByFolder: Record<string, FileWithPath[]> = {};
                    selectedFiles.forEach((file) => {
                      const path = file.webkitRelativePath || '';
                      const parts = path.split('/');
                      // If it's just a file in the root folder
                      if (parts.length <= 2) {
                        const folder = parts[0] || 'Root';
                        if (!filesByFolder[folder]) filesByFolder[folder] = [];
                        filesByFolder[folder].push(file);
                      } else {
                        // Group by first-level subfolder
                        const folder = parts.slice(0, 2).join('/');
                        if (!filesByFolder[folder]) filesByFolder[folder] = [];
                        filesByFolder[folder].push(file);
                      }
                    });

                    return Object.entries(filesByFolder).map(
                      ([folder, files]) => {
                        const folderParts = folder.split('/');
                        const displayName =
                          folderParts.length > 1
                            ? `${folderParts[0]}/${folderParts[1]}/`
                            : `${folderParts[0]}/`;

                        return (
                          <div
                            key={folder}
                            className="mb-4">
                            <h4 className="mb-2 font-medium text-purple-400">
                              {displayName}{' '}
                              <span className="text-sm font-normal text-gray-400">
                                ({files.length} files)
                              </span>
                            </h4>
                            <ul className="list-inside list-disc space-y-2 pl-4 text-white">
                              {files.slice(0, 5).map((file, index) => {
                                const pathParts = file.webkitRelativePath.split('/');
                                const displayPath =
                                  pathParts.length > 2
                                    ? pathParts.slice(2).join('/')
                                    : pathParts[pathParts.length - 1];

                                return (
                                  <li
                                    key={index}
                                    className="flex items-center gap-4">
                                    <span className="text-sm text-white">
                                      {displayPath}
                                    </span>
                                  </li>
                                );
                              })}
                              {files.length > 5 && (
                                <li className="text-sm text-gray-400">
                                  ...and {files.length - 5} more file(s)
                                </li>
                              )}
                            </ul>
                          </div>
                        );
                      }
                    );
                  })()}
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      variant={ButtonVariant.SECONDARY}
                      onClick={() => setSelectedFiles([])}
                      text="CLEAR ALL"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 mt-6 mt-auto flex items-center justify-end gap-4 pr-6">
              <Button
                pill
                size="sm"
                type="button"
                variant={ButtonVariant.SECONDARY}
                onClick={() => {
                  console.log('User cancelled pipeline upload');
                  onBack();
                }}
                text="CANCEL"
              />
              <Button
                size="sm"
                type="submit"
                pill
                variant={ButtonVariant.PRIMARY}
                disabled={
                  isLoading || !selectedFiles || selectedFiles.length === 0
                }
                text={isLoading ? 'Uploading...' : 'UPLOAD PIPELINE'}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PipelineUploader;
