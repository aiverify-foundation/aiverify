'use client';
import Fuse from 'fuse.js';
import dynamic from 'next/dynamic';
import React, { useMemo, useState } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useMDXSummaryBundle } from '@/app/inputs/[gid]/[cid]/hooks/useMDXSummaryBundle';
import ChecklistsFilters from '@/app/inputs/components/FilterButtons';
import { FairnessTree } from '@/app/inputs/utils/types';
import { Card } from '@/lib/components/card/card';

type GroupListProps = {
  trees: FairnessTree[];
};

const FairnessTreeSummaryMDX: React.FC<{ tree: FairnessTree }> = ({ tree }) => {
  const {
    data: mdxSummaryBundle,
    isLoading,
    error,
  } = useMDXSummaryBundle(tree.gid, tree.cid);

  const MDXComponent = useMemo(() => {
    if (!mdxSummaryBundle?.code) return null;

    try {
      const context = {
        React,
        jsx: ReactJSXRuntime.jsx,
        jsxs: ReactJSXRuntime.jsxs,
        _jsx_runtime: ReactJSXRuntime,
        Fragment: ReactJSXRuntime.Fragment,
      };

      const moduleFactory = new Function(
        ...Object.keys(context),
        `${mdxSummaryBundle.code}`
      );
      const moduleExports = moduleFactory(...Object.values(context));
      const progress = moduleExports.progress;
      const summary = moduleExports.summary;

      return { progress, summary };
    } catch (error) {
      console.error('Error creating MDX component:', error);
      return null;
    }
  }, [mdxSummaryBundle]);

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">Error loading content</div>;
  }

  if (!MDXComponent) {
    return <div className="text-sm text-gray-400">No content available</div>;
  }

  return (
    <div className="mdx-content">
      {MDXComponent.summary && (
        <div className="mt-2 text-sm text-gray-400">
          {MDXComponent.summary(tree.data)}
        </div>
      )}
      {MDXComponent.progress && (
        <div className="mt-2 text-sm text-gray-400">
          Progress: {MDXComponent.progress(tree.data)}%
        </div>
      )}
    </div>
  );
};

const FairnessTreeMDXModal = dynamic(() => import('./FairnessTreeMDXModal'), {
  ssr: false, // Disable server-side rendering for the modal
  loading: () => <div>Loading modal...</div>, // Fallback while loading
});

const FairnessTreeGroupList: React.FC<GroupListProps> = ({ trees }) => {
  // State for search query and sort option
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedTree, setSelectedTree] = useState<FairnessTree | null>(null);

  // Create a Fuse instance to search tree names
  const fuse = useMemo(() => {
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.5,
    };
    return new Fuse(trees, options);
  }, [trees]);

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle sort option change
  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  // Filter and sort the trees based on search query and sort options
  const filteredTrees = useMemo(() => {
    const filtered = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : trees;

    // Sorting logic for trees
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (
            new Date(a.updated_at || '').getTime() -
            new Date(b.updated_at || '').getTime()
          );
        case 'date-desc':
          return (
            new Date(b.updated_at || '').getTime() -
            new Date(a.updated_at || '').getTime()
          );
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [trees, searchQuery, sortBy, fuse]);

  const handleTreeClick = (tree: FairnessTree) => {
    setSelectedTree(tree);
  };

  const handleCloseModal = () => {
    setSelectedTree(null);
  };

  return (
    <div className="mt-6 flex h-full flex-col">
      <ChecklistsFilters
        onSearch={handleSearch}
        onSort={handleSort}
      />
      <div className="mt-2 flex-1 overflow-y-auto p-1 scrollbar-hidden">
        {filteredTrees.map((tree) => (
          <Card
            key={tree.id}
            size="md"
            className="mb-4 w-full cursor-pointer shadow-md transition-shadow duration-200 hover:shadow-lg"
            style={{
              border: '1px solid var(--color-secondary-300)',
              borderRadius: '0.5rem',
              padding: '1rem',
              width: '100%',
              height: 'auto',
            }}
            cardColor="var(--color-secondary-950)"
            enableTiltEffect={false}
            onClick={() => handleTreeClick(tree)}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{tree.name}</h3>
              </div>
              <div className="text-sm text-gray-500">
                Last updated:{' '}
                {new Date(tree.updated_at + "Z" || '').toLocaleDateString('en-GB')}
              </div>
              <FairnessTreeSummaryMDX tree={tree} />
            </div>
          </Card>
        ))}
      </div>
      {selectedTree && (
        <FairnessTreeMDXModal
          tree={selectedTree}
          isOpen={!!selectedTree}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default FairnessTreeGroupList;
