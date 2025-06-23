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

const DatasetList: React.FC<DatasetListProps> = ({ datasets, className }) => {
  const [filteredDatasets, setFilteredDatasets] = useState(datasets);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(undefined);
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
      renderCell: (row: Dataset) => new Date(row.updated_at + 'Z').toLocaleString('en-GB'),
    },
  ];

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
    [fuse, datasets]
  );

  const handleSelectDataset = (dataset: Dataset) => {
    if (selectedDataset?.id === dataset.id) {
      setSelectedDataset(undefined);
    } else {
      setSelectedDataset(dataset);
    }
  };

  const handleDelete = () => {
    if (selectedRows.size === 0) return;
    setModalMessage('Are you sure you want to delete the selected dataset(s)?');
    setIsConfirmation(true);
    setIsModalVisible(true);
  };

  const confirmDelete = async () => {
    setIsConfirmation(false);
    setLoading(true);

    startTransition(async () => {
      try {
        const ids = Array.from(selectedRows);
        const deleteResults = await Promise.all(
          ids.map(async (id) => {
            try {
              const result = await deleteDataset(id);
              return result;
            } catch (error) {
              return { success: false, message: error instanceof Error ? error.message : 'Failed to delete dataset' };
            }
          })
        );

        const failedDeletions = deleteResults.filter((result) => !result.success);

        if (failedDeletions.length > 0) {
          // Show the specific error message from the API
          const errorMessage = failedDeletions[0].message || 'Failed to delete some datasets.';
          setModalMessage(errorMessage);
          setLoading(false);
        } else {
          setTimeout(() => {
            const updatedDatasets = filteredDatasets.filter(
              (dataset) => !ids.includes(dataset.id)
            );
            setFilteredDatasets(updatedDatasets);
            setModalMessage('Datasets deleted successfully!');
            setSelectedDataset(undefined);
            setSelectedRows(new Set());
            setLoading(false);
            router.refresh();
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to delete datasets:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete the datasets.';
        setModalMessage(errorMessage);
        setLoading(false);
      }
    });
  };

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
      onSecondaryBtnClick={isConfirmation ? () => setIsModalVisible(false) : undefined}>
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

  const renderDataGrid = () => (
    <DataGrid
      columns={columns}
      rows={filteredDatasets}
      pageSizeOptions={[5, 10, 20, 50, 'All']}
      checkboxSelection
      onRowClick={handleSelectDataset}
      highlightRow={selectedDataset}
      onSelectionModelChange={(selection) =>
        setSelectedRows(new Set(selection.map(String)))
      }
    />
  );

  const renderDatasetDetail = () => {
    if (!selectedDataset) return null;

    return (
      <div className="flex min-w-[40%] flex-col rounded-lg bg-secondary-950 px-6 py-4 shadow-md">
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
              {new Date(selectedDataset.created_at + 'Z').toLocaleString('en-GB')}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-secondary-400">Last Updated:</span>
            <span>
              {new Date(selectedDataset.updated_at + 'Z').toLocaleString('en-GB')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {renderModal()}
        </div>
      )}

      <div className="flex w-full items-center justify-between">
        <Filters onSearchInputChange={handleSearchInputChange} />
        <div className="flex justify-end">
          <Icon
            name={IconName.Delete}
            size={30}
            color="white"
            onClick={handleDelete}
            disabled={selectedRows.size === 0 || isPending}
          />
        </div>
      </div>

      <div className="flex flex-grow gap-4">
        <div className="h-[500px] flex-grow overflow-y-auto">
          {loading ? renderLoading('400px') : renderDataGrid()}
        </div>
        {loading ? renderLoading('300px') : renderDatasetDetail()}
      </div>
    </section>
  );
};

export { DatasetList };
