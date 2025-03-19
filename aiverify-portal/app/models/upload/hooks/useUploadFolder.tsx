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
        throw new Error('Failed to upload folder');
      }
      return response.json();
    },
  });
};

export default useUploadFolder;
