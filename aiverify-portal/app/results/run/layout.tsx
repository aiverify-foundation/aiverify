'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import LayoutHeader from '@/app/results/run/components/LayoutHeader';
import { QueryProvider } from './components/QueryProvider';

export default function RunTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  const isProjectFlow = !!projectId && !!flow;

  const handleBack = () => {
    if (isProjectFlow) {
      router.push(`/project/select_data?projectId=${projectId}&flow=${flow}`);
    }
  };

  return (
    <QueryProvider>
      {isProjectFlow && (
        <LayoutHeader
          projectId={projectId}
          onBack={handleBack}
        />
      )}
      <div className={`w-full ${isProjectFlow ? 'mt-16' : ''} h-full`}>
        {children}
      </div>
    </QueryProvider>
  );
}
