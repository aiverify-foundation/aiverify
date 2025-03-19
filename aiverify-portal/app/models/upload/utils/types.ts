type UploadStatus = 'idle' | 'pending' | 'success' | 'error';

type FileUpload = {
    file: File;
    progress: number;
    status: UploadStatus;
    id: string;
  };

export type { FileUpload, UploadStatus };

