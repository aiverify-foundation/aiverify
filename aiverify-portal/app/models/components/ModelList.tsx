'use client';

import React from 'react';
import { TestModel } from '@/app/models/utils/types';
import { DataGrid } from './DataGrid';
    
type Props = {
    models: TestModel[];
};

const ModelList: React.FC<Props> = ({ models }) => {
    const columns = [
    { field: "id", headerName: "ID", sortable: true },
    { field: "name", headerName: "Name", sortable: true },
    { field: "fileType", headerName: "Type", sortable: false },
    { field: "status", headerName: "Status", sortable: true },
    { field: "modelType", headerName: "Model Type", sortable: true },
    { field: "created_at", headerName: "Created At", sortable: true },
    ];

    const handleRowClick = (row: any) => {
    console.log('Row clicked:', row);
    };

    return (
    <div style={{ padding: 16 }}>
        <DataGrid
        rows={models}
        columns={columns}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        onRowClick={handleRowClick}
        />
    </div>
    );
};

export default ModelList;
