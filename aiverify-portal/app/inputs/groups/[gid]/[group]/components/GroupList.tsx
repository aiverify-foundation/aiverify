// /app/inputs/components/GroupList.tsx
'use client';
import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import ChecklistsFilters from '@/app/inputs/components/FilterButtons';
// import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';

import { Card } from '@/lib/components/card/card';

type GroupListProps = object;

const GroupList: React.FC<GroupListProps> = () => {
  const { groupDataList, gid, group } = useInputBlockGroupData();
  const router = useRouter();

  // State for search query and sort option
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Create a Fuse instance to search only group names
  const fuse = useMemo(() => {
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.5,
    };
    // Only use group names from the grouped checklists for search
    return new Fuse(groupDataList || [], options);
  }, [groupDataList]);

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle sort option change
  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  // Filter and sort the groups based on search query and sort options
  const filteredGroups = useMemo(() => {
    const filtered = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : groupDataList || [];

    // Sorting logic for groups
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          // Sort by the earliest updated checklist in the group
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
  }, [groupDataList, searchQuery, sortBy, fuse]);

  const handleGroupClick = (groupId: number) => {
    // setSelectedGroup(groupName);
    // const groupChecklists = groupedChecklists[groupName];
    // setChecklists(groupChecklists);
    router.push(
      `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/${groupId}`
    );
  };

  return (
    <div className="mt-6 flex h-full flex-col">
      <ChecklistsFilters
        onSearch={handleSearch}
        onSort={handleSort}
      />
      <div className="mt-2 flex-1 overflow-y-auto p-1 scrollbar-hidden">
        {filteredGroups.map((group) => (
          <Card
            key={group.id}
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
            onClick={() => handleGroupClick(group.id)}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{group.name}</h3>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
