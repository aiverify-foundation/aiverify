import { useMutation } from '@tanstack/react-query';
import { PythonFastApiErrorDetail } from '@/app/errorTypes';
import { createResult } from '@/app/results/upload/manual/components/utils/createResult';
import { FileUpload } from '@/app/results/upload/types';

type Payload = {
  jsonData: object;
  files: FileUpload[];
};

export function useCreateResult() {
  return useMutation<string[], PythonFastApiErrorDetail, Payload>({
    mutationFn: (payload: Payload) => createResult(payload),
  });
}
