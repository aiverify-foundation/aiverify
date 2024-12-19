'use client';
import React, { useState } from 'react';
import styles from './Uploader.module.css';
import Link from 'next/link';
import { UploadStatus, FileUpload } from '../../utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { useUploadFiles } from '../hooks/useUploadFile';
import { Modal } from '@/lib/components/modal';

interface UploadZipFileArgs {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
}

const uploadZipFile = async ({
  fileUpload,
  onProgress,
}: UploadZipFileArgs): Promise<void> => {
  return new Promise((resolve, reject) => {
    const totalSteps = 10;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += 1;
      const progress = (currentStep / totalSteps) * 100;
      onProgress(progress);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
};

const PluginUploader = () => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Hook for managing file upload
  const { mutate} = useUploadFiles({
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
      const errorMessage = error.message || 'An unexpected error occurred during upload.';
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
  };

  const removeUpload = (id: string) => {
    setFileUploads((prevUploads) => prevUploads.filter((upload) => upload.id !== id));
  };

  const uploadFiles = () => {
    if (fileUploads.length === 0) return;
    setIsUploading(true);

    fileUploads.forEach((fileUpload) => {
      setFileUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload.id === fileUpload.id ? { ...upload, status: 'uploading' } : upload
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
    <div className='flex h-[calc(100vh-200px)] bg-secondary-950 pl-10 mb-8 overflow-y-auto scrollbar-hidden relative'>
      {/* Delete Popup */}
    {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
           <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={closeModal}
            enableScreenOverlay
            heading="Deletion"
            height={200}
          >
            <p>{modalMessage}</p>
          </Modal>
        </div>
    )}
      <div className='mt-6 w-full'>
        <div className='flex'>
          <div className='mt-1 pr-12'>
            <Link href={'/plugins'}>
              <Icon name={IconName.ArrowLeft} color='white'/>
            </Link>
          </div>
          <div className='flex flex-col w-full'>
            <h3 className='text-xl font-semibold mb-10'>Upload Plugin Zip File</h3>
            <h2> If you have a zipfile of your plugin, use the zip file uploader below </h2>
            <div className={styles.uploadSection}>
              <div
                className={styles.dropzone}
                onClick={() => document.getElementById("fileInput")?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: "none" }}
                  multiple
                  onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
                />
                <p>Click or drag files here to upload</p>
              </div>
              <div className='w-full'>
                <h2 className='max-w-[900px] mx-auto mb-2'>Selected Files:</h2>
                {fileUploads.map((file) => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileHeader}>
                      <div className={styles.fileName}>{file.file.name}</div>
                      <button
                        className={styles.removeButton}
                        onClick={() => removeUpload(file.id)}
                      >
                        <Icon name={IconName.Close} color='white'/>
                      </button>
                    </div>
                    <div className={styles.progressBarContainer}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${file.progress}%`,
                          backgroundColor: file.status === 'error' ? 'red' : 'green',
                        }}
                      />
                    </div>
                    <span className={styles.fileStatus}>{file.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
            className='uploadButton absolute bottom-4 right-4'
            size='sm'
            variant={ButtonVariant.PRIMARY}
            onClick={() => uploadFiles()}
            disabled={isUploading || !fileUploads.some((file) => file.status === 'idle')}
            text={isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
          />
          </div>
        </div>
      </div>

    </div>

  );
};

export default PluginUploader;