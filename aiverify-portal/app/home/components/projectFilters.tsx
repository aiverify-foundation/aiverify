'use client';

import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TextInput } from '@/lib/components/textInput';
import Fuse from 'fuse.js';
import { useCallback, useState, useMemo } from 'react';
import { Project } from '@/app/types';
import { useProjectSearch } from './ProjectSearchProvider';

interface ProjectsFiltersProps {
  className?: string;
  projects: Project[];
}

export function ProjectsFilters({ className, projects }: ProjectsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { onSearch } = useProjectSearch();

  const fuse = useMemo(() => new Fuse(projects, {
    keys: ['projectInfo.name'],
    threshold: 0.3,
  }), [projects]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      onSearch(projects);
      return;
    }
    
    const results = fuse.search(query);
    const filteredProjects = results.map(result => result.item);
    onSearch(filteredProjects);
  }, [projects, onSearch, fuse]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    onSearch(projects);
  }, [projects, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value);
  }, [handleSearch]);

  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <h2 className="text-xl font-bold tracking-wide">My Projects</h2>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative w-[400px] gap-2">
            <TextInput
              placeholder="Search projects..."
              inputStyles={{
                paddingLeft: 40,
              }}
              value={searchQuery}
              onChange={handleInputChange}
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
