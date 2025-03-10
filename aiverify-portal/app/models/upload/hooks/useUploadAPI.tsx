'use client';

import { useMutation } from '@tanstack/react-query';

const useUploadAPI = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/test_models/modelapi', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload Model API');
      }
      return response.json();
    },
  });
};

export default useUploadAPI;
