'use client';
import { UploadProviders } from './providers';
import { Uploader } from './uploader';

export function UploaderContainer({ className }: { className?: string }) {
  return (
    <UploadProviders>
      <Uploader className={className} />
    </UploadProviders>
  );
}
