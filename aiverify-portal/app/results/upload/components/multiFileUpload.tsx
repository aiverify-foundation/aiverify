'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/app/results/upload/components/types';
import { FileSelect } from '@/lib/components/fileSelect';
import { useUploadFiles } from './hooks/useUploadFile';
import { Button, ButtonVariant } from '@/lib/components/button';

export function FileUploader() {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const { mutate: upload } = useUploadFiles({
    onSuccess: (data) => {
      setFileUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload.id === data.id ? { ...upload, ...data } : upload
        )
      );
      console.log('Upload success');
    },
    onError: (error) => {
      console.error('Upload error', error);
    },
  });

  function handleFileChange(files: File[]) {
    if (files.length === 0) return; //Todo: handle empty files
    const filesToUpload = Array.from(files);
    const newUploads: FileUpload[] = filesToUpload.map((file) => ({
      file,
      progress: 0,
      status: 'idle',
      id: Math.random().toString(36).substring(2, 9),
    }));
    setFileUploads(newUploads);
  }

  function handleUpload() {
    fileUploads
      .filter((fileUpload) => fileUpload.status === 'idle')
      .forEach((fileUpload) => {
        upload(
          {
            fileUpload,
            onProgress: (percent) => {
              console.log('Upload progress', percent);
            },
          },
          {
            onSuccess: (data, variables) => {
              console.log(data);
              console.log('Upload success');
            },
            onError: (error) => {
              console.error('Upload error', error);
            },
          }
        );
      });
  }

  return (
    <div className="flex flex-col gap-4">
      <FileSelect onFilesSelected={handleFileChange}>
        <FileSelect.Input
          accept="*/*"
          multiple
        />
        <FileSelect.DropZone
          style={{
            backgroundColor: '#f0f9ff',
            borderColor: '#3b82f6',
            borderRadius: '8px',
            padding: '40px',
          }}>
          <p style={{ color: '#3b82f6' }}>Upload your files here</p>
        </FileSelect.DropZone>
      </FileSelect>
      <Button
        onClick={handleUpload}
        text="Upload"
        variant={ButtonVariant.PRIMARY}
        size="md"
      />
    </div>
  );
}
