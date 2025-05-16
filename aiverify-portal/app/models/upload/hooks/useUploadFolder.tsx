'use client';

import { useMutation } from '@tanstack/react-query';

const useUploadFolder = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/test_models/upload_folder', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to extract error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to upload folder');
        } catch (jsonError) {
          // If JSON parsing fails, fall back to status text
          console.log('Failed to parse error response:', jsonError);
          throw new Error(`Failed to upload folder: ${response.statusText}`);
        }
      }

      return response.json();
    },
  });
};

export default useUploadFolder;
