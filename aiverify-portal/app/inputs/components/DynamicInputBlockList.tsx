'use client';

import Fuse from 'fuse.js';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import ChecklistsFilters from '@/app/inputs/components/FilterButtons';
import { InputBlock, InputBlockData } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { DynamicInputBlockModal } from './DynamicInputBlockModal';

interface DynamicInputBlockListProps {
  title: string;
  description: string;
  inputBlock: InputBlock;
  inputBlockData: InputBlockData[];
}

export const DynamicInputBlockList: React.FC<DynamicInputBlockListProps> = ({
  title,
  description,
  inputBlock,
  inputBlockData,
}) => {
  // State for search query, sort option, and modal
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showAddModal, setShowAddModal] = useState(false);

  // Create a Fuse instance to search input block names
  const fuse = useMemo(() => {
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.5,
    };
    return new Fuse(inputBlockData, options);
  }, [inputBlockData]);

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle sort option change
  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  // Filter and sort the input blocks based on search query and sort options
  const filteredItems = useMemo(() => {
    const filtered = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : inputBlockData;

    // Sorting logic for input blocks
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          );
        case 'date-desc':
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [inputBlockData, searchQuery, sortBy, fuse]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/inputs">
            <Icon
              name={IconName.ArrowLeft}
              size={40}
              color="#FFFFFF"
            />
          </Link>
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <h3 className="text-white">{description}</h3>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded bg-primary-700 px-4 py-2 text-white transition-colors hover:bg-primary-600">
          Add New {title}
        </button>
      </div>

      <div className="mt-6 flex h-full flex-col">
        {/* Filters section */}
        <ChecklistsFilters
          onSearch={handleSearch}
          onSort={handleSort}
        />

        {/* Input blocks list */}
        {filteredItems.length > 0 ? (
          <div className="mt-4 flex-1 overflow-y-auto p-1 scrollbar-hidden">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/inputs/${inputBlock.gid}/${inputBlock.cid}/${item.id}`}>
                <Card
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
                  enableTiltEffect={false}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated:{' '}
                      {new Date(item.updated_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Created:{' '}
                      {new Date(item.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg bg-secondary-900 p-8">
            <Icon
              name={IconName.File}
              size={60}
              color="#FFFFFF"
            />
            <h2 className="mt-4 text-xl font-semibold text-white">
              No {title} Found
            </h2>
            <p className="mt-2 text-center text-secondary-400">
              {searchQuery
                ? `No matching items found for "${searchQuery}". Try a different search term.`
                : `You haven't created any ${title.toLowerCase()} yet. Click the button above to add one.`}
            </p>
          </div>
        )}
      </div>

      {/* Modal for adding new input block */}
      {showAddModal && (
        <DynamicInputBlockModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          gid={inputBlock.gid}
          cid={inputBlock.cid}
          title={title}
        />
      )}
    </div>
  );
};
