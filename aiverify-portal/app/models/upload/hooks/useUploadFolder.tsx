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
        let errorMessage = `Failed to upload folder: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (jsonError) {
          // If JSON parsing fails, fall back to status text
          console.log('Failed to parse error response:', jsonError);
          // errorMessage is already set to the fallback above
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    },
  });
};

export default useUploadFolder;
