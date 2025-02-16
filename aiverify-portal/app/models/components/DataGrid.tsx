'use client';

import React, { useState } from 'react';
import { TestModel } from '@/app/models/utils/types';

interface Column {
  field: keyof TestModel; // The field should correspond to a key of TestModel
  headerName: string;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (row: TestModel) => React.ReactNode; // renderCell is a function that takes a TestModel and returns a React node
}

interface DataGridProps {
  rows: TestModel[]; // rows is an array of TestModel
  columns: Column[]; // columns is an array of Column objects
  pageSizeOptions: (number | 'All')[];
  checkboxSelection?: boolean;
  onRowClick?: (row: TestModel) => void;
  onSelectionModelChange?: (selectedIds: string[]) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rows,
  columns,
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
  const [sortField, setSortField] = useState<keyof TestModel | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null
  );
  const [filters, setFilters] = useState<{ [K in keyof TestModel]?: string }>(
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

  const handleHeaderClick = (field: keyof TestModel) => {
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
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDirection]);

  const filteredRows = React.useMemo(() => {
    return sortedRows.filter((row) =>
      Object.entries(filters).every(([field, value]) =>
        value ? String(row[field as keyof TestModel]).includes(value) : true
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

  const getRowId = (row: TestModel): string => String(row.id);

  return (
    <div className="overflow-hidden rounded-lg border-secondary-300 bg-secondary-950 shadow-md">
      <table className="w-full table-auto">
        <thead className="bg-secondary-950 text-white">
          <tr>
            {checkboxSelection && <th className="px-4 py-2 text-center" />}
            {columns.map((col) => (
              <th
                key={col.field}
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
                        handleFilterChange(col.field, e.target.value)
                      }
                      value={String(filters[col.field] || '')} // Ensure it's a string
                    >
                      <option value="">All</option>
                      {Array.from(
                        new Set(rows.map((row) => row[col.field]))
                      ).map((value) => (
                        <option
                          key={String(value)}
                          value={String(value)}>
                          {String(value)}
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
              className="hover:bg-secondary-800"
              onClick={() => onRowClick?.(row)}>
              {checkboxSelection && (
                <td
                  className="px-4 py-2 text-center"
                  onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(getRowId(row))}
                    onChange={(e) => handleCheckboxChange(getRowId(row), e)}
                    className="h-12 w-12 cursor-pointer"
                  />
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.field}
                  className="border-b border-secondary-500 px-4 py-3 text-white">
                  {col.renderCell ? (
                    col.renderCell(row)
                  ) : (
                    <span>{String(row[col.field])}</span> // Make sure it's a valid React node
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mb-2 mt-12 flex items-center justify-between bg-secondary-950 px-5 py-2">
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
