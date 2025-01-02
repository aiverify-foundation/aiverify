'use client';

import { useMutation } from '@tanstack/react-query';

const useUploadFile = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
        // Check the contents of the FormData object (by logging its entries)
        for (let pair of formData.entries()) {
            console.log("hook paired: ",pair[0], pair[1]); // Log each entry
        }
        const response = await fetch('/api/test_models/upload', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
        return response.json();
        },
  });
};

export default useUploadFile;
