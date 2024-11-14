'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils/twmerge';
import { JsonEditor, JsonEditorHandle } from './jsoneditor';
import { FileUploader } from './multiFileUpload';
import { UploadProviders } from './providers';
import { FileUpload } from './types';

const ARTIFACTS_KEY = 'artifacts';

export function Uploads({ className }: { className?: string }) {
  const editorRef = useRef<JsonEditorHandle>(null);

  function handleAddTestArtifact(files: FileUpload[]) {
    const artifactNames = files.map((file) => file.file.name);
    editorRef.current?.setValue(ARTIFACTS_KEY, artifactNames);
  }

  return (
    <UploadProviders>
      <section className={cn('flex gap-4', className)}>
        <JsonEditor
          className="h-[600px] w-[75%]"
          ref={editorRef}
        />
        <FileUploader
          onFilesUpdated={handleAddTestArtifact}
          className="w-[25%]"
        />
      </section>
    </UploadProviders>
  );
}
