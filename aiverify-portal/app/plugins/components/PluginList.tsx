'use client';

import { useState, useMemo } from 'react';
import { Plugin } from '@/app/types';
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
  const [selectedResult, setSelectedResult] = useState<Plugin | null>(null);
  const [results, setResults] = useState<Plugin[]>(plugins);

  const fuse = useMemo(() => {
    const options = {
      keys: [
        'name',
        'gid',
        'version',
        'author',
        'description',
        'url',
        'meta',
        'is_stock',
        'zip_hash',
        'algorithm',
        'created_at',
        'updated_at', //algo, widget, input, templates
      ],
      includeScore: true,
      threshold: 0.7, // lower threshold = more accurate
    };
    return new Fuse(plugins, options);
  }, [plugins]);

  const filteredResults = useMemo(() => {
    // no search query, return all the results
    let searchPlugins = searchQuery
      ? fuse.search(searchQuery).map(plugin => plugin.item)
      : results;
  
    /* if filtering selected
    if (activeFilter) {
      searchPlugins = searchPlugins.filter(plugin => 
        result.testArguments.modelType === activeFilter.toLowerCase() ||
        result.cid === activeFilter.toLowerCase()
      );
    }
    */
  
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

  return selectedResult ? (
    <SplitPane
      leftPane={
        <div className="h-full flex flex-col">
          <PluginsFilters
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            activeFilter={activeFilter}
            isSplitPaneActive={true}
          />
          <div className="flex-1 overflow-y-auto mt-2">
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
  ) : (
    <div>
      <PluginsFilters
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        activeFilter={activeFilter}
        isSplitPaneActive={false}
      />
      <div className="mt-6">
        {filteredResults.map((plugin) => (
          <div onClick={() => handleSelectPlugin(plugin)} key={plugin.gid}>
            <PluginCard plugin={plugin} />
          </div>
        ))}
      </div>
    </div>
  );
}
