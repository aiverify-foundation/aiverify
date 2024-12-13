import { useMutation } from '@tanstack/react-query';
import { UploadRequestPayload, uploadZipFile } from '../components/utils/uploadZipFile';


export function useUploadFiles({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (payload: UploadRequestPayload) => uploadZipFile(payload),
    onSuccess,
    onError,
  });
}