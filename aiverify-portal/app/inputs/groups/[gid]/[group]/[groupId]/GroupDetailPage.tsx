'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, useState } from 'react';
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
  // const { selectedGroup, checklists, setSelectedGroup } = useChecklists();
  // console.log('checklist', checklists);
  // const pathname = usePathname();

  // Get group ID from URL
  // const groupIdFromURL = useMemo(() => {
  //   const urlParams = new URLSearchParams(pathname.split('?')[1]);
  //   return urlParams.get('groupId');
  // }, [pathname]);

  // const groupName = selectedGroup ?? decodeURIComponent(groupIdFromURL ?? '');
  // const selectedGroup =
  //   groupDataList && groupId
  //     ? groupDataList.find((x) => x.id == groupId)
  //     : null;
  // const groupName = group;
  // console.log(groupName);

  // Set the selected group if it's not already set
  // useEffect(() => {
  //   if (groupIdFromURL && !selectedGroup) {
  //     setSelectedGroup(decodeURIComponent(groupIdFromURL));
  //   }
  // }, [groupIdFromURL, selectedGroup, setSelectedGroup]);

  // Search and sort state
  const [, setSearchQuery] = useState('');
  const [, setSortBy] = useState('date-desc');

  // // Initialize Fuse search
  // const fuse = useMemo(() => {
  //   const options = {
  //     keys: ['name'],
  //     includeScore: true,
  //     threshold: 0.5,
  //   };
  //   return new Fuse(selectedGroup ? selectedGroup, options);
  // }, [selectedGroup]);

  // Filter and sort checklists
  // const filteredChecklists = useMemo(() => {
  //   // First, filter by search query
  //   const filtered = searchQuery
  //     ? fuse.search(searchQuery).map((result) => result.item)
  //     : checklists;

  //   // Then sort the results
  //   return [...filtered].sort((a, b) => {
  //     switch (sortBy) {
  //       case 'date-asc':
  //         return (
  //           new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  //         );
  //       case 'date-desc':
  //         return (
  //           new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  //         );
  //       case 'name':
  //         return a.name.localeCompare(b.name);
  //       default:
  //         return 0;
  //     }
  //   });
  // }, [checklists, searchQuery, sortBy, fuse]);

  // Handler functions
  // const handleSearch = (query: string) => setSearchQuery(query);
  // const handleSort = (newSortBy: string) => setSortBy(newSortBy);
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
                  {currentGroupData && <GroupDetail group={currentGroupData} />}
                </div>
              }
            />
          </div>
        </div>
      </Suspense>
    </QueryClientProvider>
  );
}
