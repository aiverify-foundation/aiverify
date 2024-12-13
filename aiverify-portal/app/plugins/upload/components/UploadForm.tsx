'use client';

import React, { useState } from 'react';
import { useUploadFiles } from '../hooks/useUploadFile';
import type { FileUpload } from '../../utils/types';

export const UploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const { mutate, status } = useUploadFiles({
    onSuccess: () => {
      alert('File uploaded successfully!');
      setProgress(0);
    },
    onError: (error) => {
      alert(`Upload failed: ${error.message}`);
      setProgress(0);
    },
  });

  const isLoading = status === 'pending';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      const fileUpload: FileUpload = {
        file,
        progress: 0,
        status: 'uploading',
        id: `${Date.now()}-${file.name}`,
      };

      mutate({
        fileUpload,
        onProgress: setProgress,
      });
    }
  };

  return (
    <div>
      <h1>Upload Zip File</h1>
      <input type="file" accept=".zip" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={isLoading || !file}>
        {isLoading ? 'Uploading...' : 'Upload'}
      </button>
      {progress > 0 && <p>Progress: {progress.toFixed(2)}%</p>}
    </div>
  );
};
