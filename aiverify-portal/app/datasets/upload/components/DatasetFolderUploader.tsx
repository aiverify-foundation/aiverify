'use client';

import { useState } from 'react';
import useUploadFolder from '@/app/datasets/upload/hooks/useUploadFolder';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';

// Extended File interface with webkitRelativePath
interface FileWithPath extends File {
  webkitRelativePath: string;
}

export function DatasetFolderUploader() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [folderName, setFolderName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { mutate, status } = useUploadFolder();
  const isLoading = status === 'pending';

  const handleFiles = (files: FileList | File[]) => {
    // Only allow one folder upload at a time
    // Clear previous selections when a new folder is selected
    if (files.length > 0 && 'webkitRelativePath' in files[0]) {
      // Get folder name from first file's path
      const folderPath = (files[0] as FileWithPath).webkitRelativePath.split(
        '/'
      )[0];

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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
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

    if (!folderName) {
      setModalMessage('Please enter a folder name.');
      setIsModalVisible(true);
      return;
    }

    console.log('=== PREPARING DATASET FOLDER UPLOAD ===');
    console.log(`Folder name: ${folderName}`);
    console.log(`Total files selected: ${selectedFiles.length}`);

    // Group files by their direct parent folder for display
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

    // Get the root folder name from the first file's path for debugging
    const rootFolderName =
      selectedFiles[0]?.webkitRelativePath?.split('/')[0] || '';
    console.log(`Detected root folder name: ${rootFolderName}`);

    // Create a new FormData object with cleaned filenames
    const cleanedFormData = new FormData();

    // Extract and add subfolder information for each file
    const subfolderPaths: string[] = [];

    // Files logging for debugging
    const fileDetails: Array<{
      originalName: string;
      originalPath: string;
      cleanedName: string;
      subfolder: string;
    }> = [];

    // Process all files to extract clean filenames and proper subfolder paths
    Array.from(selectedFiles).forEach((file) => {
      const originalPath = file.webkitRelativePath;
      const pathParts = originalPath.split('/');

      // Extract just the filename without path
      const baseFilename = pathParts[pathParts.length - 1];

      // Create a new File object with the same content but a clean filename
      const cleanedFile = new File([file], baseFilename, { type: file.type });

      // Add the cleaned file to FormData
      cleanedFormData.append('files', cleanedFile);

      // Determine the subfolder path (starting with './')
      let subfolderPath = './';
      if (pathParts.length > 2) {
        // File is in a subfolder, extract the path between root folder and filename
        subfolderPath = './' + pathParts.slice(1, -1).join('/');
      }

      subfolderPaths.push(subfolderPath);

      // Store details for logging
      fileDetails.push({
        originalName: file.name,
        originalPath: file.webkitRelativePath,
        cleanedName: baseFilename,
        subfolder: subfolderPath,
      });
    });

    console.log('Files to upload (first 5):');
    fileDetails.slice(0, 5).forEach((file, index) => {
      console.log(`${index + 1}. Original: ${file.originalName}`);
      console.log(`   Original path: ${file.originalPath}`);
      console.log(`   Cleaned name: ${file.cleanedName}`);
      console.log(`   Subfolder: ${file.subfolder}`);
    });

    if (fileDetails.length > 5) {
      console.log(`... and ${fileDetails.length - 5} more files`);
    }

    // Add the folder name and subfolders to the cleaned form data
    cleanedFormData.append('foldername', folderName);
    cleanedFormData.append('subfolders', subfolderPaths.join(','));

    console.log('Sending folder name:', folderName);
    console.log(
      'Subfolders parameter:',
      subfolderPaths.join(',').substring(0, 100) +
        (subfolderPaths.join(',').length > 100 ? '...' : '')
    );
    console.log('=== SENDING UPLOAD REQUEST ===');

    // Clear selection immediately when submitting
    setSelectedFiles([]);

    mutate(cleanedFormData, {
      onSuccess: (data) => {
        console.log('=== DATASET UPLOAD COMPLETED SUCCESSFULLY ===');
        console.log('Response data:', data);
        setModalMessage('Dataset folder uploaded successfully!');
        setIsModalVisible(true);
        // Reset all fields to initial state
        setFolderName('');
        setSelectedFiles([]);
      },
      onError: (error) => {
        console.log('=== DATASET UPLOAD FAILED ===');
        console.error('Error details:', error);
        setModalMessage(
          `Error uploading dataset folder: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setIsModalVisible(true);
        // Reset all fields to initial state
        setFolderName('');
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

      <div className="w-full">
        <div className="flex w-full flex-col overflow-y-auto scrollbar-hidden">
          <form
            onSubmit={handleSubmit}
            className="w-full">
            {/* Upload Requirements */}
            <div className="flex w-full items-start space-x-20 p-4">
              {/* Left Section: Header, Description, and Requirements */}
              <div className="w-1/2">
                <h2 className="text-lg font-semibold">Before uploading...</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Check that the dataset folder meets the following
                  requirements.
                </p>
                <div className="mt-4 rounded-lg border border-secondary-300 p-4">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      <strong>File Size:</strong> Less than 4GB
                    </li>
                    <li>
                      <strong>Data Format:</strong> Pandas, Delimiter-separated
                      Values (comma, tab, semicolon, pipe, space, colon),
                      Image(jpeg, jpg, png)
                    </li>
                    <li>
                      <strong>Serializer Type:</strong> Pickle, Joblib
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Section: Drag & Drop Upload */}
              <div
                className={`${styles.dropzone} flex-1`}
                onClick={() => document.getElementById('folderInput')?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}>
                <p className="text-[0.9rem] text-white">
                  <span className="text-purple-400">Drag & drop folder</span> or{' '}
                  <span className="cursor-pointer text-purple-400">
                    Click to Browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Select an entire folder with dataset files
                </p>
                <input
                  id="folderInput"
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
                  Dataset Folder Name:*
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  required
                  maxLength={128}
                  minLength={1}
                  className="h-10 w-full rounded-md border border-gray-300 p-2 text-black"
                  placeholder="Enter a name for this dataset folder"
                />
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
                                const pathParts =
                                  file.webkitRelativePath.split('/');
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
                size="sm"
                type="submit"
                variant={ButtonVariant.PRIMARY}
                disabled={
                  isLoading || !selectedFiles || selectedFiles.length === 0
                }
                text={isLoading ? 'Uploading...' : 'UPLOAD FOLDER'}
              />
              <Button
                size="sm"
                type="button"
                variant={ButtonVariant.SECONDARY}
                onClick={() => (window.location.href = '/datasets')}
                text="VIEW DATASETS"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
