import { useMutation } from '@tanstack/react-query';
import { UploadRequestPayload, uploadZipFile } from '@/app/plugins/upload/components/utils/uploadZipFile';

export function useUploadFiles({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void; // Accept the message on success
  onError: (error: Error) => void;
}) {
  const mutation = useMutation<{ message: string }, Error, UploadRequestPayload>({
    mutationFn: (payload: UploadRequestPayload) => uploadZipFile(payload),
    onSuccess: (data) => onSuccess(data.message), // Pass the message to the onSuccess callback
    onError: (error) => onError(error), // Only pass the error object
  });

  return mutation; // Return the whole mutation object
}
