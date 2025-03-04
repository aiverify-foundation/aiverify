import { useQuery } from '@tanstack/react-query';

interface ChecklistData {
  gid: string;
  cid: string;
  name: string;
  group: string;
  data: Record<string, string>;
  id: number;
  created_at: string;
  updated_at: string;
}

export const useChecklist = (id: string) => {
  return useQuery<ChecklistData>({
    queryKey: ['checklist', id],
    queryFn: async () => {
      const response = await fetch(`/api/input_block_data/${id}`);
      console.log('response', response);
      if (!response.ok) throw new Error('Failed to fetch checklist data');
      return response.json();
    },
  });
};
