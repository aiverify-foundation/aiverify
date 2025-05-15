import { useMutation } from '@tanstack/react-query';

interface DeleteGroupNameParams {
  // groupName: string;
  groupId: number;
  // checklists: Checklist[];
}

export const useDeleteGroup = () => {
  return useMutation({
    mutationFn: async ({ groupId }: DeleteGroupNameParams) => {
      fetch(`/api/input_block_data/groups/${groupId}`, {
        method: 'DELETE',
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete input block group ${groupId}`);
        }
      });
    },
  });
};
