import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Checklist } from '@/app/inputs/utils/types';

interface UpdateGroupNameParams {
  groupName: string;
  newGroupName: string;
  checklists: Checklist[];
}

export const useEditGroup = (onSuccess?: () => void) => {
  return useMutation({
    mutationFn: async ({
      groupName,
      newGroupName,
      checklists,
    }: UpdateGroupNameParams) => {
      const checklistsToUpdate = checklists.filter(
        (checklist) => checklist.group === groupName
      );

      const updatePromises = checklistsToUpdate.map((checklist) => {
        return fetch(`/api/input_block_data/${checklist.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: checklist.name,
            group: newGroupName,
            data: checklist.data,
          }),
        }).then((response) => {
          if (!response.ok) {
            console.log('response', response);
            throw new Error(
              `Failed to update group name for checklist ID ${checklist.id}`
            );
          }
        });
      });

      await Promise.all(updatePromises);
    },
    onSuccess: () => {},
    onError: (error) => {
      console.error('Error updating group name:', error);
    },
  });
};
