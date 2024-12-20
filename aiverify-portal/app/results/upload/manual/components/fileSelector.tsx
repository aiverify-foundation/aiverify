'use client';

import React, { useImperativeHandle, useState } from 'react';
import { FileUpload } from '@/app/results/upload/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { FileSelect } from '@/lib/components/fileSelect';
import { cn } from '@/lib/utils/twmerge';

export interface FileSelectorHandle {
  getFiles: () => FileUpload[];
  clearFiles: () => void;
}

type FileSelectorProps = {
  ref: React.ForwardedRef<FileSelectorHandle>;
  className?: string;
  onFilesUpdated?: (files: FileUpload[]) => void;
};

export function FileSelector({
  ref,
  className,
  onFilesUpdated,
}: FileSelectorProps) {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);

  useImperativeHandle(ref, () => ({
    getFiles: () => fileUploads,
    clearFiles: () => setFileUploads([]),
  }));

  function handleFileChange(files: File[]) {
    if (files.length === 0) return; //Todo: handle empty files
    const filesToUpload = Array.from(files);
    const newUploads: FileUpload[] = filesToUpload.map((file) => ({
      file,
      progress: 0,
      status: 'idle',
      id: Math.random().toString(36).substring(2, 9),
    }));
    setFileUploads((prevUploads) => {
      const updatedUploads = [...prevUploads, ...newUploads];
      onFilesUpdated?.(updatedUploads);
      return updatedUploads;
    });
  }

  const removeUpload = (id: string) => {
    setFileUploads((prevUploads) => {
      const filteredUploads = prevUploads.filter((upload) => upload.id !== id);
      onFilesUpdated?.(filteredUploads);
      return filteredUploads;
    });
  };

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
    </div>
  );
}
