import { useMutation } from '@tanstack/react-query';
import {
  UploadRequestPayload,
  uploadJsonFile,
} from '@/app/templates/upload/components/utils/uploadJsonFile';

export function useUploadFiles({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void;
  onError: (error: Error) => void;
}) {
  const mutation = useMutation<
    { message: string },
    Error,
    UploadRequestPayload
  >({
    mutationFn: (payload: UploadRequestPayload) => uploadJsonFile(payload),
    onSuccess: (data) => onSuccess(data.message),
    onError: (error) => onError(error),
  });

  return mutation;
}
