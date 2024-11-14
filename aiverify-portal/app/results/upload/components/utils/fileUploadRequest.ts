import type { FileUpload } from '@/app/results/upload/components/types';

export type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

export async function fileUploadRequest({
  fileUpload,
  onProgress,
}: UploadRequestPayload) {
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

type UploadResponse = {
  success: boolean;
  message?: string;
};
export async function uploadTestResult(data: {
  jsonData: object;
  files: FileUpload[];
}): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append('test_result', JSON.stringify(data.jsonData));

  data.files.forEach((fileUpload) => {
    formData.append('artifacts', fileUpload.file);
  });

  const response = await fetch('/api/test_result/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}
