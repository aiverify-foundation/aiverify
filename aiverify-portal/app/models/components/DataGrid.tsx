'use client';

import React, { useState } from 'react';

interface Column {
  field: string;
  headerName: string;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataGridProps {
  rows: any[];
  columns: Column[];
  pageSizeOptions: number[];
  checkboxSelection?: boolean;
  onRowClick?: (row: any) => void;
  onSelectionModelChange?: (selectedIds: number[]) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rows,
  columns,
  pageSizeOptions,
  checkboxSelection,
  onRowClick,
  onSelectionModelChange,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string | null }>({});

  const handleCheckboxChange = (id: number) => {
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


  const handleHeaderClick = (field: string) => {
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
        value ? String(row[field]).includes(value) : true
      )
    );
  }, [sortedRows, filters]);

  const paginatedRows = filteredRows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <div className="overflow-hidden border-blue-600 rounded-lg shadow-md bg-secondary-950 mt-4">
      <table className="min-w-full table-auto">
        <thead className="bg-secondary-950 text-white">
          <tr>
            {checkboxSelection && (
              <th className="px-4 py-2 text-center "></th>
            )}
            {columns.map((col) => (
              <th
                key={col.field}
                className="px-4 py-2 cursor-pointer hover:bg-primary-600 relative"
              >
                <div
                  onClick={() => col.sortable && handleHeaderClick(col.field)}
                  className="flex justify-between items-start mt-2"
                >
                  <span>{col.headerName}</span>
                  {sortField === col.field && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
                {col.filterable && (
                  <div className="mt-2">
                    <select
                      className="w-full px-2 py-1 border rounded-lg bg-secondary-800 text-white"
                      onChange={(e) => handleFilterChange(col.field, e.target.value)}
                      value={filters[col.field] || ''}
                    >
                      <option value="">All</option>
                      {Array.from(new Set(rows.map((row) => row[col.field]))).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        )
                      )}
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
              className="cursor-pointer hover:bg-secondary-800"
              onClick={() => onRowClick?.(row)}
            >
              {checkboxSelection && (
                <td className="text-center px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => handleCheckboxChange(row.id)}
                    className="h-4 w-4"
                  />
                </td>
              )}
              {columns.map((col) => (
                <td key={col.field} className="px-4 py-3 border-b border-secondary-500 text-white">
                  {row[col.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center px-5 py-2 bg-secondary-950 mt-12 mb-2">
      <div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="ml-2 px-2 py-1 border rounded-lg bg-white text-secondary-950"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div>
          {Array.from(
            { length: Math.ceil(filteredRows.length / pageSize) },
            (_, idx) => idx
          ).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`mx-1 px-3 py-1 rounded-lg border ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              {page + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
