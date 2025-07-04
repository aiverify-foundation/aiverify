'use client';

import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TextInput } from '@/lib/components/textInput';
import Fuse from 'fuse.js';
import { useCallback, useState } from 'react';
import { ReportTemplate } from '../types';
import { useTemplateSearch } from './TemplateSearchProvider';

interface TemplateFiltersProps {
  className?: string;
  templates: ReportTemplate[];
}

export function TemplateFilters({ className, templates }: TemplateFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { onSearch } = useTemplateSearch();

  const fuse = new Fuse(templates, {
    keys: ['projectInfo.name'],
    threshold: 0.3,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      onSearch(templates);
      return;
    }
    const results = fuse.search(query);
    onSearch(results.map(result => result.item));
  }, [templates, onSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    onSearch(templates);
  }, [templates, onSearch]);

  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative w-[400px] gap-2">
            <TextInput
              placeholder="Search templates..."
              inputStyles={{
                paddingLeft: 40,
              }}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Icon
              name={IconName.MagnifyGlass}
              size={20}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
              }}
              svgClassName="fill-secondary-800 dark:fill-secondary-800"
            />
          </div>
          <Button
            variant={ButtonVariant.SECONDARY}
            size="sm"
            text="Clear"
            bezel={false}
            onClick={handleClear}
          />
        </div>
      </div>
    </section>
  );
}
