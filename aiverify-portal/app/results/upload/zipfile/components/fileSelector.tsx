'use client';

import React, { useImperativeHandle, useState } from 'react';
import { FileUpload } from '@/app/results/upload/manual/components/types';
import { uploadZipFile } from '@/app/results/upload/zipfile/utils/uploadZipFile';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { ButtonVariant } from '@/lib/components/button';
import { Button } from '@/lib/components/button';
import { FileSelect } from '@/lib/components/fileSelect';
import { cn } from '@/lib/utils/twmerge';
import { flushSync } from 'react-dom';
export interface FileSelectorHandle {
  getFiles: () => FileUpload[];
  clearFiles: () => void;
}

type FileSelectorProps = {
  ref: React.ForwardedRef<FileSelectorHandle>;
  className?: string;
  onFilesUpdated?: (files: FileUpload[]) => void;
};

type UploaderState = 'new' | 'uploading' | 'completed' | 'completedWithErrors';

export function FileSelector({
  ref,
  className,
  onFilesUpdated,
}: FileSelectorProps) {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [uploaderState, setUploaderState] = useState<UploaderState>('new');

  useImperativeHandle(ref, () => ({
    getFiles: () => fileUploads,
    clearFiles: () => setFileUploads([]),
  }));

  function handleFileChange(files: File[]) {
    let uniqueFiles: File[] = files;
    if (uploaderState == 'new') {
      // Check for duplicates by comparing file names
      const existingFileNames = new Set(
        fileUploads.map((upload) => upload.file.name)
      );
      uniqueFiles = files.filter((file) => !existingFileNames.has(file.name));

      if (uniqueFiles.length === 0) {
        // All files were duplicates
        return;
      }
    }

    // Continue with unique files only
    files = uniqueFiles;
    const filesToUpload = Array.from(files);
    const newUploads: FileUpload[] = filesToUpload.map((file) => ({
      file,
      progress: 0,
      status: 'idle',
      id: Math.random().toString(36).substring(2, 9),
    }));
    if (
      uploaderState == 'completed' ||
      uploaderState == 'completedWithErrors'
    ) {
      setFileUploads(newUploads);
    } else {
      setFileUploads((prevUploads) => {
        const updatedUploads = [...prevUploads, ...newUploads];
        onFilesUpdated?.(updatedUploads);
        return updatedUploads;
      });
    }
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
    setUploaderState('uploading');

    const uploadPromises = fileUploads.map((fileUpload) => {
      setFileUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload.id === fileUpload.id
            ? { ...upload, status: 'uploading' }
            : upload
        )
      );

      return uploadZipFile({
        fileUpload,
        onProgress: (progress) => {
          setFileUploads((prevUploads) => {
            const updatedUploads = prevUploads.map((upload) =>
              upload.id === fileUpload.id
                ? {
                    ...upload,
                    progress,
                    status: progress === 100 ? 'complete' : upload.status,
                  }
                : upload
            );
            return updatedUploads;
          });
        },
      });
    });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploaderState('completedWithErrors');
    } finally {
      setUploaderState('completed');
    }
  };

  function handleUploadMoreClick() {
    setUploaderState('new');
    setFileUploads([]);
  }

  return (
    <div>
      <div className={cn('flex w-full gap-8', className)}>
        <FileSelect
          disabled={uploaderState !== 'new'}
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
              Add test result zip files
              <br />
              <span className="text-[0.8rem] text-secondary-300">
                (click or drag & drop files here)
              </span>
            </p>
          </FileSelect.DropZone>
        </FileSelect>
        <div className="flex w-[50%] flex-col">
          <h4 className="mb-6 text-[1rem] font-semibold">
            {fileUploads.length} Zip File(s)
          </h4>
          <ul className="flex w-full flex-col gap-2">
            {fileUploads.map((fileUpload) => {
              let statusDisplay = '';
              if (fileUpload.status === 'complete') {
                statusDisplay = 'Uploaded';
              } else if (fileUpload.status === 'uploading') {
                statusDisplay = 'Uploading';
              } else if (fileUpload.status === 'error') {
                statusDisplay = 'Error';
              }
              return (
                <li
                  key={fileUpload.id}
                  className="mb-3 flex w-full">
                  <div className="flex w-full flex-col gap-2 text-[0.8rem]">
                    <div className="flex w-full justify-between">
                      <div className="flex items-center gap-2">
                        {fileUpload.status === 'idle' ? (
                          <Icon
                            name={IconName.Close}
                            svgClassName="stroke-gray-500 dark:stroke-gray-500"
                            onClick={() => removeUpload(fileUpload.id)}
                          />
                        ) : null}
                        <span className="max-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {fileUpload.file.name}
                        </span>
                      </div>
                      <span className="text-white">{statusDisplay}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-sm bg-transparent">
                      <div
                        className={cn(
                          'h-full w-full bg-blue-500 transition-[width] duration-300 ease-in-out',
                          fileUpload.status === 'error' && 'bg-danger'
                        )}
                        style={{ width: `${fileUpload.progress}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex justify-end">
            {uploaderState === 'new' && fileUploads.length > 0 ? (
              <Button
                variant={ButtonVariant.PRIMARY}
                size="md"
                text="Upload"
                onClick={uploadFiles}
                disabled={uploaderState !== 'new'}
              />
            ) : null}
            {uploaderState === 'completed' ||
            uploaderState === 'completedWithErrors' ? (
              <Button
                variant={ButtonVariant.PRIMARY}
                size="md"
                text="Upload More"
                onClick={handleUploadMoreClick}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
