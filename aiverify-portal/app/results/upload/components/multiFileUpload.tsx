'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/app/results/upload/components/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { FileSelect } from '@/lib/components/fileSelect';
import { cn } from '@/lib/utils/twmerge';
import { useUploadFiles } from './hooks/useUploadFile';
import { Icon, IconName } from '@/lib/components/IconSVG';

type FileUploaderProps = {
  className?: string;
  onFilesUpdated?: (files: FileUpload[]) => void;
};

export function FileUploader({ className, onFilesUpdated }: FileUploaderProps) {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const { mutate: upload } = useUploadFiles({
    onSuccess: () => {
      console.log('success message defined in init');
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
    setFileUploads((prevUploads) => [...prevUploads, ...newUploads]);
    onFilesUpdated?.([...fileUploads, ...newUploads]);
  }

  const removeUpload = (id: string) => {
    setFileUploads((prevUploads) =>
      prevUploads.filter((upload) => upload.id !== id)
    );
  };

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
          }
        );
      });
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <FileSelect onFilesSelected={handleFileChange}>
        <FileSelect.Input
          accept="*/*"
          multiple
        />
        <FileSelect.DropZone
          style={{
            backgroundColor: 'var(--color-primary-700)',
            borderColor: 'var(--color-primary-600)',
            borderRadius: '4px',
            padding: '40px',
          }}>
          <p className="text-white">
            Add test artifacts here
            <br />
            <span className="text-[0.8rem] text-secondary-300">
              (click or drag & drop files)
            </span>
          </p>
        </FileSelect.DropZone>
      </FileSelect>
      <h4 className="mb-4 mt-6 text-[1rem] font-semibold">
        {fileUploads.length} Test Artifacts
      </h4>
      <ul className="flex w-full flex-col gap-2">
        {fileUploads.map((fileUpload) => (
          <li
            key={fileUpload.id}
            className="flex w-full justify-between overflow-hidden border-b border-b-primary-800 pb-2 text-[0.8rem]">
            <span className="max-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap">
              {fileUpload.file.name}
            </span>
            <Icon
              name={IconName.Close}
              svgClassName="stroke-white dark:stroke-white"
              onClick={() => removeUpload(fileUpload.id)}
            />
          </li>
        ))}
      </ul>
      {/* <Button
        onClick={handleUpload}
        text="Upload"
        variant={ButtonVariant.PRIMARY}
        size="md"
      /> */}
    </div>
  );
}
