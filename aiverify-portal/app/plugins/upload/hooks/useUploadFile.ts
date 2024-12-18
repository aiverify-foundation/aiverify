import { useState } from 'react';
import { useMutation, UseMutationResult, useMutationState } from '@tanstack/react-query';
import { UploadRequestPayload, uploadZipFile } from '../components/utils/uploadZipFile';

// Custom hook for handling the file upload
export function useUploadFiles({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) {
  const mutation = useMutation<void, Error, UploadRequestPayload>({
    mutationFn: (payload: UploadRequestPayload) => uploadZipFile(payload),
    onSuccess,
    onError,
  });

  return mutation; // Return the whole mutation object to access states like isLoading, isError, etc.
}