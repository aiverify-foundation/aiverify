'use client';
import { useState, useEffect, useCallback } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { useEditGroup } from '../hooks/useEditGroupName';
import { useDeleteGroup } from '../hooks/useDeleteGroup';
import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import { Modal } from '@/lib/components/modal';
import { useRouter } from 'next/navigation';
import { fetchConfigFiles } from '../hooks/fetchConfigFiles'; // Import fetchConfigFiles
import { exportToExcel } from '../utils/exportToExcel'; // Import exportToExcel

interface GroupHeaderProps {
  groupName: string;
}

// Define interfaces for our worksheet data types
interface ChecklistMetadata {
  'Checklist ID': string;
  Name: string;
  'Created At': string;
  'Updated At': string;
  Status: string;
}

interface ChecklistResponse {
  'Question ID': string;
  Response: string;
}

type WorksheetDataType = ChecklistMetadata | ChecklistResponse;

const GroupHeader = ({ groupName: initialGroupName }: GroupHeaderProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [configFiles, setConfigFiles] = useState<Record<string, string>>({});

  const { checklists, setChecklists, setSelectedGroup } = useChecklists();

  const editGroupMutation = useEditGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Retrieve the group name from localStorage when the component mounts
  useEffect(() => {
    const storedGroupName = localStorage.getItem('groupName');
    if (storedGroupName) {
      setGroupName(storedGroupName);
    }
  }, []);

  // Store the group name in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('groupName', groupName);
  }, [groupName]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = useCallback(() => {
    deleteGroupMutation.mutate({ groupName, checklists });
    setIsDeleteModalVisible(false);
    setSelectedGroup('');
    setChecklists(
      checklists.filter((checklist) => checklist.group !== groupName)
    );
    localStorage.removeItem('groupName'); // Remove the group name from localStorage when deleted
    router.push('/inputs/checklists');
  }, [
    deleteGroupMutation,
    groupName,
    checklists,
    setSelectedGroup,
    setChecklists,
    router,
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

  // Export to Excel function
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadConfigFiles = async () => {
      const files = await fetchConfigFiles();
      setConfigFiles(files);
    };

    loadConfigFiles();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch the config files
      const configFiles = await fetchConfigFiles();

      // Export the checklists to Excel with config file details
      await exportToExcel(groupName, checklists, configFiles);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    router.refresh();
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
        <h1 className="text-3xl font-bold">{groupName}</h1>
      )}

      <div className="flex justify-between gap-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="hover:text-primary-500">
          <Icon
            name={IconName.WideArrowDown}
            color="#FFFFFF"
          />
        </button>
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
