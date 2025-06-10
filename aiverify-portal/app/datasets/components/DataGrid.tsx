'use client';

import React, { useState } from 'react';
import { Dataset } from '@/app/types';
import { cn } from '@/lib/utils/twmerge';

interface Column {
  field: keyof Dataset;
  headerName: string;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (row: Dataset) => React.ReactNode;
}

interface DataGridProps {
  rows: Dataset[];
  highlightRow?: Dataset;
  columns: Column[];
  pageSizeOptions: (number | 'All')[];
  checkboxSelection?: boolean;
  onRowClick?: (row: Dataset) => void;
  onSelectionModelChange?: (selectedIds: string[]) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rows,
  columns,
  highlightRow,
  pageSizeOptions,
  checkboxSelection,
  onRowClick,
  onSelectionModelChange,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<number | 'All'>(
    pageSizeOptions.find((option) => typeof option === 'number') || 5
  );
  const [sortField, setSortField] = useState<keyof Dataset | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null
  );
  const [filters, setFilters] = useState<{ [K in keyof Dataset]?: string }>(
    {}
  );

  const handleCheckboxChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Prevent the row click event when checkbox is clicked
    e.stopPropagation();

    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);

    // Trigger the callback when selection changes
    if (onSelectionModelChange) {
      onSelectionModelChange(Array.from(newSelectedRows));
    }
  };

  const handleHeaderClick = (field: keyof Dataset) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : null);
      if (!sortDirection) setSortField(null);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value || null,
    }));
  };

  const sortedRows = React.useMemo(() => {
    if (!sortField || !sortDirection) return rows;
    return [...rows].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined)
        return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined)
        return sortDirection === 'asc' ? 1 : -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDirection]);

  const filteredRows = React.useMemo(() => {
    return sortedRows.filter((row) =>
      Object.entries(filters).every(([field, value]) =>
        value ? String(row[field as keyof Dataset]).includes(value) : true
      )
    );
  }, [sortedRows, filters]);

  const paginatedRows =
    typeof pageSize === 'string' && pageSize === 'All'
      ? filteredRows // If 'All' is selected, show all rows without pagination
      : filteredRows.slice(
          currentPage * Number(pageSize),
          (currentPage + 1) * Number(pageSize)
        );

  const pageSizeOptionsWithAll = [
    ...pageSizeOptions.filter((option) => option !== 'All'),
    'All',
  ];

  const getRowId = (row: Dataset): string => String(row.id);

  return (
    <div className="relative h-full overflow-hidden rounded-lg border-secondary-300 bg-secondary-950 shadow-md">
      <div className="h-full overflow-y-auto pb-16">
        <table className="w-full table-auto">
          <thead className="bg-secondary-950 text-white sticky top-0 z-10">
            <tr>
              {checkboxSelection && <th className="px-4 py-2 text-center" />}
              {columns.map((col) => (
                <th
                  key={String(col.field)}
                  className="relative cursor-pointer px-4 py-2 hover:bg-primary-600">
                  <div
                    onClick={() => col.sortable && handleHeaderClick(col.field)}
                    className="mt-2 flex w-full items-start justify-between">
                    <span>{col.headerName}</span>
                    {sortField === col.field &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  {col.filterable && (
                    <div className="mt-2">
                      <select
                        className="w-full rounded-lg border bg-secondary-800 px-2 py-1 text-white"
                        onChange={(e) =>
                          handleFilterChange(String(col.field), e.target.value)
                        }
                        value={String(filters[col.field] || '')}>
                        <option value="">All</option>
                        {Array.from(
                          new Set(
                            rows.map((row) => {
                              const value = row[col.field];
                              return value !== null && value !== undefined
                                ? String(value)
                                : '';
                            })
                          )
                        ).map((value) => (
                          <option
                            key={value}
                            value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'hover:bg-secondary-800',
                  highlightRow?.id === row.id ? 'bg-secondary-600' : ''
                )}
                onClick={() => onRowClick?.(row)}>
                {checkboxSelection && (
                  <td
                    className="px-4 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(getRowId(row))}
                      onChange={(e) => handleCheckboxChange(getRowId(row), e)}
                      className="h-5 w-5 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={String(col.field)}
                    className="border-b border-secondary-500 px-4 py-3 text-white">
                    {col.renderCell ? (
                      col.renderCell(row)
                    ) : (
                      <span>
                        {row[col.field] !== null && row[col.field] !== undefined
                          ? String(row[col.field])
                          : ''}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-secondary-950 px-5 py-2 border-t border-secondary-700">
        <div>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              const selectedValue = e.target.value;
              setPageSize(
                selectedValue === 'All' ? 'All' : Number(selectedValue)
              );
              setCurrentPage(0); // Reset to the first page whenever the page size changes
            }}
            className="ml-2 rounded-lg border bg-white px-2 py-1 text-secondary-950">
            {pageSizeOptionsWithAll.map((size) => (
              <option
                key={String(size)}
                value={String(size)}>
                {size === 'All' ? 'All' : size}
              </option>
            ))}
          </select>
        </div>
        {pageSize !== 'All' && (
          <div>
            {Array.from(
              { length: Math.ceil(filteredRows.length / Number(pageSize)) },
              (_, idx) => idx
            ).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`mx-1 rounded-lg border px-3 py-1 ${
                  page === currentPage
                    ? 'bg-primary-600 text-secondary-950'
                    : 'bg-secondary-900 text-white'
                }`}>
                {page + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Export types for compatibility
export type { Column };
