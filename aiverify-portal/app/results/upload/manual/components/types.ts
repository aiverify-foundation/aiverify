export type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export type FileUpload = {
  file: File;
  progress: number;
  status: UploadStatus;
  id: string;
};
