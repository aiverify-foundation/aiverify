'use client';

import Fuse from 'fuse.js';
import React, { useState, useMemo } from 'react';
import ModelDetail from '@/app/models/components/ModelDetail';
import SplitPane from '@/app/models/components/SplitPane';
import { useDeleteModel } from '@/app/models/hooks/useDeleteModel';
import { TestModel } from '@/app/models/utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';
import { DataGrid } from './DataGrid';
import ModelsFilters from './FilterButtons';

type Props = {
  models: TestModel[];
};

const ModelList: React.FC<Props> = ({ models }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [results, setResults] = useState<TestModel[]>(models);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isConfirmation, setIsConfirmation] = useState(true);
  const [loading, setLoading] = useState(false); // for loading animation
  const [selectedModel, setSelectedModel] = useState<TestModel | null>(null);

  const getTypeLabel = (fileType?: string, mode?: string) => {
    if (!fileType) {
      return mode === 'api' ? 'Model API' : mode;
    }
    switch (fileType) {
      case 'file':
        return 'Model';
      case 'folder':
        return 'Model';
      case 'pipeline':
        return 'Pipeline';
      default:
        return fileType;
    }
  };

  const columns: {
    field: keyof TestModel;
    headerName: string;
    sortable?: boolean;
    renderCell?: (row: TestModel) => React.ReactNode;
  }[] = [
    { field: 'name', headerName: 'Name', sortable: true },
    { field: 'modelType', headerName: 'Model Type', sortable: true },
    {
      field: 'fileType',
      headerName: 'Type',
      renderCell: (row: TestModel) => getTypeLabel(row.fileType, row.mode), // Use row instead of model
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      sortable: true,
      renderCell: (row: TestModel) =>
        new Date(row.updated_at).toLocaleString('en-GB'),
    },
  ];

  const fuse = useMemo(() => {
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.7, // lower threshold = more accurate
    };
    return new Fuse(models, options);
  }, [results]);

  const handleSelectModel = (model: TestModel) => {
    if (selectedModel?.id === model.id) {
      setSelectedModel(null);
    } else {
      setSelectedModel(model);
    }
  };

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filter: string) => setActiveFilter(filter);

  const filteredModels = useMemo(() => {
    // no search query, return all the results
    let searchModels = searchQuery
      ? fuse.search(searchQuery).map((model) => model.item)
      : results;

    // if filtering selected
    if (activeFilter) {
      if (activeFilter === 'model') {
        // If 'MODEL' is selected, filter for both 'file' and 'folder'
        searchModels = searchModels.filter(
          (model) => model.fileType === 'file' || model.fileType === 'folder'
        );
      } else {
        // Otherwise, filter by active filter
        searchModels = searchModels.filter(
          (model) =>
            model.fileType === activeFilter.toLowerCase() ||
            model.mode === activeFilter.toLowerCase()
        );
      }
    }

    return searchModels;
  }, [searchQuery, activeFilter, fuse, results]);

  const deleteModelMutation = useDeleteModel();

  const handleDelete = () => {
    if (selectedRows.size === 0) return;
    setModalMessage('Are you sure you want to delete the selected model(s)?');
    setIsConfirmation(true);
    setIsModalVisible(true);
  };

  const confirmDelete = async () => {
    setIsConfirmation(false); // Switch modal to result message mode
    setLoading(true); // Start loading state
    try {
      const ids = Array.from(selectedRows);
      const deleteResults = await Promise.all(
        ids.map((id) => deleteModelMutation.mutateAsync(id))
      );

      // Check if any deletion failed
      const failedDeletions = deleteResults.filter((result) => !result.success);

      if (failedDeletions.length > 0) {
        // Show the first error message if there are failures
        setModalMessage(
          failedDeletions[0].message || 'Failed to delete some models.'
        );
        setLoading(false);
      } else {
        setTimeout(() => {
          const updatedResults = results.filter(
            (model) => !ids.includes(String(model.id))
          );
          setResults(updatedResults); // Update the data with deleted models removed
          setModalMessage('Models deleted successfully!');
          setSelectedModel(null); // Deactivate the split pane view
          setSelectedRows(new Set()); // Clear selection after successful deletion
          setLoading(false); // End loading state
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to delete models:', error);
      setModalMessage(
        error instanceof Error ? error.message : 'Failed to delete the models.'
      );
      setLoading(false);
    }
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
      onSecondaryBtnClick={
        isConfirmation ? () => setIsModalVisible(false) : undefined
      }>
      <p>{modalMessage}</p>
    </Modal>
  );

  const renderDataGrid = () => (
    <DataGrid
      rows={filteredModels}
      columns={columns}
      pageSizeOptions={[5, 10, 15, 20, 'All']}
      checkboxSelection
      onRowClick={handleSelectModel}
      onSelectionModelChange={(selection) =>
        setSelectedRows(new Set(selection.map(String)))
      }
    />
  );

  const renderLoading = (height: string) => (
    <div
      className="flex w-full items-center justify-center rounded-lg bg-secondary-950 p-4"
      style={{ height }}>
      <div className="spinner-border inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );

  return selectedModel ? (
    <div>
      {/* Modal for confirmation and result */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {renderModal()}
        </div>
      )}

      {/* Search and filter section */}
      <div className="mt-6">
        <ModelsFilters
          onSearch={handleSearch}
          onFilter={handleFilter}
          activeFilter={activeFilter}
        />
      </div>

      {/* Delete button */}
      <div className="mb-4 flex items-center justify-end">
        <Icon
          name={IconName.Delete}
          size={30}
          color="white"
          onClick={handleDelete}
          disabled={selectedRows.size === 0}
        />
      </div>

      {/* split pane */}
      <SplitPane
        leftPane={
          <div>{loading ? renderLoading('400px') : renderDataGrid()}</div>
        }
        rightPane={
          loading ? (
            renderLoading('300px')
          ) : (
            <ModelDetail model={selectedModel} />
          )
        }
      />
    </div>
  ) : (
    <div>
      {/* Modal for confirmation and result */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {renderModal()}
        </div>
      )}

      {/* Search and filter section */}
      <div className="mt-6">
        <ModelsFilters
          onSearch={handleSearch}
          onFilter={handleFilter}
          activeFilter={activeFilter}
        />
      </div>

      {/* Delete button */}
      <div className="mb-4 flex items-center justify-end">
        <Icon
          name={IconName.Delete}
          size={30}
          color="white"
          onClick={handleDelete}
          disabled={selectedRows.size === 0}
        />
      </div>

      {/* Data Grid or Loading Rectangle */}
      <div className="mt-2 w-full">
        {loading ? renderLoading('400px') : renderDataGrid()}
      </div>
    </div>
  );
};

export default ModelList;
