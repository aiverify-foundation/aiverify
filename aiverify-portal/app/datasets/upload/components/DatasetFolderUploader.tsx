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

// Interface for grouped folders
interface FolderGroup {
  name: string;
  files: FileWithPath[];
}

export function DatasetFolderUploader() {
  const [selectedFolders, setSelectedFolders] = useState<FolderGroup[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate, status } = useUploadFolder();

  const resetFileInput = () => {
    const fileInput = document.getElementById('folderInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Helper function to traverse directory entries recursively
  const traverseDirectory = async (entry: FileSystemEntry, path = ''): Promise<FileWithPath[]> => {
    const files: FileWithPath[] = [];
    
    try {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        
        // Create a new File object with the same content but with a custom name that includes the path
        // This ensures it's a proper File object that can be used in FormData
        const newFile = new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });
        
        // Add webkitRelativePath as a non-enumerable property
        // Build the path by combining current path with filename
        const webkitRelativePath = path + file.name;
        Object.defineProperty(newFile, 'webkitRelativePath', {
          value: webkitRelativePath,
          writable: false,
          enumerable: false,
          configurable: false
        });
        
        console.log(`Built webkitRelativePath: "${webkitRelativePath}" from path: "${path}" + filename: "${file.name}"`);
        
        files.push(newFile as FileWithPath);
      } else if (entry.isDirectory) {
        const directoryEntry = entry as FileSystemDirectoryEntry;
        const reader = directoryEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        
        // Build the path for this directory level
        const currentPath = path + entry.name + '/';
        
        for (const subEntry of entries) {
          const subFiles = await traverseDirectory(subEntry, currentPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error('Error traversing directory:', error);
      // Return empty array on error to continue processing other files
    }
    
    return files;
  };

  const handleFiles = (files: FileList | File[]) => {
    if (files.length === 0) return;

    // Group files by their root folder name
    const folderGroups: Record<string, FileWithPath[]> = {};
    
    Array.from(files).forEach((file) => {
      if ('webkitRelativePath' in file) {
        const fileWithPath = file as FileWithPath;
        const rootFolderName = fileWithPath.webkitRelativePath.split('/')[0];
        
        if (!folderGroups[rootFolderName]) {
          folderGroups[rootFolderName] = [];
        }
        folderGroups[rootFolderName].push(fileWithPath);
      }
    });

    // Convert to FolderGroup array
    const newFolders: FolderGroup[] = Object.entries(folderGroups).map(([name, files]) => ({
      name,
      files
    }));

    // Add new folders to existing ones, avoiding duplicates
    setSelectedFolders(prevFolders => {
      const updatedFolders = [...prevFolders];
      const addedFolders: string[] = [];
      const replacedFolders: string[] = [];

      newFolders.forEach(newFolder => {
        const existingIndex = updatedFolders.findIndex(folder => folder.name === newFolder.name);
        if (existingIndex >= 0) {
          // Replace existing folder
          updatedFolders[existingIndex] = newFolder;
          replacedFolders.push(newFolder.name);
        } else {
          // Add new folder
          updatedFolders.push(newFolder);
          addedFolders.push(newFolder.name);
        }
      });

      // Show message about added/replaced folders
      let message = '';
      if (addedFolders.length > 0) {
        message += `Added folder${addedFolders.length > 1 ? 's' : ''}: ${addedFolders.join(', ')}`;
      }
      if (replacedFolders.length > 0) {
        if (message) message += '. ';
        message += `Replaced folder${replacedFolders.length > 1 ? 's' : ''}: ${replacedFolders.join(', ')}`;
      }
      
      if (message) {
        setModalMessage(message);
        setIsModalVisible(true);
      }

      return updatedFolders;
    });

    // Reset the file input value to allow reselecting the same folder
    resetFileInput();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const items = event.dataTransfer.items;
    if (!items) {
      // Fallback to regular file handling
      handleFiles(event.dataTransfer.files);
      return;
    }

    const allFiles: FileWithPath[] = [];
    const folderGroups: Record<string, FileWithPath[]> = {};

    // Process each dropped item
    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isDirectory) {
              // Handle directory - start with empty path, let traverseDirectory build the correct path
              const files = await traverseDirectory(entry, '');
              files.forEach(file => {
                const rootFolderName = file.webkitRelativePath.split('/')[0];
                if (!folderGroups[rootFolderName]) {
                  folderGroups[rootFolderName] = [];
                }
                folderGroups[rootFolderName].push(file);
              });
            } else {
              // Handle individual file
              if (typeof item.getAsFile === 'function') {
                const file = item.getAsFile();
                if (file) {
                  // Create a new File object with the same content
                  // This ensures it's a proper File object that can be used in FormData
                  const newFile = new File([file], file.name, {
                    type: file.type,
                    lastModified: file.lastModified,
                  });
                  
                  // Add webkitRelativePath as a non-enumerable property
                  Object.defineProperty(newFile, 'webkitRelativePath', {
                    value: file.name,
                    writable: false,
                    enumerable: false,
                    configurable: false
                  });
                  
                  const fileWithPath = newFile as FileWithPath;
                  
                  // Group single files under a generic folder name
                  const rootFolderName = 'DroppedFiles';
                  if (!folderGroups[rootFolderName]) {
                    folderGroups[rootFolderName] = [];
                  }
                  folderGroups[rootFolderName].push(fileWithPath);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing dropped item:', error);
        // Continue processing other items
      }
    }

    // Convert to FolderGroup array
    const newFolders: FolderGroup[] = Object.entries(folderGroups).map(([name, files]) => ({
      name,
      files
    }));

    if (newFolders.length > 0) {
      // Add new folders to existing ones, avoiding duplicates
      setSelectedFolders(prevFolders => {
        const updatedFolders = [...prevFolders];
        const addedFolders: string[] = [];
        const replacedFolders: string[] = [];

        newFolders.forEach(newFolder => {
          const existingIndex = updatedFolders.findIndex(folder => folder.name === newFolder.name);
          if (existingIndex >= 0) {
            // Replace existing folder
            updatedFolders[existingIndex] = newFolder;
            replacedFolders.push(newFolder.name);
          } else {
            // Add new folder
            updatedFolders.push(newFolder);
            addedFolders.push(newFolder.name);
          }
        });

        // Show message about added/replaced folders
        let message = '';
        if (addedFolders.length > 0) {
          message += `Added folder${addedFolders.length > 1 ? 's' : ''}: ${addedFolders.join(', ')}`;
        }
        if (replacedFolders.length > 0) {
          if (message) message += '. ';
          message += `Replaced folder${replacedFolders.length > 1 ? 's' : ''}: ${replacedFolders.join(', ')}`;
        }
        
        if (message) {
          setModalMessage(message);
          setIsModalVisible(true);
        }

        return updatedFolders;
      });
    }

    // Reset the file input value to allow reselecting the same folder
    resetFileInput();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const uploadFolder = async (folder: FolderGroup): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`=== UPLOADING DATASET FOLDER: ${folder.name} ===`);
      console.log(`Total files: ${folder.files.length}`);

      // Debug: Check the first file to see its properties
      if (folder.files.length > 0) {
        const firstFile = folder.files[0];
        console.log('First file debug info:');
        console.log('- name:', firstFile.name);
        console.log('- type:', firstFile.type);
        console.log('- size:', firstFile.size);
        console.log('- webkitRelativePath:', firstFile.webkitRelativePath);
        console.log('- constructor:', firstFile.constructor.name);
        console.log('- instanceof File:', firstFile instanceof File);
        console.log('- has stream method:', typeof firstFile.stream === 'function');
      }

      // Group files by their direct parent folder for display
      const folderCounts: Record<string, number> = {};
      folder.files.forEach((file) => {
        const path = file.webkitRelativePath || '';
        const parts = path.split('/');

        if (parts.length > 1) {
          const parentFolder =
            parts.length > 2 ? parts.slice(0, 2).join('/') : parts[0];
          folderCounts[parentFolder] = (folderCounts[parentFolder] || 0) + 1;
        }
      });

      console.log('Folder structure:');
      Object.entries(folderCounts).forEach(([folderPath, count]) => {
        console.log(`- ${folderPath}: ${count} files`);
      });

      // Create FormData object
      const formData = new FormData();

      // Extract and add subfolder information for each file
      const subfolderPaths: string[] = [];
      const fileDetails: Array<{
        name: string;
        path: string;
        subfolder: string;
      }> = [];

      // Process files and extract subfolder paths
      folder.files.forEach((file) => {
        // Extract subfolder path from webkitRelativePath
        const relativePath = file.webkitRelativePath;
        let subfolderPath = '';
        let cleanFileName = file.name;

        if (relativePath) {
          const pathParts = relativePath.split('/');
          // If file is directly in root folder (no subfolder)
          if (pathParts.length <= 2) {
            subfolderPath = '';
            cleanFileName = pathParts[pathParts.length - 1]; // Just the filename
          } else {
            // Extract the subfolder path (everything after the root folder name, excluding the filename)
            subfolderPath = pathParts.slice(1, -1).join('/');
            cleanFileName = pathParts[pathParts.length - 1]; // Just the filename
          }
        }

        // Create a new File object with clean filename (without folder path)
        const cleanFile = new File([file], cleanFileName, {
          type: file.type,
          lastModified: file.lastModified,
        });

        // Add the clean file to FormData
        formData.append('files', cleanFile);

        subfolderPaths.push(subfolderPath);
        fileDetails.push({
          name: cleanFileName,
          path: file.webkitRelativePath || '',
          subfolder: subfolderPath,
        });
      });

      console.log('Files to upload (first 5):');
      fileDetails.slice(0, 5).forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Original path: ${file.path}`);
        console.log(`   Subfolder: "${file.subfolder}"`);
      });

      if (fileDetails.length > 5) {
        console.log(`... and ${fileDetails.length - 5} more files`);
      }

      // Add the folder name and subfolders to FormData
      formData.append('foldername', folder.name);
      formData.append('subfolders', subfolderPaths.join(','));

      console.log('Sending folder name:', folder.name);
      console.log('Subfolders parameter:', subfolderPaths.join(','));
      console.log('Unique subfolders:', [...new Set(subfolderPaths)]);

      mutate(formData, {
        onSuccess: (data) => {
          console.log(`=== DATASET UPLOAD COMPLETED: ${folder.name} ===`);
          console.log('Response data:', data);
          resolve();
        },
        onError: (error) => {
          console.log(`=== DATASET UPLOAD FAILED: ${folder.name} ===`);
          console.error('Error details:', error);
          reject(error);
        },
      });
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFolders || selectedFolders.length === 0) {
      setModalMessage('Please select folders to upload.');
      setIsModalVisible(true);
      return;
    }

    // Check if any folder name is empty or invalid
    const foldersWithEmptyNames = selectedFolders.filter(folder => !folder.name.trim());
    if (foldersWithEmptyNames.length > 0) {
      setModalMessage('All folders must have valid names.');
      setIsModalVisible(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress([]);
    
    console.log('=== STARTING MULTIPLE FOLDER UPLOAD ===');
    console.log(`Total folders to upload: ${selectedFolders.length}`);
    
    const results: Array<{ folder: string; success: boolean; error?: string }> = [];
    
    for (let i = 0; i < selectedFolders.length; i++) {
      const folder = selectedFolders[i];
      
      setUploadProgress(prev => [...prev, `Uploading ${folder.name}...`]);
      
      try {
        await uploadFolder(folder);
        results.push({ folder: folder.name, success: true });
        setUploadProgress(prev => [...prev, `✓ ${folder.name} uploaded successfully`]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ folder: folder.name, success: false, error: errorMessage });
        setUploadProgress(prev => [...prev, `✗ ${folder.name} failed: ${errorMessage}`]);
      }
    }
    
    setIsUploading(false);
    
    // Show final results
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    let finalMessage = `Upload completed: ${successful} successful, ${failed} failed.`;
    if (failed > 0) {
      const failedFolders = results.filter(r => !r.success).map(r => r.folder);
      finalMessage += ` Failed folders: ${failedFolders.join(', ')}`;
    }
    
    setModalMessage(finalMessage);
    setIsModalVisible(true);
    
    // Clear selections after upload
    setSelectedFolders([]);
    setUploadProgress([]);
    
    // Reset file input to allow reselecting same folders
    resetFileInput();
  };

  const removeFolderByName = (folderName: string) => {
    setSelectedFolders(prev => prev.filter(folder => folder.name !== folderName));
  };

  const clearAllFolders = () => {
    setSelectedFolders([]);
    resetFileInput();
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const totalFiles = selectedFolders.reduce((sum, folder) => sum + folder.files.length, 0);

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
          height={uploadProgress.length > 0 ? Math.min(400, 200 + uploadProgress.length * 20) : 200}>
          <div>
            <p className="mb-2">{modalMessage}</p>
            {uploadProgress.length > 0 && (
              <div className="mt-4 max-h-48 overflow-y-auto text-sm">
                {uploadProgress.map((message, index) => (
                  <div key={index} className="mb-1">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  Check that the dataset folders meet the following
                  requirements. You can select multiple folders at once.
                </p>
                <div className="mt-4 rounded-lg border border-secondary-300 p-4">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      <strong>File Size:</strong> Less than 4GB per folder
                    </li>
                    <li>
                      <strong>Data Format:</strong> Pandas, Delimiter-separated
                      Values (comma, tab, semicolon, pipe, space, colon),
                      Image(jpeg, jpg, png)
                    </li>
                    <li>
                      <strong>Serializer Type:</strong> Pickle, Joblib
                    </li>
                    <li>
                      <strong>Multiple Folders:</strong> Each folder will be uploaded as a separate dataset
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
                  <span className="text-purple-400">Drag & drop folders</span> or{' '}
                  <span className="cursor-pointer text-purple-400">
                    Click to Browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Select multiple folders - each will be uploaded as a separate dataset
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

            <h3 className="mb-2 p-4 text-lg font-medium text-white">
              Selected Folders:{' '}
              <span className="text-sm font-normal text-gray-400">
                ({selectedFolders.length} folders, {totalFiles} total files)
              </span>
            </h3>
            
            {selectedFolders.length > 0 && (
              <div className="mb-8 pl-4 pr-6">
                <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border-2 border-gray-400 p-6">
                  {selectedFolders.map((folder, folderIndex) => (
                    <div key={folder.name} className="mb-6 rounded-lg border border-gray-600 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-purple-400">
                          📁 {folder.name}
                          <span className="text-sm font-normal text-gray-400 ml-2">
                            ({folder.files.length} files)
                          </span>
                        </h4>
                        <Button
                          size="sm"
                          type="button"
                          variant={ButtonVariant.SECONDARY}
                          onClick={() => removeFolderByName(folder.name)}
                          text="Remove"
                        />
                      </div>
                      
                      {/* Group files by subfolder within this root folder */}
                      {(() => {
                        const filesBySubfolder: Record<string, FileWithPath[]> = {};
                        folder.files.forEach((file) => {
                          const path = file.webkitRelativePath || '';
                          const parts = path.split('/');
                          // If it's just a file in the root folder
                          if (parts.length <= 2) {
                            const subfolder = 'Root';
                            if (!filesBySubfolder[subfolder]) filesBySubfolder[subfolder] = [];
                            filesBySubfolder[subfolder].push(file);
                          } else {
                            // Group by first-level subfolder
                            const subfolder = parts[1]; // Second part is the subfolder name
                            if (!filesBySubfolder[subfolder]) filesBySubfolder[subfolder] = [];
                            filesBySubfolder[subfolder].push(file);
                          }
                        });

                        return Object.entries(filesBySubfolder).map(([subfolder, files]) => (
                          <div key={subfolder} className="mb-3 ml-4">
                            <h5 className="mb-2 text-sm font-medium text-yellow-400">
                              📂 {subfolder}/
                              <span className="text-xs font-normal text-gray-400 ml-2">
                                ({files.length} files)
                              </span>
                            </h5>
                            <ul className="list-inside list-disc space-y-1 pl-4 text-white">
                              {files.slice(0, 3).map((file, index) => {
                                const pathParts = file.webkitRelativePath.split('/');
                                const displayPath = pathParts.length > 2 
                                  ? pathParts.slice(2).join('/')
                                  : pathParts[pathParts.length - 1];

                                return (
                                  <li key={index} className="text-xs text-gray-300">
                                    {displayPath}
                                  </li>
                                );
                              })}
                              {files.length > 3 && (
                                <li className="text-xs text-gray-500">
                                  ...and {files.length - 3} more file(s)
                                </li>
                              )}
                            </ul>
                          </div>
                        ));
                      })()}
                    </div>
                  ))}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      variant={ButtonVariant.SECONDARY}
                      onClick={clearAllFolders}
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
                disabled={isUploading || selectedFolders.length === 0}
                text={isUploading ? 'Uploading...' : `UPLOAD ${selectedFolders.length} FOLDER${selectedFolders.length !== 1 ? 'S' : ''}`}
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