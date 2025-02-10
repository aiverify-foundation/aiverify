import { ErrorWithMessage, PythonFastApiErrorDetail } from '@/app/errorTypes';
import type { FileUpload } from '@/app/results/upload/types';
import { parseFastAPIError } from '@/lib/utils/parseFastAPIError';

export type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

export async function uploadZipFile({
  fileUpload,
  onProgress,
}: UploadRequestPayload) {
  return new Promise<string | ErrorWithMessage>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileUpload.file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/test_results/upload_zip');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        console.log('percentComplete', percentComplete);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const result: string = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        const result: PythonFastApiErrorDetail = JSON.parse(xhr.responseText);
        reject(parseFastAPIError(result));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    xhr.send(formData);
  });
}
