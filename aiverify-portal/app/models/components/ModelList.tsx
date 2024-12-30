'use client';

import React, { useState, useMemo, act } from 'react';
import { TestModel } from '@/app/models/utils/types';
import { DataGrid } from './DataGrid';
import ModelsFilters from './FilterButtons';
import Fuse from 'fuse.js';
import { useDeleteModel } from '../hooks/useDeleteModel';
import { Modal } from '@/lib/components/modal';
import { Icon, IconName } from '@/lib/components/IconSVG';
    
type Props = {
    models: TestModel[];
};

const ModelList: React.FC<Props> = ({ models }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('');
    const [results, setResults] = useState<TestModel[]>(models);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isConfirmation, setIsConfirmation] = useState(true);

    const columns = [
    { field: "fileType", headerName: "Type", sortable: false },
    { field: "name", headerName: "Name", sortable: true },
    { field: "modelType", headerName: "Model Type", sortable: true },
    { field: "created_at", headerName: "Created At", sortable: true },
    ];

    const fuse = useMemo(() => {
        const options = {
          keys: [
            'name',
          ],
          includeScore: true,
          threshold: 0.7, // lower threshold = more accurate
        };
        return new Fuse(models, options);
      }, [results]);

    const handleRowClick = (row: any) => {
    console.log('Row clicked:', row);
    };

    const handleSearch = (query: string) => setSearchQuery(query);
    const handleFilter = (filter: string) => setActiveFilter(filter);

    const filteredModels = useMemo(() => {
        // no search query, return all the results
        let searchModels = searchQuery
          ? fuse.search(searchQuery).map(model => model.item)
          : results;
      
        // if filtering selected
        if (activeFilter) {
          searchModels = searchModels.filter(model => 
            model.fileType === activeFilter.toLowerCase() ||
            model.mode === activeFilter.toLowerCase()
          );
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
        try {
          const ids = Array.from(selectedRows);
          await Promise.all(ids.map((id) => deleteModelMutation.mutateAsync(id)));
          setModalMessage('Models deleted successfully!');
          setSelectedRows(new Set()); // Clear selection after successful deletion
        } catch (error) {
          console.error('Failed to delete models:', error);
          setModalMessage('Failed to delete the models.');
        }
      };

    return (
    <div>
        {/* Modal for confirmation and result */}
        {isModalVisible && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
            <Modal
                bgColor="var(--color-primary-500)"
                textColor="white"
                onCloseIconClick={() => setIsModalVisible(false)}
                enableScreenOverlay
                heading={isConfirmation ? 'Confirm Deletion' : 'Result'}
                height={200}
                primaryBtnLabel={isConfirmation ? 'DELETE' : undefined}
                secondaryBtnLabel={isConfirmation ? 'CANCEL' : undefined}
                onPrimaryBtnClick={isConfirmation ? confirmDelete : undefined}
                onSecondaryBtnClick={isConfirmation ? () => setIsModalVisible(false): undefined}
            >
                <p>{modalMessage}</p>
            </Modal>
            </div>
        )}

        {/* Search and filter section */}
        <div className='mt-6'>
            <ModelsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            activeFilter={activeFilter}
            />
        </div>

        {/* Delete button */}
        <div className="flex justify-end items-center mb-4">
            <Icon
            name={IconName.Delete}
            size={30}
            color="white"
            onClick={handleDelete}
            disabled={selectedRows.size === 0}

            />
        </div>

        {/* Data Grid */}
        <div className='mt-2'>
            <DataGrid
            rows={filteredModels}
            columns={columns}
            pageSizeOptions={[5, 10, 15, 20]}
            checkboxSelection
            onSelectionModelChange={(selection) =>
            setSelectedRows(new Set(selection.map(Number)))
          }
        />
        </div>
    </div>
    );
};

export default ModelList;
