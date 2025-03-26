'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { FileUpload } from '@/app/templates/types';
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
  const [fileValidationInfo, setFileValidationInfo] = useState<string>('');

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

  const validateJsonFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target?.result) {
            // Try to parse the JSON
            const content = e.target.result as string;
            const parsedJson = JSON.parse(content);
            console.log('JSON structure validation:', parsedJson);
            setFileValidationInfo(`${file.name} is valid JSON format`);
            resolve(true);
          } else {
            setFileValidationInfo(`${file.name} could not be read`);
            resolve(false);
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
          setFileValidationInfo(`${file.name} is not valid JSON format`);
          resolve(false);
        }
      };

      reader.onerror = () => {
        setFileValidationInfo(`Error reading ${file.name}`);
        resolve(false);
      };

      reader.readAsText(file);
    });
  };

  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;

    // Clear previous validation info
    setFileValidationInfo('');

    // Filter only JSON files
    const jsonFiles = Array.from(files).filter(
      (file) =>
        file.type === 'application/json' ||
        file.name.toLowerCase().endsWith('.json')
    );

    if (jsonFiles.length === 0) {
      setModalMessage('Only JSON files are allowed.');
      setIsModalVisible(true);
      return;
    }

    // Validate each JSON file
    for (const file of jsonFiles) {
      await validateJsonFile(file);
    }

    const newUploads: FileUpload[] = jsonFiles.map((file) => ({
      file,
      progress: 0,
      status: 'idle',
      id: Math.random().toString(36).substring(2, 9),
    }));

    setFileUploads((prevUploads) => [...prevUploads, ...newUploads]);
  };

  const debugFileInfo = () => {
    if (fileUploads.length === 0) {
      console.log('No files selected');
      return;
    }

    fileUploads.forEach((upload) => {
      const file = upload.file;
      console.log('Debug file info:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      });

      // Read file content for debugging
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const firstFewChars =
            content.substring(0, 200) + (content.length > 200 ? '...' : '');
          console.log(`File content preview (${file.name}):`, firstFewChars);
          console.log('Full content length:', content.length);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      };
      reader.readAsText(file);
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
                        JSON files only
                      </span>
                    </li>
                    <li role="listitem">
                      File Structure:{' '}
                      <span className="text-secondary-300">
                        Must follow the template schema
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
                  accept=".json, application/json"
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
                    <div className={styles.fileName}>{file.file.name}</div>
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
