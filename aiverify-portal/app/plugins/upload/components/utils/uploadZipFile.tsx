import type { FileUpload } from '@/app/plugins/utils/types';

export type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

export async function uploadZipFile({
  fileUpload,
  onProgress,
}: UploadRequestPayload): Promise<{ message: string }> {
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
        try {
          console.log('Status 200: Successful upload');
          console.log('Response:', xhr.responseText);
          console.log('type: ', xhr.getResponseHeader('Content-Type'));
          // Check if the response is JSON before attempting to parse
          if (
            xhr.getResponseHeader('Content-Type')?.includes('application/json')
          ) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(
              new Error('Expected JSON response, but received something else')
            );
          }
        } catch (err) {
          console.error('Error during JSON parsing:', err);
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        // Error handling for non-200 status codes...
        if (xhr.status === 413) {
          const errorMessage =
            'Body exceeded 1 MB limit. To configure the body size limit for Server Actions, see: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit';
          reject(errorMessage); // Function to display error in modal
        } else if (xhr.status >= 500 && xhr.status < 600) {
          const errorMessage = `Server error (${xhr.status}): ${xhr.statusText || 'An unexpected error occurred.'}`;
          reject(errorMessage); // Show the modal with error message for other 500-range errors
        } else {
          reject(`Unexpected error: ${xhr.statusText}`);
        }
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
