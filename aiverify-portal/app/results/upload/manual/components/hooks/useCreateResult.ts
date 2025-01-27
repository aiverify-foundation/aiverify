import { useMutation } from '@tanstack/react-query';
import { FileUpload } from '@/app/results/upload/manual/components/types';
import { createResult } from '@/app/results/upload/manual/components/utils/createResult';
import { FastApiError } from '@/app/types';

type Payload = {
  jsonData: object;
  files: FileUpload[];
};

export function useCreateResult() {
  return useMutation<string[], FastApiError, Payload>({
    mutationFn: (payload: Payload) => createResult(payload),
  });
}
