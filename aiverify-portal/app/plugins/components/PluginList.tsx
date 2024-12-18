'use client';

import { useState, useMemo } from 'react';
import { Plugin } from '../utils/types';
import PluginCard from './PluginCard';
import PluginsFilters from './FilterButtons';
import PluginDetail from './PluginDetail';
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
    // Start with plugins filtered by search query
    let searchPlugins = searchQuery
    ? fuse.search(searchQuery).map(plugin => plugin.item)
    : plugins;

    // Apply pill filter logic
    if (activeFilter === 'stock') {
      searchPlugins = searchPlugins.filter(plugin => 
        plugin.is_stock
      );
    } else if (activeFilter) {
      // Add other filters if needed
      searchPlugins = searchPlugins.filter(plugin =>
        activeFilter === 'templates' ? plugin.templates.length > 0:
        activeFilter === 'widgets' ? plugin.widgets.length > 0 :
        activeFilter === 'algorithms' ? plugin.algorithms.length > 0 :
        activeFilter === 'inputBlocks' ? plugin.input_blocks.length > 0 :
        true
      );
    }
  
    // if sorting selected
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
            {filteredResults.map((plugin) => (
              <div onClick={() => handleSelectPlugin(plugin)} key={plugin.gid}>
                <PluginCard plugin={plugin} />
              </div>
            ))}
          </div>
        </div>
      }
      rightPane={<PluginDetail plugin={selectedResult} />}
    />
  );
}
