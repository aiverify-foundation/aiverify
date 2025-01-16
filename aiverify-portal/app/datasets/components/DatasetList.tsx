'use client';

import Fuse from 'fuse.js';
import React, { useMemo, useState } from 'react';
import { Dataset } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { debounce } from '@/lib/utils/debounce';
import { Column, DataGrid } from './DataGrid';
import { Filters } from './Filters';
import { cn } from '@/lib/utils/twmerge';

type DatasetListProps = {
  datasets: Dataset[];
  className?: string;
};

const columns: Column<Dataset>[] = [
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
  { field: 'name', headerName: 'Name' },
  { field: 'numRows', headerName: 'Rows' },
  { field: 'numCols', headerName: 'Columns' },
  { field: 'updated_at', headerName: 'Date' },
];

function DatasetList({ datasets, className }: DatasetListProps) {
  const [filteredDatasets, setFilteredDatasets] = useState(datasets);

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

  const dataGrid = (
    <DataGrid<Dataset>
      columns={columns}
      rows={filteredDatasets}
      pageSizeOptions={[10, 25, 50, 100]}
      onRowClick={(row) => {
        console.log(row);
      }}
    />
  );

  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <Filters onSearchInputChange={handleSearchInputChange} />
      {dataGrid}
    </section>
  );
}

export { DatasetList };
