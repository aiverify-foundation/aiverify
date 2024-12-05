'use client';

import { useState } from 'react';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { TextInput } from '@/lib/components/textInput';
import Dropdown from './DropdownMenu';

type FilterProps = {
  onSearch: (value: string) => void;
  onFilter: (filter: string) => void;
  onSort: (sortBy: string) => void;
  activeFilter: string;
  isSplitPaneActive: boolean;
};

export default function PluginsFilters({
  onSearch,
  onFilter,
  onSort,
  activeFilter,
  isSplitPaneActive
}: FilterProps) {

  const filterOptions = [
    { id: '', name: 'Select' },
  ];

  const sortOptions = [
    { id: 'date-asc', name: 'Installed Date (oldest to newest)' },
    { id: 'date-desc', name: 'Installed Date (newest to oldest)' },
    { id: 'name', name: 'Name (A-Z)' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return isSplitPaneActive ? (
    // Vertical layout for split pane active
    <section className="flex flex-col space-y-4">
      {/* Filter and Sort */}
      <div className="flex items-start space-x-3">
        {/* Filter Dropdown */}
        <div>
          <h4 className="text-left">Filter By</h4>
          <Dropdown
            id="filter-dropdown"
            title="Select"
            data={filterOptions}
            selectedId={activeFilter}
            onSelect={(id) => onFilter(id)}
          />
        </div>

        {/* Sort Dropdown */}
        <div>
          <h4 className="text-left">Sort By</h4>
          <Dropdown
            id="sort-dropdown"
            data={sortOptions}
            onSelect={(sortBy) => onSort(sortBy)}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <div></div>
        <div className="relative flex items-center" style={{ width: '100%' }}>
          <TextInput
            placeholder="Search Test Results"
            inputStyles={{ paddingLeft: 40, height: '40px' }}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {/* Magnify Glass Icon */}
          <Icon
            name={IconName.MagnifyGlass}
            size={20}
            style={{
              position: 'absolute',
              top: '40%',
              left: 10,
              transform: 'translateY(-50%)',
            }}
            svgClassName="fill-secondary-800 dark:fill-secondary-800"
          />
          {/* Clear Search Icon */}
          {searchQuery && (
            <Icon
              name={IconName.Close}
              size={20}
              style={{
                position: 'absolute',
                top: '40%',
                right: 10,
                transform: 'translateY(-50%)',
                cursor: 'pointer',
              }}
              svgClassName="fill-secondary-800 dark:fill-secondary-800"
              onClick={() => handleSearchChange('')}
            />
          )}
        </div>
      </div>
    </section>
  ) : (
    // Horizontal layout for split pane inactive
    <section className="grid gap-x-16 gap-3" style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'start' }}>
      <h4 className="text-left"></h4>
      <h4 className="text-left">Filter By</h4>
      <h4 className="text-left">Sort by</h4>

      {/* Search Bar */}
      <div className="items-center">
        <div className="relative flex items-center" style={{ width: '100%' }}>
          <TextInput
            placeholder="Search Test Results"
            inputStyles={{ paddingLeft: 40, height: '40px' }}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {/* Magnify Glass Icon */}
          <Icon
            name={IconName.MagnifyGlass}
            size={20}
            style={{
              position: 'absolute',
              top: '40%',
              left: 10,
              transform: 'translateY(-50%)',
            }}
            svgClassName="fill-secondary-800 dark:fill-secondary-800"
          />
          {/* Clear Search Icon */}
          {searchQuery && (
            <Icon
              name={IconName.Close}
              size={20}
              style={{
                position: 'absolute',
                top: '40%',
                right: 10,
                transform: 'translateY(-50%)',
                cursor: 'pointer',
              }}
              svgClassName="fill-secondary-800 dark:fill-secondary-800"
              onClick={() => handleSearchChange('')}
            />
          )}
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="flex items-center">
        <Dropdown
          id="filter-dropdown"
          title="Select"
          data={filterOptions}
          selectedId={activeFilter}
          onSelect={(id) => onFilter(id)}
        />
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center">
        <Dropdown
          id="sort-dropdown"
          data={sortOptions}
          onSelect={(sortBy) => onSort(sortBy)}
        />
      </div>
    </section>
  );
}
