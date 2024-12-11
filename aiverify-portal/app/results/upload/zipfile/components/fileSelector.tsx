'use client';

import React, { useImperativeHandle, useState } from 'react';
import { FileUpload } from '@/app/results/upload/manual/components/types';
import { uploadZipFile } from '@/app/results/upload/zipfile/utils/uploadZipFile';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { ButtonVariant } from '@/lib/components/button';
import { Button } from '@/lib/components/button';
import { FileSelect } from '@/lib/components/fileSelect';
import { cn } from '@/lib/utils/twmerge';
import styles from './styles/fileSelector.module.css';
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
  const [isUploading, setIsUploading] = useState(false);

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
                ? { ...upload, status: 'complete', progress: 100 }
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
    <div>
      <div className={cn('flex w-full gap-8', className)}>
        <FileSelect
          onFilesSelected={handleFileChange}
          className="w-[30%]">
          <FileSelect.Input
            accept="*/*"
            multiple
          />
          <FileSelect.DropZone
            style={{
              backgroundColor: 'var(--color-primary-700)',
              borderColor: 'var(--color-primary-600)',
              borderRadius: '4px',
              padding: '100px 40px',
            }}>
            <p className="text-white">
              Add test result zip files here
              <br />
              <span className="text-[0.8rem] text-secondary-300">
                (click or drag & drop files)
              </span>
            </p>
          </FileSelect.DropZone>
        </FileSelect>
        <div className="flex flex-grow flex-col">
          <h4 className="mb-4 text-[1rem] font-semibold">
            {fileUploads.length} Zip File(s)
          </h4>
          <ul className="flex w-full flex-col gap-2">
            {fileUploads.map((fileUpload) => (
              <li
                key={fileUpload.id}
                className="flex w-full justify-between border-b border-b-primary-800 pb-2 text-[0.8rem]">
                <div className="flex w-full flex-col gap-4 text-[0.8rem]">
                  <div className="flex w-full justify-between">
                    <span className="max-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {fileUpload.file.name}
                    </span>
                    {!isUploading && (
                      <Icon
                        name={IconName.Close}
                        svgClassName="stroke-white dark:stroke-white"
                        onClick={() => removeUpload(fileUpload.id)}
                      />
                    )}
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={cn(
                        styles.progressBar,
                        fileUpload.status === 'complete' && styles.complete,
                        fileUpload.status === 'error' && styles.error
                      )}
                      style={{ width: `${fileUpload.progress}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <Button
          variant={ButtonVariant.PRIMARY}
          size="md"
          text="Upload"
          onClick={uploadFiles}
          disabled={isUploading || fileUploads.length === 0}
        />
      </div>
    </div>
  );
}
