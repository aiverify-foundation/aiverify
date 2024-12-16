'use client';
import React, { useState } from 'react';
import styles from './Uploader.module.css';
import { UploadStatus,FileUpload } from '../../utils/types';

interface UploadZipFileArgs {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
}

const uploadZipFile = async ({ fileUpload, onProgress }: UploadZipFileArgs): Promise<void> => {
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

  const handleFileChange = (files: File[]) => {
    if (files.length === 0) return; // Handle empty files
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

  const uploadFiles = async () => {
    if (fileUploads.length === 0) return;
    setIsUploading(true);

    try {
      for (const fileUpload of fileUploads) {
        setFileUploads((prevUploads) =>
          prevUploads.map((upload) =>
            upload.id === fileUpload.id
              ? { ...upload, status: 'uploading' }
              : upload
          )
        );

        try {
          await uploadZipFile({
            fileUpload,
            onProgress: (progress) => {
              setFileUploads((prevUploads) =>
                prevUploads.map((upload) =>
                  upload.id === fileUpload.id ? { ...upload, progress } : upload
                )
              );
            },
          });

          setFileUploads((prevUploads) =>
            prevUploads.map((upload) =>
              upload.id === fileUpload.id
                ? { ...upload, status: "success", progress: 100 }
                : upload
            )
          );
        } catch (error) {
          setFileUploads((prevUploads) =>
            prevUploads.map((upload) =>
              upload.id === fileUpload.id
                ? { ...upload, status: 'error' }
                : upload
            )
          );
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Upload Plugin Zip File</h1>
      <h2>
        If you have a zipfile of your plugin, use the zip file uploader below
      </h2>
      <div className={styles.uploadSection}>
        <div className={styles.dropzone}>
          <label htmlFor="file-upload" className={styles.dropzoneLabel}>
            Click to upload or drag files here
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".zip"
            multiple
            className={styles.fileInput}
            onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          />
        </div>
        <div className={styles.fileList}>
          {fileUploads.map((file) => (
            <div key={file.id} className={styles.fileItem}>
              <div className={styles.fileHeader}>
                <div className={styles.fileName}>{file.file.name}</div>
                <button
                  className={styles.removeButton}
                  onClick={() => removeUpload(file.id)}
                >
                  Remove
                </button>
              </div>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <span className={styles.fileStatus}>{file.status}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        className={styles.uploadButton}
        onClick={uploadFiles}
        disabled={isUploading || !fileUploads.some((file) => file.status === 'idle')}
      >
        {isUploading ? 'Uploading...' : 'Confirm Upload'}
      </button>
    </div>
  );
};

export default PluginUploader;