'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { useUploadFiles } from '@/app/plugins/upload/hooks/useUploadFile';
import { FileUpload } from '@/app/plugins/utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';

const PluginUploader = () => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
    },
  });

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
    
    // Clear the file input value to allow re-selecting the same file
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
        onProgress: (progress) => {
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
      aria-label="Plugin uploader container">
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
            heading="Upload New Plugin"
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
            <Link href="/plugins">
              <Icon
                name={IconName.ArrowLeft}
                color="white"
                size={30}
                aria-label="Back to plugins"
              />
            </Link>
            <h1
              className="ml-6 text-2xl font-semibold text-white"
              aria-label="upload plugin header"
              aria-level={1}>
              Add New Plugin {'>'} Upload Plugin File
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
                  Check that the plugin file meets the following requirments.
                </p>
                <div className="rounded-md border border-secondary-400 p-4 text-[0.8rem]">
                  <ul
                    className="list-none"
                    role="list"
                    aria-label="list of plugin upload requirements">
                    <li role="listitem">
                      File Format:{' '}
                      <span className="text-secondary-300">
                        ZIP file
                      </span>
                    </li>
                    <li role="listitem">
                      Plugin Structure:{' '}
                      <span className="text-secondary-300">
                        Must contain plugin.meta.json file or pyproject.toml for
                        algorithms
                      </span>
                    </li>
                    <li role="listitem">
                      Supported Components:{' '}
                      <span className="text-secondary-300">
                        Algorithms, Widgets, Input Blocks, and Templates
                      </span>
                    </li>
                    <li role="listitem">
                      File Size:{' '}
                      <span className="text-secondary-300">Less than 4GB</span>
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
            <div className="ml-auto mt-5 flex items-center">
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

export default PluginUploader;
