import { useQuery } from '@tanstack/react-query';

const fetchModelData = async (
  id: string
): Promise<{ blob: Blob; filename: string }> => {
  const response = await fetch(`/api/test_models/download/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
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
