'use client';

import Fuse from 'fuse.js';
import { useState, useMemo } from 'react';
import { Plugin } from '@/app/plugins/utils/types';
import { Card } from '@/lib/components/card/card';
import PluginsFilters from './FilterButtons';
import PluginCard from './PluginCard';
import PluginDetail from './PluginDetail';
import SplitPane from './SplitPane';

type Props = {
  plugins: Plugin[];
};

export default function PluginsList({ plugins }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date');
  const [selectedResult, setSelectedResult] = useState<Plugin | null>(
    plugins[0] || null
  );
  const [results, setResults] = useState<Plugin[]>(plugins);
  const [loading, setLoading] = useState(false); // Loading state

  const fuse = useMemo(() => {
    const options = {
      keys: [
        'gid',
        'version',
        'name',
        'author',
        'description',
        'url',
        'meta',
        'is_stock',
        'zip_hash',
        'created_at',
        'updated_at', //algo, widget, input, templates
        'algorithms.cid',
        'algorithms.gid',
        'algorithms.name',
        'algorithms.modelType',
        'algorithms.description',
        'algorithms.tags',
        'algorithms.language',
        'algorithms.module_name',
        'algorithms.zip_hash',
        'widgets.cid',
        'widgets.name',
        'widgets.version',
        'widgets.author',
        'widgets.description',
        'widgets.properties.key',
        'widgets.tags',
        'widgets.gid',
        'input_blocks.cid',
        'input_blocks.name',
        'input_blocks.version',
        'input_blocks.author',
        'input_blocks.tags',
        'input_blocks.description',
        'input_blocks.group',
        'input_blocks.gid',
        'templates.cid',
        'templates.name',
        'templates.description',
        'templates.author',
        'templates.version',
        'templates.tags',
        'templates.gid',
      ],
      includeScore: true,
      threshold: 0.5, // lower threshold = more accurate
    };
    return new Fuse(plugins, options);
  }, [plugins]);

  const filteredResults = useMemo(() => {
    let searchPlugins = searchQuery
      ? fuse.search(searchQuery).map((plugin) => plugin.item)
      : results;

    // Filter by multiple active filters
    if (activeFilters.length > 0) {
      searchPlugins = searchPlugins.filter((plugin) => {
        return activeFilters.every((filter) => {
          // Handle category filters
          if (filter === 'templates') return plugin.templates.length > 0;
          if (filter === 'widgets') return plugin.widgets.length > 0;
          if (filter === 'algorithms') return plugin.algorithms.length > 0;
          if (filter === 'inputBlocks') return plugin.input_blocks.length > 0;

          // Handle tag filters (those that start with "tag:")
          if (filter.startsWith('tag:')) {
            const tagToFilter = filter.substring(4); // Remove 'tag:' prefix
            try {
              const metaData = JSON.parse(plugin.meta);
              return (
                metaData.tags &&
                Array.isArray(metaData.tags) &&
                metaData.tags.includes(tagToFilter)
              );
            } catch (error) {
              console.error(
                'Error parsing plugin meta for tag filtering:',
                error
              );
              return false;
            }
          }

          return true;
        });
      });
    }

    if (sortBy === 'date-asc') {
      searchPlugins = searchPlugins.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortBy === 'date-desc') {
      searchPlugins = searchPlugins.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === 'name') {
      searchPlugins = searchPlugins.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return searchPlugins;
  }, [searchQuery, activeFilters, sortBy, fuse, results]);

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filters: string[]) => {
    setActiveFilters(filters);
  };
  const handleSort = (newSortBy: string) => setSortBy(newSortBy);

  const handleSelectPlugin = (plugin: Plugin) => {
    if (selectedResult?.gid === plugin.gid) {
      setSelectedResult(null);
    } else {
      setSelectedResult(plugin);
    }
  };

  const handleDeletePlugin = async (deletedGid: string) => {
    // Set loading state to true to show the Suspense fallback
    setLoading(true);
    // Simulate a delay after deleting to show suspense effect
    setTimeout(() => {
      setResults((prevResults) => {
        const filteredResults = prevResults.filter(
          (plugin) => plugin.gid !== deletedGid
        );
        const deletedIndex = prevResults.findIndex(
          (plugin) => plugin.gid === deletedGid
        );
        const newSelectedPlugin =
          filteredResults[deletedIndex - 1] || filteredResults[0] || null;
        setSelectedResult(newSelectedPlugin);
        setLoading(false); // End loading state
        console.log('Loading state set to false');
        return filteredResults;
      });
    }, 300); // Delay of 0.3 seconds for suspense
  };

  return (
    <SplitPane
      leftPane={
        <div
          className="flex h-full flex-col"
          role="region"
          aria-label="Plugins list">
          <PluginsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            activeFilters={activeFilters}
            plugins={plugins}
          />
          <div
            className="mt-2 flex-1 overflow-y-auto p-1 scrollbar-hidden"
            role="list"
            aria-label="Filtered plugins">
            {loading
              ? Array.from({ length: 10 }).map((_, index) => (
                  <Card
                    key={index}
                    size="md"
                    className="mb-4 w-full animate-pulse shadow-md transition-shadow duration-200 hover:shadow-lg"
                    style={{
                      border: '1px solid var(--color-secondary-300)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      width: '100%',
                      height: '200px',
                    }}
                    cardColor="var(--color-secondary-950)"
                    enableTiltEffect={false}
                    aria-label="Loading plugin card">
                    <Card.Content className="h-auto" />
                  </Card>
                ))
              : filteredResults.map((plugin) => (
                  <div
                    onClick={() => handleSelectPlugin(plugin)}
                    key={plugin.gid}
                    role="listitem"
                    aria-label={`Plugin: ${plugin.name}`}>
                    <PluginCard plugin={plugin} />
                  </div>
                ))}
          </div>
        </div>
      }
      rightPane={
        loading ? (
          <div
            className="flex h-full animate-pulse flex-col rounded-lg bg-secondary-950 p-6 shadow-lg"
            role="region"
            aria-label="Loading plugin details"
          />
        ) : (
          <PluginDetail
            plugin={selectedResult}
            onDelete={handleDeletePlugin}
          />
        )
      }
    />
  );
}
