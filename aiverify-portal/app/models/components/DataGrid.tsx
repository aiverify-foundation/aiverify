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
  }
  
  export const DataGrid: React.FC<DataGridProps> = ({
    rows,
    columns,
    pageSizeOptions,
    checkboxSelection,
    onRowClick,
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
      <div style={{ border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {checkboxSelection && <th style={{ padding: 8 }}>Select</th>}
              {columns.map((col) => (
                <th
                  key={col.field}
                  style={{
                    padding: 8,
                    cursor: col.sortable || col.filterable ? 'pointer' : 'default',
                    backgroundColor: '#000000',
                    borderBottom: '1px solid #ccc',
                    position: 'relative',
                  }}
                >
                  <div
                    onClick={() => col.sortable && handleHeaderClick(col.field)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{col.headerName}</span>
                    {sortField === col.field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                  {col.filterable && (
                    <div style={{ marginTop: 4 }}>
                      <select
                        style={{ width: '100%' }}
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
                style={{ cursor: 'pointer' }}
                onClick={() => onRowClick?.(row)}
              >
                {checkboxSelection && (
                  <td style={{ textAlign: 'center', padding: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleCheckboxChange(row.id)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.field}
                    style={{ padding: 8, borderBottom: '1px solid #eee' }}
                  >
                    {row[col.field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8 }}>
          <div>
            Page:
            {Array.from(
              { length: Math.ceil(filteredRows.length / pageSize) },
              (_, idx) => idx
            ).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  margin: '0 4px',
                  padding: 4,
                  background: page === currentPage ? '#007bff' : '#fff',
                  color: page === currentPage ? '#fff' : '#007bff',
                  border: '1px solid #007bff',
                  borderRadius: 4,
                }}
              >
                {page + 1}
              </button>
            ))}
          </div>
          <div>
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };
  