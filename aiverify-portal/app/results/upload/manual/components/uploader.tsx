'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useRef, useState } from 'react';
import { FileUpload } from '@/app/results/upload/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { debounce } from '@/lib/utils/debounce';
import { cn } from '@/lib/utils/twmerge';
import { FileSelector, FileSelectorHandle } from './fileSelector';
import { useCreateResult } from './hooks/useCreateResult';
import { JsonEditorHandle } from './jsoneditor';

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
  const [successData, setSuccessData] = useState<string[] | undefined>(
    undefined
  );
  const [errorData, setErrorData] = useState<string | undefined>(undefined);
  const [disableUpload, setDisableUpload] = useState(true);
  const { mutate, status, data, error } = useCreateResult();

  useEffect(() => {
    if (status === 'success') {
      setSuccessData(data);
      return;
    }

    if (status === 'error' && error) {
      setErrorData(error.detail);
    }
  }, [status, data]);

  function handleAddTestArtifact(files: FileUpload[]) {
    const artifactNames = files.map((file) => file.file.name);
    editorRef.current?.setValue(ARTIFACTS_KEY, artifactNames);
  }

  function handleUploadClick() {
    const jsonData = editorRef.current?.getValue() ?? {};
    const files = fileSelectorRef.current?.getFiles() ?? [];
    mutate({ jsonData, files });
  }

  function resetUploader() {
    editorRef.current?.clear();
    fileSelectorRef.current?.clearFiles();
    setSuccessData(undefined);
    setErrorData(undefined);
  }

  const debouncedHandleEditorChange = debounce(() => {
    setDisableUpload(false);
  }, 200);

  const debouncedHandleSyntaxError = debounce((error: string) => {
    console.log(error);
    setDisableUpload(true);
  }, 200);

  return (
    <React.Fragment>
      {successData ? (
        <Modal
          heading="Test Result Uploaded"
          primaryBtnLabel="OK"
          secondaryBtnLabel="Upload Another"
          enableScreenOverlay
          onPrimaryBtnClick={() => setSuccessData(undefined)}
          onSecondaryBtnClick={() => {
            resetUploader();
          }}
          onCloseIconClick={() => {
            setSuccessData(undefined);
          }}>
          <p>Your test result has been uploaded successfully.</p>
          <ul className="ml-8 list-inside list-disc">
            {data &&
              data.map((item) => (
                <li key={item}>
                  <Link
                    key={item}
                    href={item}>
                    {item}
                  </Link>
                </li>
              ))}
          </ul>
        </Modal>
      ) : null}
      {errorData ? (
        <Modal
          heading="Test Result Upload Failed"
          primaryBtnLabel="OK"
          enableScreenOverlay
          onPrimaryBtnClick={() => setErrorData(undefined)}
          onCloseIconClick={() => setErrorData(undefined)}>
          <div className="mb-5 flex items-center gap-2">
            <Icon
              name={IconName.Alert}
              size={30}
              svgClassName="stroke-red-500 dark:stroke-red-500"
            />
            There was an error uploading your test result.
          </div>
          <ul className="ml-8 list-inside list-disc">
            <li>{errorData}</li>
          </ul>
        </Modal>
      ) : null}
      <section className={cn('flex gap-4', className)}>
        <div className="flex w-full flex-col justify-between">
          <div className="flex gap-4">
            <JsonEditor
              className="h-[550px] flex-1"
              onChange={debouncedHandleEditorChange}
              onSyntaxError={debouncedHandleSyntaxError}
              ref={editorRef}
            />
            <FileSelector
              onFilesUpdated={handleAddTestArtifact}
              className="w-[400px]"
              ref={fileSelectorRef}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant={ButtonVariant.PRIMARY}
              size="md"
              text="Upload"
              onClick={handleUploadClick}
              disabled={disableUpload}
            />
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}
