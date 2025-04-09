'use client';

import { useMutation } from '@tanstack/react-query';

/**
 * Hook for uploading dataset folders to the API
 */
const useUploadFolder = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        console.log('Sending request to /api/test_datasets/upload_folder');
        const response = await fetch('/api/test_datasets/upload_folder', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          // Try to extract error message from response
          try {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(
              errorData.detail || 'Failed to upload dataset folder'
            );
          } catch (jsonError) {
            // If JSON parsing fails, fall back to status text
            console.error('Failed to parse error response:', jsonError);
            throw new Error(
              `Failed to upload dataset folder: ${response.statusText}`
            );
          }
        }

        const data = await response.json();
        console.log('Upload folder success response:', data);
        return data;
      } catch (error) {
        console.error('Error uploading dataset folder:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(
          'An unknown error occurred while uploading the dataset folder'
        );
      }
    },
  });
};

export default useUploadFolder;
