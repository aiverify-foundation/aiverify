'use client';

import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { Dataset } from '@/app/types';
import { deleteDataset } from '@/lib/actions/deleteDataset';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';
import { debounce } from '@/lib/utils/debounce';
import { cn } from '@/lib/utils/twmerge';
import { Column, DataGrid } from './DataGrid';
import { Filters } from './Filters';

type DatasetListProps = {
  datasets: Dataset[];
  className?: string;
};

const columns: Column[] = [
  {
    field: 'fileType' as keyof Dataset,
    headerName: 'Type',
    renderCell: (row: Dataset) => (
      <Icon
        name={row.fileType === 'file' ? IconName.File : IconName.Folder}
        size={20}
        svgClassName="stroke-white"
      />
    ),
  },
  { field: 'name', headerName: 'Name', sortable: true },
  { field: 'numRows', headerName: 'Rows', sortable: true },
  { field: 'numCols', headerName: 'Columns', sortable: true },
  {
    field: 'updated_at',
    headerName: 'Date',
    sortable: true,
    renderCell: (row: Dataset) => new Date(row.updated_at + "Z").toLocaleString(),
  },
];

function DatasetList({ datasets, className }: DatasetListProps) {
  const [filteredDatasets, setFilteredDatasets] = useState(datasets);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isConfirmation, setIsConfirmation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setFilteredDatasets(datasets);
  }, [datasets]);

  const handleDelete = () => {
    if (selectedRows.size === 0) return;
    setModalMessage('Are you sure you want to delete the selected dataset(s)?');
    setIsConfirmation(true);
    setIsModalVisible(true);
  };

  const confirmDelete = async () => {
    setIsConfirmation(false); // Switch modal to result message mode
    setLoading(true); // Start loading state
    
    startTransition(async () => {
      try {
        const ids = Array.from(selectedRows);
        const deleteResults = await Promise.all(
          ids.map(async (id) => {
            const result = await deleteDataset(id);
            return result;
          })
        );

        // Check if any deletion failed
        const failedDeletions = deleteResults.filter((result) => !result.success);

        if (failedDeletions.length > 0) {
          // Show the first error message if there are failures
          setModalMessage(
            failedDeletions[0].message || 'Failed to delete some datasets.'
          );
          setLoading(false);
        } else {
          setTimeout(() => {
            setModalMessage('Datasets deleted successfully!');
            setSelectedDataset(undefined); // Clear selected dataset
            setSelectedRows(new Set()); // Clear selection after successful deletion
            setLoading(false); // End loading state
            router.refresh(); // Refresh the page to update the dataset list
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to delete datasets:', error);
        setModalMessage(
          error instanceof Error ? error.message : 'Failed to delete the datasets.'
        );
        setLoading(false);
      }
    });
  };

  const fuse = useMemo(() => {
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.7,
    };
    return new Fuse(datasets, options);
  }, [datasets]);

  const handleSearchInputChange = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length === 0) {
          setFilteredDatasets(datasets);
          return;
        }
        const result = fuse.search(value);
        setFilteredDatasets(result.map((r) => r.item));
      }, 300),
    [fuse, setFilteredDatasets]
  );

  function handleRowClick(dataset: Dataset) {
    setSelectedDataset(dataset);
  }

  const renderModal = () => (
    <Modal
      bgColor="var(--color-primary-500)"
      textColor="white"
      onCloseIconClick={
        isConfirmation
          ? () => setIsModalVisible(false)
          : () => {
              setIsModalVisible(false);
              if (modalMessage.includes('deleted successfully')) {
                setLoading(false);
              }
            }
      }
      enableScreenOverlay
      heading={isConfirmation ? 'Confirm Deletion' : 'Deletion Status'}
      height={200}
      primaryBtnLabel={isConfirmation ? 'DELETE' : undefined}
      secondaryBtnLabel={isConfirmation ? 'CANCEL' : undefined}
      onPrimaryBtnClick={isConfirmation ? confirmDelete : undefined}
      onSecondaryBtnClick={
        isConfirmation ? () => setIsModalVisible(false) : undefined
      }>
      <p>{modalMessage}</p>
    </Modal>
  );

  const renderLoading = (height: string) => (
    <div
      className="flex w-full items-center justify-center rounded-lg bg-secondary-950 p-4"
      style={{ height }}>
      <div className="spinner-border inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );

  const dataGrid = (
    <DataGrid
      columns={columns}
      rows={filteredDatasets}
      pageSizeOptions={[10, 25, 50, 100, 'All']}
      checkboxSelection
      onRowClick={handleRowClick}
      onSelectionModelChange={(selection) =>
        setSelectedRows(new Set(selection.map(String)))
      }
      highlightRow={selectedDataset}
    />
  );

  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {/* Modal for confirmation and result */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {renderModal()}
        </div>
      )}

      <div className="flex w-full items-center justify-between">
        <Filters onSearchInputChange={handleSearchInputChange} />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={selectedRows.size === 0 || isPending}
            className="hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon
              name={IconName.Delete}
              size={30}
              color="#FFFFFF"
            />
          </button>
        </div>
      </div>
      <div className="flex flex-grow gap-4">
        <div className="h-[500px] flex-grow overflow-y-auto">
          {loading ? renderLoading('500px') : dataGrid}
        </div>
        {selectedDataset && (
          <div className="flex min-w-[40%] flex-col rounded-lg bg-secondary-950 px-6 py-4 shadow-md">
            {loading ? (
              renderLoading('300px')
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="flex gap-3">
                  <span className="text-secondary-400">File Type:</span>
                  <span>{selectedDataset.fileType}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">File Name:</span>
                  <span>{selectedDataset.filename}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Size:</span>
                  <span>{selectedDataset.size} bytes</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Data Format:</span>
                  <span>{selectedDataset.dataFormat || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Rows:</span>
                  <span>{selectedDataset.numRows || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Columns:</span>
                  <span>{selectedDataset.numCols || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Status:</span>
                  <span>{selectedDataset.status}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Created:</span>
                  <span>
                    {new Date(selectedDataset.created_at + "Z").toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary-400">Last Updated:</span>
                  <span>
                    {new Date(selectedDataset.updated_at + "Z").toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export { DatasetList };
