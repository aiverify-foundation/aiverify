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
        <TextInput
          placeholder="Search by Name"
          labelSibling={
            <div className="relative flex items-center gap-2">
              {searchQuery.length ? (
                <Icon
                  name={IconName.Close}
                  size={20}
                  style={{ position: 'absolute', top: 6, right: 8 }}
                  svgClassName="stroke-secondary-500"
                  onClick={handleClearSearch}
                />
              ) : (
                <Icon
                  name={IconName.MagnifyGlass}
                  size={18}
                  style={{ position: 'absolute', top: 8, right: 8 }}
                  svgClassName="fill-secondary-500"
                />
              )}
            </div>
          }
          onChange={handleTextInputChange}
          inputStyles={{ paddingRight: 30 }}
          value={searchQuery}
        />
      </div>
    </section>
  );
}
