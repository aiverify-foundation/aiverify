'use client';

import { useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';
import { useRef, useState } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { debounce } from '@/lib/utils/debounce';
import { cn } from '@/lib/utils/twmerge';
import { FileSelector, FileSelectorHandle } from './fileSelector';
import { JsonEditorHandle } from './jsoneditor';
import { FileUpload } from './types';
import { uploadTestResult } from './utils/testResultUploadRequest';

const JsonEditor = dynamic(
  () => import('./jsoneditor').then((mod) => mod.JsonEditor),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

const ARTIFACTS_KEY = 'artifacts';

export function Uploader({ className }: { className?: string }) {
  const editorRef = useRef<JsonEditorHandle>(null);
  const fileSelectorRef = useRef<FileSelectorHandle>(null);
  const [successData, setSuccessData] = useState<string[] | null>(null);
  const [disableUpload, setDisableUpload] = useState(true);
  const upload = useMutation({
    mutationFn: uploadTestResult,
    onSuccess: (result) => {
      setSuccessData(result.data ?? null);
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

    try {
      await upload.mutateAsync({
        jsonData,
        files,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }

  const debouncedHandleEditorChange = debounce(() => {
    setDisableUpload(false);
  }, 200);

  const debouncedHandleSyntaxError = debounce((error: string) => {
    console.log(error);
    setDisableUpload(true);
  }, 200);

  function isJsonValid(value: string) {
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  return (
    <React.Fragment>
      {successData ? (
        <Modal
          heading="Test Result Uploaded"
          primaryBtnLabel="OK"
          enableScreenOverlay
          onPrimaryBtnClick={() => setSuccessData(null)}
          onCloseIconClick={() => setSuccessData(null)}>
          <p>Your test result has been uploaded successfully.</p>
          <p>
            {successData.map((item) => (
              <Link
                key={item}
                href={item}>
                {item}
              </Link>
            ))}
          </p>
        </Modal>
      ) : null}
      <section className={cn('flex gap-4', className)}>
        <div className="flex w-[75%] flex-col justify-between">
          <JsonEditor
            className="h-[600px]"
            onChange={debouncedHandleEditorChange}
            onSyntaxError={debouncedHandleSyntaxError}
            ref={editorRef}
          />
          <div className="flex justify-end">
            <Button
              variant={ButtonVariant.PRIMARY}
              size="md"
              text="Upload"
              className="mt-8"
              onClick={handleUpload}
              disabled={disableUpload}
            />
          </div>
        </div>
        <FileSelector
          onFilesUpdated={handleAddTestArtifact}
          className="w-[25%]"
          ref={fileSelectorRef}
        />
      </section>
    </React.Fragment>
  );
}
