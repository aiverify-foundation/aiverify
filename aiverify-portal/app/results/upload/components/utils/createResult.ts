import type { FileUpload } from '@/app/results/upload/components/types';
import { FastApiError } from '@/app/types';

export async function createResult(data: {
  jsonData: object;
  files: FileUpload[];
}) {
  const formData = new FormData();

  formData.append('test_result', JSON.stringify(data.jsonData));

  data.files.forEach((fileUpload) => {
    formData.append('artifacts', fileUpload.file);
  });

  const response = await fetch('/api/test_results/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: FastApiError = await response.json();
    throw errorData;
  }

  const result: string[] = await response.json();
  return result;
}
