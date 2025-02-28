'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';
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

type PageParams = {
  checklistId: string;
  groupId: string;
  [key: string]: string | string[];
};

export default function ChecklistDetailPage() {
  const params = useParams<PageParams>();

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
                <Link href={`/inputs/checklists/`}>Checklists</Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl font-bold text-white hover:underline">
                <Link href={`/inputs/checklists/${params.groupId}`}>
                  {decodeURIComponent(params.groupId)}
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
          <ChecklistDetail id={params.checklistId} />
        </div>
      </div>
    </QueryClientProvider>
  );
}
