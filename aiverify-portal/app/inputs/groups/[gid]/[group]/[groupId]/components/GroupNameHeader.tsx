'use client';
import { RiDownloadLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';
import { useDeleteGroup } from '../../[groupId]/hooks/useDeleteGroup';
import {
  useProcessChecklistExport,
  Checklist,
  EXPORT_PROCESS_CHECKLISTS_CID,
} from '../hooks/useProcessChecklistExport';
import { useMDXSummaryBundle } from '../hooks/useMDXSummaryBundle';

interface GroupHeaderProps {
  groupName: string;
  updateGroupName: (newName: string) => void;
}

const GroupHeader = ({
  groupName: initialGroupName,
  updateGroupName,
}: GroupHeaderProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [, setIsSaving] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<
    'json' | 'xlsx'
  >('json');
  const [isDownloading, setIsDownloading] = useState(false);
  const [] = useState<Record<string, string>>({});

  // const { checklists, setChecklists, setSelectedGroup } = useChecklists();
  const { groupId, group, currentGroupData, gid } = useInputBlockGroupData();
  
  // Dynamically check if the plugin has export functionality
  // by checking if the export process checklists MDX bundle exists
  const { data: exportBundle } = useMDXSummaryBundle(gid, EXPORT_PROCESS_CHECKLISTS_CID);
  const hasExportFunction = !!exportBundle?.code;
  
  const checklists: Checklist[] = currentGroupData
    ? currentGroupData.input_blocks.map(
        (x) =>
          ({
            cid: x.cid,
            name: x.name,
            group: group,
            data: x.data,
          }) as Checklist
      )
    : [];

  // const editGroupMutation = useEditGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Initialize export hooks for both formats, but only use the selected one
  const { isExporting: isJsonExporting, handleExport: handleJsonExport } =
    useProcessChecklistExport('json', initialGroupName, checklists, gid);

  const { isExporting: isXlsxExporting, handleExport: handleXlsxExport } =
    useProcessChecklistExport('xlsx', initialGroupName, checklists, gid);

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
      setModalMessage(
        `Export as ${selectedExportFormat.toUpperCase()} completed successfully.`
      );
      setIsModalVisible(true);
    } catch (error) {
      console.error('Export failed:', error);
      setModalMessage(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsModalVisible(true);
    } finally {
      setIsDownloading(false);
      setIsExportModalVisible(false);
    }
  }, [
    selectedExportFormat,
    handleJsonExport,
    handleXlsxExport,
    initialGroupName,
  ]);

  // Update local state when initialGroupName changes
  useEffect(() => {
    setGroupName(currentGroupData ? currentGroupData.name : '');
  }, [currentGroupData]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalVisible(true);
  };

  // Update the delete handler to remove the correct storage key
  const handleDeleteConfirm = useCallback(() => {
    if (groupId) {
      console.log('Deleting group:', groupName);
      deleteGroupMutation.mutate({ groupId });
      setIsDeleteModalVisible(false);
    }
  }, [
    deleteGroupMutation,
    groupName,
    router,
    groupId,
  ]);

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  const handleCancel = () => {
    setGroupName(initialGroupName);
    setIsEditing(false);
  };

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    // Navigate back if deletion was successful
    if (deleteGroupMutation.isSuccess) {
      router.back();
    }
  }, [deleteGroupMutation.isSuccess, router]);

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
          id="edit-name-form"
          onSubmit={(e) => {
            e.preventDefault();
            console.log('onSubmit:', groupName);
            setIsSaving(true);
            // Call updateGroupName immediately without any debouncing
            updateGroupName(groupName);
            setIsEditing(false);
          }}
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
            className="text-white hover:text-primary-500">
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
        {/* Export button - show for any plugin with export functionality */}
        {hasExportFunction && (
          <button
            onClick={handleExportClick}
            disabled={isDownloading || isJsonExporting || isXlsxExporting}
            className="mt-2 hover:text-primary-500"
            title="Export checklists">
            <RiDownloadLine size={20} />
          </button>
        )}
        <button
          onClick={handleEditClick}
          // disabled={isEditing || editGroupMutation.isPending}
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
