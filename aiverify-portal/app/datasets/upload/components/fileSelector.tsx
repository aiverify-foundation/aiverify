'use client';

import Link from 'next/link';
import React, { useImperativeHandle, useState } from 'react';
import { FileUpload } from '@/app/datasets/upload/types';
import { uploadDatasetFile } from '@/app/datasets/upload/utils/uploadDatasetFile';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { ButtonVariant } from '@/lib/components/button';
import { Button } from '@/lib/components/button';
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

type UploaderState = 'new' | 'uploading' | 'completed' | 'completedWithErrors';

export function FileSelector({
  ref,
  className,
  onFilesUpdated,
}: FileSelectorProps) {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [uploaderState, setUploaderState] = useState<UploaderState>('new');
  const [showErrors, setShowErrors] = useState(false);

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

      return uploadDatasetFile({
        fileUpload,
        onProgress: (progress) => {
          setFileUploads((prevUploads) => {
            const updatedUploads = prevUploads.map((upload) =>
              upload.id === fileUpload.id
                ? {
                    ...upload,
                    progress,
                  }
                : upload
            );
            return updatedUploads;
          });
        },
      });
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
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
      if (hasErrors) {
        setUploaderState('completedWithErrors');
      } else {
        setUploaderState('completed');
      }
    } catch (error) {
      console.log('Unexpected error uploading files:', error);
      setUploaderState('completedWithErrors');
    }
  };

  function handleUploadMoreClick() {
    setUploaderState('new');
    setFileUploads([]);
  }

  function handleViewErrorsClick() {
    setShowErrors((prev) => !prev);
  }

  return (
    <div>
      <div className={cn('flex w-full flex-col gap-8', className)}>
        <FileSelect
          disabled={uploaderState !== 'new'}
          onFilesSelected={handleFileChange}
          className="w-full">
          <FileSelect.Input
            accept="*/*"
            multiple
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <h3>Before uploading...</h3>
              <p className="mb-6 text-[0.9rem] text-secondary-300">
                Check that the dataset file meets the following requirments.
              </p>
              <div className="rounded-md border border-secondary-400 p-4 text-[0.8rem]">
                <ul className="list-none">
                  <li>
                    File Size:{' '}
                    <span className="text-secondary-300">Less than 4GB</span>
                  </li>
                  <li>
                    Data Format:{' '}
                    <span className="text-secondary-300">
                      Pandas, Delimiter-separated Values (comma, tab, semicolon,
                      pipe, space, colon), Image(jpeg, jpg, png)
                    </span>
                  </li>
                  <li>
                    Serialiser Type:{' '}
                    <span className="text-secondary-300">Pickle, Joblib</span>
                  </li>
                </ul>
              </div>
            </div>
            <FileSelect.DropZone className="flex h-[200px] flex-1 items-center justify-center rounded-md border-primary-500 bg-secondary-700">
              <p className="text-[0.9rem] text-white">
                Drag & drop or &nbsp;
                <span className="text-[0.9rem] text-purple-400">
                  Click to Browse
                </span>
                <br />
                <span className="text-[0.8rem] text-secondary-300">
                  Maximum 10 files per upload
                </span>
              </p>
            </FileSelect.DropZone>
          </div>
        </FileSelect>
        <div className="flex w-full flex-col">
          <h4 className="mb-1 text-[1rem] font-semibold">Selected Files</h4>
          <ul className="flex w-full flex-col gap-2 rounded-md border border-secondary-400 p-4 pb-0 pt-5">
            {fileUploads.map((fileUpload) => {
              let statusDisplay = '';
              if (fileUpload.status === 'success') {
                statusDisplay = 'Uploaded';
              } else if (fileUpload.status === 'uploading') {
                statusDisplay = 'Uploading';
              } else if (fileUpload.status === 'error') {
                statusDisplay = 'Error';
              }
              return (
                <li
                  key={fileUpload.id}
                  className="mb-5 flex w-full">
                  <div className="flex w-full flex-col text-[0.8rem]">
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
                          {fileUpload.file.name} <br />{' '}
                          {Math.round(fileUpload.file.size / 1024)} KB
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-white',
                          fileUpload.status === 'error' && 'text-red-500'
                        )}>
                        {statusDisplay}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-sm bg-transparent">
                      <div
                        className={cn(
                          'h-full w-full transition-[width] duration-300 ease-in-out',
                          fileUpload.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        )}
                        style={{ width: `${fileUpload.progress}%` }}
                      />
                    </div>
                    {showErrors && fileUpload.status === 'error' ? (
                      <div className="w-full text-right text-red-500">
                        {fileUpload.error?.message}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex justify-end gap-2">
            {uploaderState === 'new' && fileUploads.length > 0 ? (
              <Button
                variant={ButtonVariant.PRIMARY}
                size="md"
                text="Upload Selected Files"
                onClick={uploadFiles}
                disabled={uploaderState !== 'new'}
                pill
              />
            ) : null}
            {uploaderState === 'completedWithErrors' ? (
              <Button
                variant={ButtonVariant.SECONDARY}
                size="md"
                text="View Errors"
                onClick={handleViewErrorsClick}
                pill
              />
            ) : null}
            {uploaderState === 'completed' ||
            uploaderState === 'completedWithErrors' ? (
              <Button
                variant={ButtonVariant.PRIMARY}
                size="md"
                text="Upload More"
                onClick={handleUploadMoreClick}
                pill
              />
            ) : null}
            <Link href="/datasets">
              <Button
                variant={ButtonVariant.PRIMARY}
                size="md"
                text="View Datasets"
                pill
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
