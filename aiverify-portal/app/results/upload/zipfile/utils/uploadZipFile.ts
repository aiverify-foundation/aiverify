import type { FileUpload } from '@/app/results/upload/manual/components/types';

export type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

export async function uploadZipFile({
  fileUpload,
  onProgress,
}: UploadRequestPayload) {
  return new Promise<void>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileUpload.file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/test_results/upload_zip');

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
