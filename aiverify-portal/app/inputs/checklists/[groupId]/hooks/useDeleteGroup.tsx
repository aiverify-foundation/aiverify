import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Checklist } from '@/app/inputs/utils/types';

interface DeleteGroupNameParams {
  groupName: string;
  checklists: Checklist[];
}

export const useDeleteGroup = () => {
  return useMutation({
    mutationFn: async ({ groupName, checklists }: DeleteGroupNameParams) => {
      // Get all checklists for this group
      const checklistsToDelete = checklists.filter(
        (checklist) => checklist.group === groupName
      );

      // Delete each checklist in the group
      const deletePromises = checklistsToDelete.map((checklist) =>
        fetch(`/api/input_block_data/${checklist.id}`, {
          method: 'DELETE',
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to delete checklist ${checklist.id}`);
          }
        })
      );

      // Wait for all deletions to complete
      try {
        await Promise.all(deletePromises);
      } catch (error) {
        throw new Error('Failed to delete one or more checklists in the group');
      }
    },
    onSuccess: () => {},
  });
};
