import type { FileUpload } from "@/app/plugins/utils/types";

export type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

export async function uploadZipFile({
  fileUpload,
  onProgress,
}: UploadRequestPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileUpload.file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/plugins/upload'); // The API endpoint

    // Track progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    };

    // Handle success
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        reject(new Error('Upload failed'));
      }
    };

    // Handle error
    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    // Send the form data
    xhr.send(formData);
  });
}
