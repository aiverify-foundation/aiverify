import { useQuery } from '@tanstack/react-query';
import { toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse } from '@/lib/utils/http-requests';

const fetchModelData = async (
  id: string
): Promise<{ blob: Blob; filename: string }> => {
  const response = await fetch(`/api/test_models/download/${id}`);
  const result = await processResponse<Response>(response);

  if (result instanceof Error) {
    throw toErrorWithMessage(result);
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  if (!contentDisposition || !contentDisposition.includes('attachment')) {
    throw new Error('Expected attachment but did not receive one.');
  }

  const filenameMatch = contentDisposition.match(/filename="(.+)"/);
  if (!filenameMatch || !filenameMatch[1]) {
    throw new Error(
      'Filename could not be extracted from content-disposition.'
    );
  }

  const blob = await response.blob();
  return { blob, filename: filenameMatch[1] };
};

export const useModelData = (id: string) => {
  return useQuery({
    queryKey: ['model', id],
    queryFn: () => fetchModelData(id),
    enabled: !!id,
  });
};
