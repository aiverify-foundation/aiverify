'use client';

import { useState } from 'react';
import useUploadFolder from '@/app/models/upload/hooks/useUploadFolder';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
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
  modelType: string;
}

const PipelineUploader = ({ onBack }: { onBack: () => void }) => {
  const [selectedFolders, setSelectedFolders] = useState<FolderGroup[]>([]);
  const [globalModelType, setGlobalModelType] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate, status } = useUploadFolder();

  const resetFileInput = () => {
    const fileInput = document.getElementById('pipelineInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Helper function to traverse directory entries recursively
  const traverseDirectory = async (entry: FileSystemEntry, path = ''): Promise<FileWithPath[]> => {
    const files: FileWithPath[] = [];
    
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
    
    return files;
  };

  const handleFiles = (files: FileList | FileWithPath[]) => {
    console.log('files:', files instanceof FileList, files);

    if (files instanceof FileList) {
      files = Array.from(files) as FileWithPath[];
    }

    if (files.length === 0) return;

    // Group files by their root folder name
    const folderGroups: Record<string, FileWithPath[]> = {};
    
    files.forEach((file) => {
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
      files,
      modelType: globalModelType // Use global model type as default
    }));

    // Add all new folders to existing ones - no duplicate checking
    setSelectedFolders(prevFolders => {
      const updatedFolders = [...prevFolders, ...newFolders];
      
      // Show message about added folders
      const message = `Added folder${newFolders.length > 1 ? 's' : ''}: ${newFolders.map(f => f.name).join(', ')}`;
      setModalMessage(message);
      setIsModalVisible(true);

      return updatedFolders;
    });
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

    // Convert folder groups to files array for handleFiles
    const processedFiles: FileWithPath[] = [];
    Object.values(folderGroups).forEach(files => {
      processedFiles.push(...files);
    });

    if (processedFiles.length > 0) {
      handleFiles(processedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const updateFolderModelType = (folderName: string, modelType: string) => {
    setSelectedFolders(prev => 
      prev.map(folder => 
        folder.name === folderName 
          ? { ...folder, modelType }
          : folder
      )
    );
  };

  const uploadFolder = async (folder: FolderGroup): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`=== UPLOADING PIPELINE FOLDER: ${folder.name} ===`);
      console.log(`Model type: ${folder.modelType}`);
      console.log(`Total files: ${folder.files.length}`);

      // Group files by their direct parent folder for display purposes
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

      // Create a new FormData object
      const formData = new FormData();

      // Extract and add subfolder information for each file
      const subfolderPaths: string[] = [];
      const fileDetails: Array<{
        name: string;
        path: string;
        subfolder: string;
      }> = [];

      folder.files.forEach((file) => {
        // Extract the subfolder path from webkitRelativePath
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

      // Add the rest of the required form data
      formData.append('foldername', folder.name);
      formData.append('model_type', folder.modelType);
      formData.append('file_type', 'pipeline');
      formData.append('subfolders', subfolderPaths.join(','));

      console.log('Sending folder name:', folder.name);
      console.log('Subfolders parameter:', subfolderPaths.join(','));
      console.log('Unique subfolders:', [...new Set(subfolderPaths)]);

      mutate(formData, {
        onSuccess: (data) => {
          console.log(`=== PIPELINE UPLOAD COMPLETED: ${folder.name} ===`);
          console.log('Response data:', data);
          resolve();
        },
        onError: (error: unknown) => {
          console.log(`=== PIPELINE UPLOAD FAILED: ${folder.name} ===`);
          console.error('Error details:', error);
          
          // The useUploadFolder hook already extracts error.detail from API response
          // So we can directly use error.message which contains the detailed error
          let errorMessage = 'Unknown error';
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
            errorMessage = (error as { message: string }).message;
          }
          
          // Create error object with folder name and detailed message
          const enhancedError = new Error(`${folder.name}: ${errorMessage}`);
          reject(enhancedError);
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

    // Check if all folders have model types
    const foldersWithoutModelType = selectedFolders.filter(folder => !folder.modelType);
    if (foldersWithoutModelType.length > 0) {
      setModalMessage(`Please select model type for all folders. Missing: ${foldersWithoutModelType.map(f => f.name).join(', ')}`);
      setIsModalVisible(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress([]);
    
    console.log('=== STARTING MULTIPLE PIPELINE UPLOAD ===');
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
      const failedDetails = results
        .filter(r => !r.success)
        .map(r => `${r.folder}: ${r.error}`)
        .join('; ');
      finalMessage += `\n\nFailed uploads:\n${failedDetails}`;
    }
    
    setModalMessage(finalMessage);
    setIsModalVisible(true);
    
    // Clear selections after upload
    setSelectedFolders([]);
    setUploadProgress([]);
    setGlobalModelType('');
    
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
          height={uploadProgress.length > 0 ? Math.min(500, 250 + uploadProgress.length * 20) : 300}>
          <div>
            <p className="mb-2 whitespace-pre-line">{modalMessage}</p>
            {uploadProgress.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto text-sm">
                {uploadProgress.map((message, index) => (
                  <div key={index} className="mb-1 font-mono text-xs">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  Check that the model pipeline folders meet the following
                  requirements. You can select multiple folders at once.
                </p>

                <div className="mt-4 rounded-lg border border-secondary-300 p-4">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      <strong>File Size:</strong> Less than 4GB per folder
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
                    <li>
                      <strong>Multiple Folders:</strong> Each folder will be uploaded as a separate pipeline
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
                  <span className="text-purple-400">Drag & drop folders</span> or{' '}
                  <span className="cursor-pointer text-purple-400">
                    Click to Browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Select multiple folders - each will be uploaded as a separate pipeline
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
                  onChange={(e) => {
                    handleFiles(e.target.files || []);
                    // Clear the input value to allow selecting the same files again
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="flex justify-start gap-8 pl-4">
              <div className="w-1/2">
                <label className="mb-2 block font-medium text-white">
                  Default Model Type:
                </label>
                <select
                  value={globalModelType}
                  onChange={(e) => {
                    setGlobalModelType(e.target.value);
                    // Update all folders that don't have a model type set
                    setSelectedFolders(prev => 
                      prev.map(folder => 
                        !folder.modelType ? { ...folder, modelType: e.target.value } : folder
                      )
                    );
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 px-2 text-black">
                  <option value="">Select default model type</option>
                  <option value="regression">Regression</option>
                  <option value="classification">Classification</option>
                  <option value="uplift">Uplift</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  This will be applied to newly selected folders. You can override individually below.
                </p>
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
                        <div className="flex items-center gap-3">
                          <select
                            value={folder.modelType}
                            onChange={(e) => updateFolderModelType(folder.name, e.target.value)}
                            required
                            className="h-8 rounded-md border border-secondary-300 px-2 text-black text-sm">
                            <option value="">Select Model Type</option>
                            <option value="regression">Regression</option>
                            <option value="classification">Classification</option>
                            <option value="uplift">Uplift</option>
                          </select>
                          <Button
                            size="sm"
                            type="button"
                            variant={ButtonVariant.SECONDARY}
                            onClick={() => removeFolderByName(folder.name)}
                            text="Remove"
                          />
                        </div>
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
                disabled={isUploading || selectedFolders.length === 0}
                text={isUploading ? 'Uploading...' : `UPLOAD ${selectedFolders.length} PIPELINE${selectedFolders.length !== 1 ? 'S' : ''}`}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PipelineUploader;
