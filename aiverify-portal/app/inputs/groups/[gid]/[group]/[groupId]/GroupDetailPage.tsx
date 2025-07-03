'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import ChecklistsFilters from '@/app/inputs/components/FilterButtons';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { ChevronLeftIcon } from '@/app/inputs/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import ActionButtons from '../components/ActionButtons';
import GroupDetail from './components/GroupDetail';
import GroupHeader from './components/GroupNameHeader';
import ProgressSidebar from './components/ProgressSidebar';
import SplitPane from './components/SplitPane';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function GroupDetailPage() {
  const { gid, group, setName, currentGroupData } = useInputBlockGroupData();

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Initialize Fuse search
  const fuse = useMemo(() => {
    if (!currentGroupData?.input_blocks) return null;
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.5,
    };
    return new Fuse(currentGroupData.input_blocks, options);
  }, [currentGroupData?.input_blocks]);

  // Filter and sort input blocks
  const filteredGroupData = useMemo(() => {
    if (!currentGroupData) return null;

    // First, filter by search query
    const filteredInputBlocks = searchQuery && fuse
      ? fuse.search(searchQuery).map((result) => result.item)
      : currentGroupData.input_blocks;

    // Then sort the results
    const sortedInputBlocks = [...filteredInputBlocks].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.groupNumber - b.groupNumber;
        case 'date-desc':
          return b.groupNumber - a.groupNumber;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    // Return a new group data object with filtered input blocks
    return {
      ...currentGroupData,
      input_blocks: sortedInputBlocks,
    };
  }, [currentGroupData, searchQuery, sortBy, fuse]);

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleSort = (newSortBy: string) => setSortBy(newSortBy);

  const updateGroupName = (newName: string) => {
    console.log('updateGroupName:', newName);
    setName(newName);
  };

  if (!currentGroupData) {
    return <div>Group data not found</div>;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="h-[calc(100vh-200px)] p-6">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center">
              <Icon
                name={IconName.File}
                size={40}
                color="#FFFFFF"
              />
              <div className="ml-3">
                <div className="flex">
                  <Link href="/inputs/">
                    <h1 className="text-2xl font-bold text-white hover:underline">
                      User Inputs
                    </h1>
                  </Link>
                  <ChevronLeftIcon
                    size={28}
                    color="#FFFFFF"
                  />
                  <Link href={`/inputs/groups/${gid}/${group}`}>
                    <h1 className="text-2xl font-bold text-white hover:underline">
                      {group}
                    </h1>
                  </Link>
                  <ChevronLeftIcon
                    size={28}
                    color="#FFFFFF"
                  />
                  <h1 className="text-2xl font-bold text-white hover:underline">
                    {currentGroupData?.name}
                  </h1>
                </div>
                <h3 className="text-white">Manage and view {group}</h3>
              </div>
            </div>
            <ActionButtons
              gid={gid}
              group={currentGroupData.group}
            />
          </div>
          <div className="mt-6 h-full w-full items-start justify-start overflow-y-auto rounded bg-secondary-950 scrollbar-hidden">
            <GroupHeader
              groupName={currentGroupData.name || ''}
              updateGroupName={updateGroupName}
            />
            <SplitPane
              leftPane={
                <div className="h-auto">
                  <ProgressSidebar />
                </div>
              }
              rightPane={
                <div className="flex h-full flex-col">
                  <ChecklistsFilters
                    onSearch={handleSearch}
                    onSort={handleSort}
                  />
                  {filteredGroupData && <GroupDetail group={filteredGroupData} />}
                </div>
              }
            />
          </div>
        </div>
      </Suspense>
    </QueryClientProvider>
  );
}
