import { useMutation } from '@tanstack/react-query';
import { fileUploadRequest } from '@/app/results/upload/components/utils/fileUploadRequest';
import type { UploadRequestPayload } from '@/app/results/upload/components/utils/fileUploadRequest';

export function useUploadFiles({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (payload: UploadRequestPayload) => fileUploadRequest(payload),
    onSuccess,
    onError,
  });
}
