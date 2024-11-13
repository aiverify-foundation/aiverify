'use client';

import { FileUploader } from './multiFileUpload';
import { UploadProviders } from './providers';

export function Uploads() {
  return (
    <UploadProviders>
      <FileUploader />
    </UploadProviders>
  );
}
