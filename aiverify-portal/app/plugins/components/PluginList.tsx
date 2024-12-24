'use client';

import { useState, useMemo } from 'react';
import { Plugin } from '../utils/types';
import PluginCard from './PluginCard';
import PluginsFilters from './FilterButtons';
import PluginDetail from './PluginDetail';
import { Card } from '@/lib/components/card/card';
import SplitPane from './SplitPane';
import Fuse from 'fuse.js';

type Props = {
  plugins: Plugin[];
};

export default function PluginsList({ plugins }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedResult, setSelectedResult] = useState<Plugin | null>(plugins[0] || null);
  const [results, setResults] = useState<Plugin[]>(plugins);
  const [isPluginDeleted, setIsPluginDeleted] = useState(false);
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
      ? fuse.search(searchQuery).map(plugin => plugin.item)
      : results;

    if (activeFilter === 'stock') {
      searchPlugins = searchPlugins.filter(plugin => plugin.is_stock);
    } else if (activeFilter) {
      searchPlugins = searchPlugins.filter(plugin =>
        activeFilter === 'templates' ? plugin.templates.length > 0 :
        activeFilter === 'widgets' ? plugin.widgets.length > 0 :
        activeFilter === 'algorithms' ? plugin.algorithms.length > 0 :
        activeFilter === 'inputBlocks' ? plugin.input_blocks.length > 0 :
        true
      );
    }

    if (sortBy === 'date-asc') {
      searchPlugins = searchPlugins.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'date-desc') {
      searchPlugins = searchPlugins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'name') {
      searchPlugins = searchPlugins.sort((a, b) => a.name.localeCompare(b.name));
    }

    return searchPlugins;
  }, [searchQuery, activeFilter, sortBy, fuse, results]);

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filter: string) => setActiveFilter(filter);
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
        const filteredResults = prevResults.filter(plugin => plugin.gid !== deletedGid);
        const deletedIndex = prevResults.findIndex(plugin => plugin.gid === deletedGid);
        const newSelectedPlugin = filteredResults[deletedIndex - 1] || filteredResults[0] || null;
        setSelectedResult(newSelectedPlugin);
        setLoading(false); // End loading state
        console.log("Loading state set to false");
        return filteredResults;
      });
    }, 3000); // Delay of 5 seconds for suspense
  }; 

  return (
    <SplitPane
      leftPane={
        <div className="h-full flex flex-col">
          <PluginsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            activeFilter={activeFilter}
          />
          <div className="flex-1 overflow-y-auto mt-2 scrollbar-hidden p-1">
            {loading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <Card
                  key={index}
                  size="md"
                  className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200 w-full animate-pulse"
                  style={{
                    border: '1px solid var(--color-secondary-300)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    width: '100%',
                    height: '200px'
                  }}
                  cardColor="var(--color-secondary-950)"
                  enableTiltEffect={false}
                >
                  <Card.Content className="h-auto">
                  </Card.Content>
                </Card>
              ))
            ) : (
              filteredResults.map((plugin) => (
                <div onClick={() => handleSelectPlugin(plugin)} key={plugin.gid}>
                  <PluginCard plugin={plugin} />
                </div>
              ))
            )}
          </div>
        </div>
      }
      rightPane={
        loading ? (
          <div className="bg-secondary-950 h-full rounded-lg shadow-lg p-6 flex flex-col animate-pulse">
          </div>
        ) : (
          <PluginDetail plugin={selectedResult} onDelete={handleDeletePlugin} />
        )
      }
    />
  );
}
