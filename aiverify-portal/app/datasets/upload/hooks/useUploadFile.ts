import { useMutation } from '@tanstack/react-query';
import { FileUpload } from '@/app/datasets/upload/types';

// Keep the original payload type as it's specific to the XMLHttpRequest implementation
type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

/**
 * Uploads a file with progress tracking using XMLHttpRequest
 */
export async function fileUploadRequest({
  fileUpload,
  onProgress,
}: UploadRequestPayload): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileUpload.file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/mock/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    xhr.send(formData);
  });
}

export function useUploadFiles({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (payload: UploadRequestPayload) => fileUploadRequest(payload),
    onSuccess,
    onError,
  });
}
