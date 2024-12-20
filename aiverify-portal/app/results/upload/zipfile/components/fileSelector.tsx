'use client';

import React, { useImperativeHandle, useState } from 'react';
import { FileUpload } from '@/app/results/upload/types';
import { uploadZipFile } from '@/app/results/upload/zipfile/utils/uploadZipFile';
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

      return uploadZipFile({
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
                text="Upload"
                onClick={uploadFiles}
                disabled={uploaderState !== 'new'}
              />
            ) : null}
            {uploaderState === 'completedWithErrors' ? (
              <Button
                variant={ButtonVariant.SECONDARY}
                size="md"
                text="View Errors"
                onClick={handleViewErrorsClick}
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
