'use client';

import { useState } from 'react';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { TextInput } from '@/lib/components/textInput';
import Dropdown from './DropdownMenu';
import { Button, ButtonVariant } from '@/lib/components/button';

type FilterProps = {
  onSearch: (value: string) => void;
  onSort: (sortBy: string) => void;
};

export default function ChecklistsFilters({ onSearch, onSort }: FilterProps) {
  const sortOptions = [
    { id: 'date-asc', name: 'Updated Date (oldest to newest)' },
    { id: 'date-desc', name: 'Updated Date (newest to oldest)' },
    { id: 'name', name: 'Name (A-Z)' },
  ];
  const [selectedPill, setSelectedPill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <section className="flex justify-between">
      {/* Search Bar */}
      <div>
        <div className="relative flex w-full items-start">
          <TextInput
            placeholder="Search"
            inputStyles={{
              paddingLeft: 40,
              height: '40px',
              backgroundColor: 'var(--color-transparent)',
              color: '#FFFFFF',
            }}
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
            svgClassName="fill-white dark:fill-white"
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
              color="white"
              onClick={() => handleSearchChange('')}
            />
          )}
        </div>
      </div>
      {/* Sort Dropdown */}
      <div className="flex items-start">
        <Dropdown
          id="sort-dropdown"
          data={sortOptions}
          onSelect={(sortBy) => onSort(sortBy)}
        />
      </div>
    </section>
  );
}
