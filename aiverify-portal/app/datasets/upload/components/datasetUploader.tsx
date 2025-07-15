'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DatasetFolderUploader } from '@/app/datasets/upload/components/DatasetFolderUploader';
import { FileUpload } from '@/app/datasets/upload/types';
import { uploadDatasetFile } from '@/app/datasets/upload/utils/uploadDatasetFile';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';

function DatasetFileUploader() {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleFileChange = (files: File[]) => {
    if (files.length === 0) return;
    const filesToUpload = Array.from(files);
    const newUploads: FileUpload[] = filesToUpload.map((file) => ({
      file,
      progress: 0,
      status: 'idle',
      id: Math.random().toString(36).substring(2, 9),
    }));
    setFileUploads((prevUploads) => [...prevUploads, ...newUploads]);
    
    // Clear the file input value to allow reselecting the same files
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const removeUpload = (id: string) => {
    setFileUploads((prevUploads) =>
      prevUploads.filter((upload) => upload.id !== id)
    );
  };

  const uploadFiles = () => {
    if (fileUploads.length === 0) return;
    setIsUploading(true);

    const uploadPromises = fileUploads.map((fileUpload) => {
      setFileUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload.id === fileUpload.id
            ? { ...upload, status: 'uploading' }
            : upload
        )
      );

      return uploadDatasetFile({
        fileUpload,
        onProgress: (progress) => {
          setFileUploads((prevUploads) => {
            const updatedUploads = prevUploads.map((upload) =>
              upload.id === fileUpload.id ? { ...upload, progress } : upload
            );
            return updatedUploads;
          });
        },
      });
    });

    Promise.allSettled(uploadPromises).then((results) => {
      let hasErrors = false;
      const updatedUploads: FileUpload[] = fileUploads.map((upload, i) => {
        if (results[i].status === 'rejected') {
          hasErrors = true;
          return {
            ...upload,
            status: 'error',
            progress: 100,
            error: results[i].reason,
          };
        }
        return { ...upload, status: 'success', progress: 100 };
      });
      setFileUploads(updatedUploads);
      setIsUploading(false);
      setModalMessage(
        hasErrors ? 'Some files failed to upload.' : 'Upload Successful!'
      );
      setIsModalVisible(true);

      // After a short delay, reset all fields to initial state
      setTimeout(() => {
        setFileUploads([]);
        // Clear the file input value to allow reselecting files
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }, 2000); // 2 second delay to let the user see the completion status
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
  };

  return (
    <div
      className="relative flex h-full overflow-y-auto scrollbar-hidden"
      role="region"
      aria-label="Dataset file uploader container">
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
            heading="Upload Dataset"
            height={200}>
            <p id="upload-confirmation-message">{modalMessage}</p>
          </Modal>
        </div>
      )}
      <div className="mt-6 h-[calc(100%-2rem)] w-full overflow-y-auto p-6">
        <div className="flex">
          <div
            className="mr-20 flex w-full flex-col"
            role="main"
            aria-label="File upload section">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3>Before uploading...</h3>
                <p className="mb-6 text-[0.9rem] text-secondary-300">
                  Check that the dataset file meets the following requirments.
                </p>
                <div className="rounded-md border border-secondary-400 p-4 text-[0.8rem]">
                  <ul
                    className="list-none"
                    role="list"
                    aria-label="list of dataset upload requirements">
                    <li role="listitem">
                      File Size:{' '}
                      <span className="text-secondary-300">Less than 4GB</span>
                    </li>
                    <li role="listitem">
                      Data Format:{' '}
                      <span className="text-secondary-300">
                        Pandas, Delimiter-separated Values (comma, tab,
                        semicolon, pipe, space, colon), Image(jpeg, jpg, png)
                      </span>
                    </li>
                    <li role="listitem">
                      Serialiser Type:{' '}
                      <span className="text-secondary-300">Pickle, Joblib</span>
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
                  onChange={(e) =>
                    handleFileChange(Array.from(e.target.files || []))
                  }
                />
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
                      onClick={() => removeUpload(file.id)}
                      disabled={file.status !== 'idle'}>
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
                  <span className={styles.fileStatus}>
                    {file.status === 'success'
                      ? 'Uploaded'
                      : file.status === 'uploading'
                        ? 'Uploading'
                        : file.status === 'error'
                          ? 'Error'
                          : ''}
                  </span>
                  {file.status === 'error' && file.error && (
                    <span className="mt-1 block text-xs text-red-500">
                      {file.error.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="ml-auto mt-5 flex items-center">
              <Button
                className="rounded-md border-none bg-primary-400 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-secondary-900 disabled:text-secondary-600"
                size="sm"
                variant={ButtonVariant.PRIMARY}
                onClick={() => uploadFiles()}
                disabled={
                  isUploading ||
                  !fileUploads.some((file) => file.status === 'idle')
                }
                text={isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
              />
              <Link
                href="/datasets"
                className="ml-4">
                <Button
                  size="sm"
                  variant={ButtonVariant.PRIMARY}
                  text="VIEW DATASETS"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DatasetUploader() {
  const [activeTab, setActiveTab] = useState<'file' | 'folder'>('file');

  const handleTabChange = (tab: 'file' | 'folder') => {
    console.log(`User selected ${tab.toUpperCase()} upload tab`);
    setActiveTab(tab);
  };

  return (
    <div className="relative mb-8 flex h-[calc(100vh-150px)] overflow-y-auto rounded-lg bg-secondary-950 scrollbar-hidden">
      <div className="h-[calc(100%-3rem)] w-full overflow-y-auto p-6">
        <div
          className="mb-2 flex items-center justify-between"
          role="banner"
          aria-label="Uploader header">
          <div className="flex items-center">
            <Link href="/datasets">
              <Icon
                name={IconName.ArrowLeft}
                color="white"
                size={30}
                aria-label="Back to datasets"
              />
            </Link>
            <h1
              className="ml-6 text-2xl font-semibold text-white"
              aria-label="upload dataset header"
              aria-level={1}>
              Add New Dataset {'>'} Upload Dataset
            </h1>
          </div>

          <div className="inline-flex">
            <div className="flex items-center">
              <Button
                pill
                textColor="white"
                variant={
                  activeTab === 'file'
                    ? ButtonVariant.PRIMARY
                    : ButtonVariant.OUTLINE
                }
                size="sm"
                text="FILE"
                className="!rounded-r-none rounded-l-full"
                onClick={() => handleTabChange('file')}
              />
              <Button
                pill
                textColor="white"
                variant={
                  activeTab === 'folder'
                    ? ButtonVariant.PRIMARY
                    : ButtonVariant.OUTLINE
                }
                size="sm"
                text="FOLDER"
                className="!rounded-l-none rounded-r-full"
                onClick={() => handleTabChange('folder')}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg">
          {activeTab === 'file' ? (
            <DatasetFileUploader />
          ) : (
            <DatasetFolderUploader />
          )}
        </div>
      </div>
    </div>
  );
}