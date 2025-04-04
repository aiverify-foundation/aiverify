'use client';
import { RiDownloadLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useDeleteGroup } from '@/app/inputs/checklists/[groupId]/hooks/useDeleteGroup';
import { useEditGroup } from '@/app/inputs/checklists/[groupId]/hooks/useEditGroupName';
import { useProcessChecklistExport } from '@/app/inputs/checklists/[groupId]/hooks/useProcessChecklistExport';
import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';

interface GroupHeaderProps {
  groupName: string;
}

const GroupHeader = ({ groupName: initialGroupName }: GroupHeaderProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { checklists, setChecklists, setSelectedGroup } = useChecklists();

  const editGroupMutation = useEditGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Storage key for group name in localStorage
  const storageKey = `checklist_group_name_${initialGroupName}`;

  // Get export functionality using the new hook
  const { ExportButton } = useProcessChecklistExport(
    initialGroupName,
    checklists
  );

  // Update local state when initialGroupName changes
  useEffect(() => {
    if (groupName !== initialGroupName) {
      // Only store if it's different from initial
      localStorage.setItem(storageKey, groupName);
    }
  }, [groupName, storageKey, initialGroupName]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalVisible(true);
  };

  // Update the delete handler to remove the correct storage key
  const handleDeleteConfirm = useCallback(() => {
    console.log('Deleting group:', groupName);
    deleteGroupMutation.mutate({ groupName, checklists });
    setIsDeleteModalVisible(false);
    setSelectedGroup('');
    setChecklists(
      checklists.filter((checklist) => checklist.group !== groupName)
    );
    localStorage.removeItem(storageKey); // Remove the specific group name
  }, [
    deleteGroupMutation,
    groupName,
    checklists,
    setSelectedGroup,
    setChecklists,
    router,
    storageKey,
  ]);

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      editGroupMutation.mutate({
        groupName: initialGroupName,
        newGroupName: groupName,
        checklists,
      });
    },
    [editGroupMutation, initialGroupName, groupName, checklists]
  );

  const handleCancel = () => {
    setGroupName(initialGroupName);
    setIsEditing(false);
  };

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    router.push('/inputs/checklists');
  }, [router]);

  useEffect(() => {
    if (editGroupMutation.isSuccess && isSaving) {
      setModalMessage('Group Name Changed successfully');
      setIsSaving(false);
      setIsEditing(false);
      setIsModalVisible(true);
      setSelectedGroup(groupName);
      setChecklists(
        checklists.map((checklist) =>
          checklist.group === initialGroupName
            ? { ...checklist, group: groupName }
            : checklist
        )
      );
    } else if (editGroupMutation.isError && isSaving) {
      setModalMessage('Failed to update group name. Please try again.');
      setIsSaving(false);
      setIsEditing(false);
      setIsModalVisible(true);
    }
  }, [
    editGroupMutation.isSuccess,
    editGroupMutation.isError,
    isSaving,
    groupName,
    initialGroupName,
    setSelectedGroup,
    setChecklists,
    checklists,
  ]);

  useEffect(() => {
    if (deleteGroupMutation.isSuccess) {
      setModalMessage('Group deleted successfully.');
      setIsModalVisible(true);
    } else if (deleteGroupMutation.isError) {
      setModalMessage('Failed to delete the group. Please try again.');
      setIsModalVisible(true);
    }
  }, [deleteGroupMutation.isSuccess, deleteGroupMutation.isError]);

  return (
    <div className="ml-6 mr-6 mt-6 flex justify-between">
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="bg-secondary-900 px-2 text-3xl font-bold"
            autoFocus
            maxLength={128}
          />
          <button
            type="submit"
            className="text-white hover:text-primary-500"
            disabled={editGroupMutation.isPending || isSaving}>
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-white hover:text-primary-500">
            Cancel
          </button>
        </form>
      ) : (
        <h1 className="text-3xl font-bold">{initialGroupName}</h1>
      )}

      <div className="flex justify-between gap-2">
        {/* Render the ExportButton component when available, otherwise render a fallback */}
        <div
          data-export-button="true"
          className="mt-2">
          {ExportButton || (
            <button
              disabled={true}
              className="opacity-50">
              <Icon
                name={IconName.WideArrowDown}
                color="#FFFFFF"
                size={24}
              />
            </button>
          )}
        </div>
        <button
          onClick={handleEditClick}
          disabled={isEditing || editGroupMutation.isPending}
          className="hover:text-primary-500">
          <Icon
            name={IconName.Pencil}
            color="#FFFFFF"
          />
        </button>
        <button
          onClick={handleDeleteClick}
          disabled={deleteGroupMutation.isPending}
          className="hover:text-primary-500">
          <Icon
            name={IconName.Delete}
            color="#FFFFFF"
          />
        </button>
      </div>

      {isModalVisible && (
        <Modal
          heading={modalMessage.includes('successfully') ? 'Success' : 'Error'}
          enableScreenOverlay={true}
          onCloseIconClick={handleModalClose}>
          <p>{modalMessage}</p>
        </Modal>
      )}

      {isDeleteModalVisible && (
        <Modal
          heading="Confirm Deletion"
          enableScreenOverlay={true}
          onCloseIconClick={handleDeleteCancel}
          primaryBtnLabel="Confirm"
          secondaryBtnLabel="Cancel"
          onPrimaryBtnClick={handleDeleteConfirm}
          onSecondaryBtnClick={handleDeleteCancel}>
          <p>
            Are you sure you want to delete this group and all its checklists?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default GroupHeader;
