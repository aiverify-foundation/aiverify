'use client';

import { useState } from 'react';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { TextInput } from '@/lib/components/textInput';
import { Button, ButtonVariant } from '@/lib/components/button';

type FilterProps = {
  onSearch: (value: string) => void;
  onFilter: (filter: string) => void;
  activeFilter: string;
};

export default function ModelsFilters({
  onSearch,
  onFilter,
  activeFilter,
}: FilterProps) {

  const pillFilters = [
    { id: 'model', label: 'MODEL' },
    { id: 'pipeline', label: 'PIPELINE' },
    { id: 'api', label: 'MODEL API' },
  ];

  const [selectedPill, setSelectedPill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handlePillClick = (pillId: string) => {
    const newSelection = selectedPill === pillId ? null : pillId; // Deselect if already selected
    setSelectedPill(newSelection);
    onFilter(newSelection || ''); // Pass the pill ID or reset to no filter
  };
  

  return (
    // Vertical layout for split pane active
    <section className="flex justify-between">
      {/* Search Bar */}
      <div>
        <div className="relative flex items-center w-full">
          <TextInput
            placeholder="Search Models"
            inputStyles={{ paddingLeft: 40, height: '40px', backgroundColor:'var(--color-transparent)', color:'#FFFFFF' }}
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
              color='white'
              onClick={() => handleSearchChange('')}
            />
          )}
        </div>
      </div>
      {/* Pill Filters */}
      <div className="flex flex-wrap space-x-4">
        {pillFilters.map((filter) => (
          <Button
            key={filter.id}
            text={filter.label}
            textColor='white'
            variant={
              activeFilter === filter.id
                ? ButtonVariant.PRIMARY
                : ButtonVariant.OUTLINE
            }
            size="xs"
            pill={true}
            onClick={() => handlePillClick(filter.id)}
          />
        ))}
      </div>
    </section>
  );
}