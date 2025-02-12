'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils/twmerge';
import { FileSelector, FileSelectorHandle } from './fileSelector';

export function DatasetUploader({ className }: { className?: string }) {
  const fileSelectorRef = useRef<FileSelectorHandle>(null);
  return (
    <FileSelector
      onFilesUpdated={() => null}
      className={cn('w-full', className)}
      ref={fileSelectorRef}
    />
  );
}
