'use client';

import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Icon } from '@/lib/components/IconSVG';
import { IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { cn } from '@/lib/utils/twmerge';
import { FileSelector, FileSelectorHandle } from './fileSelector';
import { JsonEditor, JsonEditorHandle } from './jsoneditor';
import { FileUpload } from './types';
import { uploadTestResult } from './utils/fileUploadRequest';

const ARTIFACTS_KEY = 'artifacts';

export function Uploader({ className }: { className?: string }) {
  const editorRef = useRef<JsonEditorHandle>(null);
  const fileSelectorRef = useRef<FileSelectorHandle>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const upload = useMutation({
    mutationFn: uploadTestResult,
    onSuccess: (data) => {
      // Handle successful upload
      console.log('Upload successful:', data);
      setShowSuccess(true);
    },
    onError: (error) => {
      // Handle error
      console.error('Upload failed:', error);
    },
  });

  function handleAddTestArtifact(files: FileUpload[]) {
    const artifactNames = files.map((file) => file.file.name);
    editorRef.current?.setValue(ARTIFACTS_KEY, artifactNames);
  }

  async function handleUpload() {
    const jsonData = editorRef.current?.getValue() ?? {};
    const files = fileSelectorRef.current?.getFiles() ?? [];

    // if (!files.length) {
    //   console.error('No files selected');
    //   return;
    // }

    try {
      await upload.mutateAsync({
        jsonData,
        files,
      });
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Upload failed:', error);
    }
  }

  return (
    <section className={cn('flex gap-4', className)}>
      <div className="flex w-[75%] flex-col justify-between">
        <JsonEditor
          className="h-[600px]"
          ref={editorRef}
        />
        <div className="flex justify-end">
          <Button
            variant={ButtonVariant.PRIMARY}
            size="md"
            text="Upload"
            className="mt-8"
            onClick={handleUpload}
          />
        </div>
      </div>
      <FileSelector
        onFilesUpdated={handleAddTestArtifact}
        className="w-[25%]"
        ref={fileSelectorRef}
      />
    </section>
  );
}
