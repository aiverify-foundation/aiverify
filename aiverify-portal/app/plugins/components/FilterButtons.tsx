'use client';

import { useState, useEffect } from 'react';
import { Plugin } from '@/app/plugins/utils/types';
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
  plugins?: Plugin[];
};

export default function PluginsFilters({
  onSearch,
  onFilter,
  onSort,
  activeFilters,
  plugins = [],
}: FilterProps) {
  const pillFilters = [
    { id: 'templates', label: 'TEMPLATES' },
    { id: 'widgets', label: 'WIDGETS' },
    { id: 'algorithms', label: 'ALGORITHMS' },
    { id: 'inputBlocks', label: 'INPUT BLOCKS' },
  ];

  // Initialize filterOptions with the default "Select" option
  const [filterOptions, setFilterOptions] = useState([
    { id: '', name: 'Select' },
  ]);

  const sortOptions = [
    { id: 'date-asc', name: 'Installed Date (oldest to newest)' },
    { id: 'date-desc', name: 'Installed Date (newest to oldest)' },
    { id: 'name', name: 'Name (A-Z)' },
  ];
  const [, setSelectedTagFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract tags from plugins when plugins prop changes
  useEffect(() => {
    if (plugins && plugins.length > 0) {
      // Get all unique tags from plugin meta
      const uniqueTags = new Set<string>();

      plugins.forEach((plugin) => {
        try {
          if (plugin.meta) {
            const metaData = JSON.parse(plugin.meta);
            if (metaData.tags && Array.isArray(metaData.tags)) {
              metaData.tags.forEach((tag: string) => uniqueTags.add(tag));
            }
          }
        } catch (error) {
          console.error('Error parsing plugin meta:', error);
        }
      });

      // Convert Set to array of option objects for dropdown
      const tagOptions = Array.from(uniqueTags).map((tag) => ({
        id: `tag:${tag}`,
        name: tag,
      }));

      // Update the filter options with the default option and the extracted tags
      setFilterOptions([{ id: '', name: 'Select' }, ...tagOptions]);
    }
  }, [plugins]);

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

  const handleTagSelect = (tagId: string) => {
    setSelectedTagFilter(tagId);

    // If a tag is selected, add it to the active filters
    if (tagId) {
      // Remove any previous tag filters (those that start with "tag:")
      const nonTagFilters = activeFilters.filter((f) => !f.startsWith('tag:'));
      onFilter([...nonTagFilters, tagId]);
    } else {
      // If "Select" option is chosen, remove all tag filters
      const nonTagFilters = activeFilters.filter((f) => !f.startsWith('tag:'));
      onFilter(nonTagFilters);
    }
  };

  return (
    // Vertical layout for split pane active
    <section
      className="flex flex-col space-y-4"
      aria-labelledby="filter-section-title">
      {/* Pill Filters */}
      <div
        className="flex flex-wrap justify-between"
        role="group"
        aria-label="Filter by category">
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
            size="xs"
            pill={true}
            onClick={() => handlePillClick(filter.id)}
            aria-pressed={activeFilters.includes(filter.id)}
            aria-label={`Filter by ${filter.label}`}
          />
        ))}
      </div>
      {/* Filter and Sort */}
      <div className="flex items-start space-x-3">
        {/* Filter Dropdown - 1/4 width */}
        <div className="w-1/4">
          <h4 className="mb-1 text-left">Tags</h4>
          <Dropdown
            id="filter-dropdown"
            title="Select"
            data={filterOptions}
            onSelect={(id) => handleTagSelect(id)}
            width="100%"
            aria-label="Filter by tags"
          />
        </div>

        {/* Sort Dropdown - 3/4 width */}
        <div className="w-3/4">
          <h4 className="mb-1 text-left">Sort By</h4>
          <Dropdown
            id="sort-dropdown"
            data={sortOptions}
            onSelect={(sortBy) => onSort(sortBy)}
            width="100%"
            aria-label="Sort plugins"
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
            aria-label="Search for plugins"
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
            role="img"
            aria-label="Search icon"
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
              role="button"
              aria-label="Clear search input"
            />
          )}
        </div>
      </div>
    </section>
  );
}
