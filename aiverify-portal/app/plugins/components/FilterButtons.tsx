'use client';

import { useState } from 'react';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TextInput } from '@/lib/components/textInput';
import Dropdown from './DropdownMenu';

type FilterProps = {
  onSearch: (value: string) => void;
  onFilter: (filters: string[]) => void;
  onSort: (sortBy: string) => void;
  activeFilters: string[];
};

export default function PluginsFilters({
  onSearch,
  onFilter,
  onSort,
  activeFilters,
}: FilterProps) {
  const pillFilters = [
    { id: 'templates', label: 'TEMPLATES' },
    { id: 'widgets', label: 'WIDGETS' },
    { id: 'algorithms', label: 'ALGORITHMS' },
    { id: 'inputBlocks', label: 'INPUT BLOCKS' },
  ];

  const filterOptions = [{ id: '', name: 'Select' }];

  const sortOptions = [
    { id: 'date-asc', name: 'Installed Date (oldest to newest)' },
    { id: 'date-desc', name: 'Installed Date (newest to oldest)' },
    { id: 'name', name: 'Name (A-Z)' },
  ];
  const [] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handlePillClick = (pillId: string) => {
    const newFilters = [...activeFilters];
    const index = newFilters.indexOf(pillId);

    if (index === -1) {
      // Add filter
      newFilters.push(pillId);
    } else {
      // Remove filter
      newFilters.splice(index, 1);
    }

    onFilter(newFilters); // Pass the updated filters to parent
  };

  return (
    // Vertical layout for split pane active
    <section className="flex flex-col space-y-4">
      {/* Pill Filters */}
      <div className="flex flex-wrap justify-between">
        {pillFilters.map((filter) => (
          <Button
            key={filter.id}
            text={filter.label}
            textColor="white"
            variant={
              activeFilters.includes(filter.id)
                ? ButtonVariant.PRIMARY
                : ButtonVariant.OUTLINE
            }
            size="sm"
            pill={true}
            onClick={() => handlePillClick(filter.id)}
          />
        ))}
      </div>
      {/* Filter and Sort */}
      <div className="flex items-start justify-between space-x-3">
        {/* Filter Dropdown */}
        <div>
          <h4 className="mb-1 text-left">Tags</h4>
          <Dropdown
            id="filter-dropdown"
            title="Select"
            data={filterOptions}
            onSelect={(id) => handlePillClick(id)}
          />
        </div>

        {/* Sort Dropdown */}
        <div>
          <h4 className="mb-1 text-left">Sort By</h4>
          <Dropdown
            id="sort-dropdown"
            data={sortOptions}
            onSelect={(sortBy) => onSort(sortBy)}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <div />
        <div
          className="relative flex items-center"
          style={{ width: '100%' }}>
          <TextInput
            placeholder="Search Plugins"
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
  );
}
