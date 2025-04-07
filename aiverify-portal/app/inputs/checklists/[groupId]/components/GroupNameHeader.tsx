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
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<'json' | 'xlsx'>('json');
  const [isDownloading, setIsDownloading] = useState(false);

  const { checklists, setChecklists, setSelectedGroup } = useChecklists();

  const editGroupMutation = useEditGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Storage key for group name in localStorage
  const storageKey = `checklist_group_name_${initialGroupName}`;

  // Initialize export hooks for both formats, but only use the selected one
  const { isExporting: isJsonExporting, handleExport: handleJsonExport } = useProcessChecklistExport(
    'json',
    initialGroupName,
    checklists
  );
  
  const { isExporting: isXlsxExporting, handleExport: handleXlsxExport } = useProcessChecklistExport(
    'xlsx',
    initialGroupName,
    checklists
  );

  // Function to handle export button click
  const handleExportClick = useCallback(() => {
    setIsExportModalVisible(true);
  }, []);

  // Function to perform the export with the selected format
  const performExport = useCallback(async () => {
    setIsDownloading(true);
    try {
      if (selectedExportFormat === 'json') {
        const jsonData = await handleJsonExport();
        if (jsonData) {
          // Create and download a JSON file
          const jsonString = JSON.stringify(jsonData, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${initialGroupName}_checklists.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        // For xlsx, the download is handled internally by the hook
        await handleXlsxExport();
      }
      setModalMessage(`Export as ${selectedExportFormat.toUpperCase()} completed successfully.`);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Export failed:', error);
      setModalMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsModalVisible(true);
    } finally {
      setIsDownloading(false);
      setIsExportModalVisible(false);
    }
  }, [selectedExportFormat, handleJsonExport, handleXlsxExport, initialGroupName]);

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
  }, []);

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
        {/* Custom download button */}
        <button
          onClick={handleExportClick}
          disabled={isDownloading || isJsonExporting || isXlsxExporting}
          className="mt-2 hover:text-primary-500"
          title="Export checklists">
          <RiDownloadLine size={20} />
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

      {/* Status/Message Modal */}
      {isModalVisible && (
        <Modal
          heading={modalMessage.includes('successfully') ? 'Success' : 'Error'}
          enableScreenOverlay={true}
          onCloseIconClick={handleModalClose}>
          <p>{modalMessage}</p>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
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

      {/* Export Format Selection Modal */}
      {isExportModalVisible && (
        <Modal
          heading="Export Checklists"
          enableScreenOverlay={true}
          onCloseIconClick={() => setIsExportModalVisible(false)}
          primaryBtnLabel="Export"
          secondaryBtnLabel="Cancel"
          onPrimaryBtnClick={performExport}
          onSecondaryBtnClick={() => setIsExportModalVisible(false)}>
          <div>
            <p className="mb-4">Choose a format to export your checklists:</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="exportExcel"
                  name="exportFormat"
                  value="xlsx"
                  checked={selectedExportFormat === 'xlsx'}
                  onChange={() => setSelectedExportFormat('xlsx')}
                  className="mr-2"
                />
                <label htmlFor="exportExcel">Excel (.xlsx)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="exportJson"
                  name="exportFormat"
                  value="json"
                  checked={selectedExportFormat === 'json'}
                  onChange={() => setSelectedExportFormat('json')}
                  className="mr-2"
                />
                <label htmlFor="exportJson">JSON (.json)</label>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GroupHeader;
