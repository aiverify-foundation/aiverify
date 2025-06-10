'use client';

import { useState } from 'react';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { TextInput } from '@/lib/components/textInput';

type FilterProps = {
  onSearchInputChange: (value: string) => void;
};

export function Filters({ onSearchInputChange }: FilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  function handleTextInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    onSearchInputChange(e.target.value);
  }

  function handleClearSearch() {
    setSearchQuery('');
    onSearchInputChange('');
  }

  return (
    <section className="flex justify-between">
      <div style={{ width: 400 }}>
        <div className="relative flex w-full items-center">
          <TextInput
            placeholder="Search by Name"
            inputStyles={{
              paddingLeft: 40,
            }}
            onChange={handleTextInputChange}
            value={searchQuery}
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
              onClick={handleClearSearch}
            />
          )}
        </div>
      </div>
    </section>
  );
}
