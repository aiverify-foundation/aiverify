'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import React from 'react';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { Icon, IconName } from '@/lib/components/IconSVG';
import ChecklistDetail from './components/ChecklistDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function ChecklistDetailPage() {
  const { gid, groupId, cid, group } = useInputBlockGroupData();
  if (!groupId || !cid) return;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto px-4 py-6">
        {/* Left section: Icon + Text */}
        <div className="flex">
          <Icon
            name={IconName.File}
            size={35}
            color="#FFFFFF"
          />
          <div className="ml-3 items-end">
            <nav className="breadcrumbs mb-6 text-sm">
              <span className="text-2xl font-bold text-white hover:underline">
                <Link href="/inputs">Inputs</Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl font-bold text-white hover:underline">
                <Link href={`/inputs/groups/`}>Groups</Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl font-bold text-white hover:underline">
                <Link href={`/inputs/groups/${gid}/${group}`}>{group}</Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl font-bold text-white hover:underline">
                <Link href={`/inputs/groups/${gid}/${group}/${groupId}`}>
                  {groupId}
                </Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl font-bold text-primary-300 text-white">
                Details
              </span>
            </nav>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <ChecklistDetail
            cid={cid}
            gid={gid}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}
