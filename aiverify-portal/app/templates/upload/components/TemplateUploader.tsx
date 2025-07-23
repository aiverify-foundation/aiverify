'use client';
import JSZip from 'jszip';
import Link from 'next/link';
import React, { useState } from 'react';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { FileUpload, ProcessedTemplateData } from '@/app/templates/types';
import { useUploadFiles } from '@/app/templates/upload/hooks/useUploadFile';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';

const TemplateUploader = () => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [_fileValidationInfo, setFileValidationInfo] = useState<string>('');

  // Hook for managing file upload
  const { mutate } = useUploadFiles({
    onSuccess: () => {
      setFileUploads((prev) =>
        prev.map((file) => ({ ...file, status: 'success', progress: 100 }))
      );
      setModalMessage('Upload Successful!');
      setIsModalVisible(true);
    },
    onError: (error: Error) => {
      setFileUploads((prev) =>
        prev.map((file) => ({ ...file, status: 'error' }))
      );
      const errorMessage =
        error.message || 'An unexpected error occurred during upload.';
      setModalMessage(`Upload failed: ${errorMessage}`);
      setIsModalVisible(true);

      // Log the detailed error
      console.error('Upload error detail:', error);
    },
  });

  const validateZipFile = (file: File): Promise<{ isValid: boolean; processedData?: ProcessedTemplateData }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (e.target?.result) {
            const zipData = e.target.result as ArrayBuffer;
            const zip = new JSZip();
            
            // Load the zip file
            const zipContent = await zip.loadAsync(zipData);
            
            // Find files ending with .meta.json and .data.json
            const fileNames = Object.keys(zipContent.files);
            const metaFileName = fileNames.find(name => name.endsWith('.meta.json'));
            const dataFileName = fileNames.find(name => name.endsWith('.data.json'));
            
            if (!metaFileName || !dataFileName) {
              setFileValidationInfo(`${file.name} must contain files ending with .meta.json and .data.json`);
              resolve({ isValid: false });
              return;
            }
            
            const metaFile = zipContent.file(metaFileName);
            const dataFile = zipContent.file(dataFileName);
            
            if (!metaFile || !dataFile) {
              setFileValidationInfo(`${file.name} could not access the meta or data files`);
              resolve({ isValid: false });
              return;
            }
            
            // Extract and parse meta.json
            const metaContent = await metaFile.async('text');
            const metaData = JSON.parse(metaContent);
            
            // Extract and parse data.json
            const dataContent = await dataFile.async('text');
            const dataJson = JSON.parse(dataContent);
            
            // Validate that meta.json has required fields
            if (!metaData.name || !metaData.description) {
              setFileValidationInfo(`${file.name} ${metaFileName} must contain 'name' and 'description' fields`);
              resolve({ isValid: false });
              return;
            }
            
            // Merge metadata into data.json
            const enhancedData = {
              ...dataJson,
              projectInfo: {
                name: metaData.name,
                description: metaData.description
              }
            };
            
            console.log('ZIP file validation successful:', {
              metaFileName,
              dataFileName,
              metaData: { name: metaData.name, description: metaData.description },
              enhancedDataStructure: Object.keys(enhancedData)
            });
            
            setFileValidationInfo(`${file.name} is valid and processed successfully (found: ${metaFileName}, ${dataFileName})`);
            resolve({ isValid: true, processedData: enhancedData });
            
          } else {
            setFileValidationInfo(`${file.name} could not be read`);
            resolve({ isValid: false });
          }
        } catch (error) {
          console.error('ZIP processing error:', error);
          setFileValidationInfo(`${file.name} is not a valid ZIP file or contains invalid JSON`);
          resolve({ isValid: false });
        }
      };

      reader.onerror = () => {
        setFileValidationInfo(`Error reading ${file.name}`);
        resolve({ isValid: false });
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;

    // Clear previous validation info
    setFileValidationInfo('');

    // Filter only ZIP files
    const zipFiles = Array.from(files).filter(
      (file) =>
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed' ||
        file.name.toLowerCase().endsWith('.zip')
    );

    if (zipFiles.length === 0) {
      setModalMessage('Only ZIP files are allowed.');
      setIsModalVisible(true);
      // Clear the file input value
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      return;
    }

    // Validate each ZIP file and process them
    const processedUploads: FileUpload[] = [];
    
    for (const file of zipFiles) {
      const validationResult = await validateZipFile(file);
      
      if (validationResult.isValid && validationResult.processedData) {
        // Create a new File object with the processed JSON data
        const jsonString = JSON.stringify(validationResult.processedData, null, 2);
        const processedFile = new File([jsonString], file.name.replace('.zip', '.json'), {
          type: 'application/json'
        });
        
        processedUploads.push({
          file: processedFile,
          originalFile: file, // Keep reference to original ZIP file
          processedData: validationResult.processedData,
          progress: 0,
          status: 'idle',
          id: Math.random().toString(36).substring(2, 9),
        });
      }
    }

    if (processedUploads.length === 0) {
      setModalMessage('No valid ZIP files were processed. Please check file contents and try again.');
      setIsModalVisible(true);
      // Clear the file input value
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      return;
    }

    setFileUploads((prevUploads) => [...prevUploads, ...processedUploads]);
    
    // Clear the file input value to allow re-selecting the same file
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const _debugFileInfo = () => {
    if (fileUploads.length === 0) {
      console.log('No files selected');
      return;
    }

    fileUploads.forEach((upload) => {
      const file = upload.file;
      console.log('Debug file info:', {
        name: file.name,
        originalName: upload.originalFile?.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        hasProcessedData: !!upload.processedData,
      });

      if (upload.processedData) {
        console.log('Processed data structure:', {
          hasProjectInfo: !!upload.processedData.projectInfo,
          projectInfo: upload.processedData.projectInfo,
          dataKeys: Object.keys(upload.processedData)
        });
      }
    });
  };

  const removeUpload = (id: string) => {
    setFileUploads((prevUploads) =>
      prevUploads.filter((upload) => upload.id !== id)
    );
  };

  const uploadFiles = () => {
    if (fileUploads.length === 0) return;
    setIsUploading(true);

    fileUploads.forEach((fileUpload) => {
      setFileUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload.id === fileUpload.id
            ? { ...upload, status: 'uploading' }
            : upload
        )
      );

      // Call mutate to trigger the upload and track progress
      mutate({
        fileUpload,
        onProgress: (progress: number) => {
          setFileUploads((prevUploads) =>
            prevUploads.map((upload) =>
              upload.id === fileUpload.id ? { ...upload, progress } : upload
            )
          );
        },
      });
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileChange(Array.from(event.dataTransfer.files));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setIsUploading(false);
  };

  return (
    <div
      className="relative mb-8 flex h-[calc(100vh-200px)] overflow-y-auto rounded-lg bg-secondary-950 pl-10 scrollbar-hidden"
      role="region"
      aria-label="Template uploader container">
      {/* Upload Popup */}
      {isModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-label="upload status modal">
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={closeModal}
            enableScreenOverlay
            heading="Upload New Template"
            height={200}>
            <p id="upload-confirmation-message">{modalMessage}</p>
          </Modal>
        </div>
      )}
      <div className="mt-6 w-full p-8">
        <div
          className="mb-8 flex items-center justify-between"
          role="banner"
          aria-label="Uploader header">
          <div className="flex items-center">
            <Link href="/templates">
              <Icon
                name={IconName.ArrowLeft}
                color="white"
                size={30}
                aria-label="Back to templates"
              />
            </Link>
            <h1
              className="ml-6 text-2xl font-semibold text-white"
              aria-label="upload template header"
              aria-level={1}>
              Add New Template {'>'} Upload Template File
            </h1>
          </div>
        </div>
        <div className="flex">
          <div
            className="mr-20 flex w-full flex-col"
            role="main"
            aria-label="File upload section">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3>Before uploading...</h3>
                <p className="mb-6 text-[0.9rem] text-secondary-300">
                  Check that the template file meets the following requirements.
                </p>
                <div className="rounded-md border border-secondary-400 p-4 text-[0.8rem]">
                  <ul
                    className="list-none"
                    role="list"
                    aria-label="list of template upload requirements">
                    <li role="listitem">
                      File Type:{' '}
                      <span className="text-secondary-300">
                        ZIP files only
                      </span>
                    </li>
                    <li role="listitem">
                      File Structure:{' '}
                      <span className="text-secondary-300">
                        Must contain files ending with .meta.json and .data.json
                      </span>
                    </li>
                    <li role="listitem">
                      Metadata:{' '}
                      <span className="text-secondary-300">
                        .meta.json file must have name and description fields
                      </span>
                    </li>
                    <li role="listitem">
                      File Size:{' '}
                      <span className="text-secondary-300">Less than 2MB</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className={`${styles.dropzone} flex-1`}
                onClick={() => document.getElementById('fileInput')?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="button"
                aria-label="File drop zone">
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  multiple
                  accept=".zip, application/zip, application/x-zip-compressed"
                  onChange={(e) =>
                    handleFileChange(Array.from(e.target.files || []))
                  }
                />
                <UploadIcon size={80} />
                <p className="text-[0.9rem] text-white">
                  Drag & drop or &nbsp;
                  <span className="text-[0.9rem] text-purple-400">
                    Click to Browse
                  </span>
                  <br />
                </p>
              </div>
            </div>

            <h2 className="mb-2 mt-10 text-lg font-semibold">
              Selected Files:
            </h2>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border-2 border-gray-400 p-4">
              {fileUploads.map((file) => (
                <div
                  key={file.id}
                  className={styles.fileItem}>
                  <div className={styles.fileHeader}>
                    <div className={styles.fileName}>
                      {file.originalFile?.name || file.file.name}
                      {file.processedData?.projectInfo && (
                        <div className="text-xs text-secondary-300 mt-1">
                          {file.processedData.projectInfo.name} - {file.processedData.projectInfo.description}
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeUpload(file.id)}>
                      <Icon
                        name={IconName.Close}
                        color="white"
                      />
                    </button>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${file.progress}%`,
                        backgroundColor:
                          file.status === 'error' ? 'red' : 'green',
                      }}
                    />
                  </div>
                  <span className={styles.fileStatus}>{file.status}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end">
              <Button
                className="mb-5 rounded-md border-none bg-primary-400 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-secondary-900 disabled:text-secondary-600"
                size="sm"
                variant={ButtonVariant.PRIMARY}
                onClick={() => uploadFiles()}
                disabled={
                  isUploading ||
                  !fileUploads.some((file) => file.status === 'idle')
                }
                text={isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateUploader;
