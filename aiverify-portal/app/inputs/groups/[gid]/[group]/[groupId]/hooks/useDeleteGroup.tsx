import { useMutation } from '@tanstack/react-query';
import { Checklist } from '@/app/inputs/utils/types';

interface DeleteGroupNameParams {
  // groupName: string;
  groupId: number;
  // checklists: Checklist[];
}

export const useDeleteGroup = () => {
  return useMutation({
    mutationFn: async ({ groupId }: DeleteGroupNameParams) => {
      // Get all checklists for this group
      // const checklistsToDelete = checklists.filter(
      //   (checklist) => checklist.group === groupName
      // );
      // Delete each checklist in the group
      // const deletePromises = checklistsToDelete.map((checklist) =>
      //   fetch(`/api/input_block_data/${checklist.id}`, {
      //     method: 'DELETE',
      //   }).then((response) => {
      //     if (!response.ok) {
      //       throw new Error(`Failed to delete checklist ${checklist.id}`);
      //     }
      //   })
      // );
      // // Wait for all deletions to complete
      // try {
      //   await Promise.all(deletePromises);
      // } catch (error) {
      //   console.log(error);
      //   throw new Error('Failed to delete one or more checklists in the group');
      // }

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
