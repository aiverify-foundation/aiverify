'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { Icon, IconName } from '@/lib/components/IconSVG';
import ChecklistDetail from './components/ChecklistDetail';
import { RiArrowLeftLine } from '@remixicon/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function ChecklistDetailPage() {
  console.log('ChecklistDetailPage component started');
  
  const { gid, groupId, cid, group, name } = useInputBlockGroupData();
  const router = useRouter();
  const [urlParams, setUrlParams] = useState<{ projectId: string | null; flow: string | null }>({
    projectId: null,
    flow: null
  });
  
  useEffect(() => {
    // Get URL parameters from window.location
    if (typeof window !== 'undefined') {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const projectId = urlSearchParams.get('projectId');
      const flow = urlSearchParams.get('flow');
      setUrlParams({ projectId, flow });
      console.log('URL params from window.location:', { projectId, flow });
    }
  }, []);
  
  console.log('Context values:', { gid, groupId, cid, group });
  console.log('URL params state:', urlParams);
  
  if (!groupId || !cid) {
    console.log('Early return triggered - missing groupId or cid');
    return null;
  }

  // Helper function to preserve query parameters
  const preserveQueryParams = (url: string) => {
    if (urlParams.flow && urlParams.projectId) {
      return `${url}?flow=${urlParams.flow}&projectId=${urlParams.projectId}`;
    }
    return url;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto px-4 py-6">
        {/* Left section: Icon + Text */}
        
        <div className="flex items-center mb-6">
          <Link href={preserveQueryParams(`/inputs/groups/${gid}/${group}/${groupId}`)}>
            <RiArrowLeftLine className="text-2xl text-white hover:text-gray-300" />
          </Link>
          <Icon
            name={IconName.File}
            size={35}
            color="#FFFFFF"
          />
          <nav className="ml-3 breadcrumbs text-sm">
            <span className="text-2xl font-bold text-white hover:underline">
              <Link href={preserveQueryParams("/inputs")}>Inputs</Link>
            </span>
            <span className="mx-2 text-2xl text-white">/</span>
            <span className="text-2xl font-bold text-white hover:underline">
              <Link href={preserveQueryParams(`/inputs/groups/${gid}/${group}`)}>{group}</Link>
            </span>
            <span className="mx-2 text-2xl text-white">/</span>
            <span className="text-2xl font-bold text-white hover:underline">
              <Link href={preserveQueryParams(`/inputs/groups/${gid}/${group}/${groupId}`)}>
                {name || groupId}
              </Link>
            </span>
            <span className="mx-2 text-2xl text-white">/</span>
            <span className="text-2xl font-bold text-primary-300 text-white">
              Details
            </span>
          </nav>
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
