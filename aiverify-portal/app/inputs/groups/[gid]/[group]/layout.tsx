'use client';

import React from 'react';
import { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// import LayoutHeader from '@/app/inputs/components/LayoutHeader';
import LayoutHeader from './components/LayoutHeader';
// import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { InputBlockGroupDataProvider } from '@/app/inputs/context/InputBlockGroupDataContext';

type LayoutProps = {
  children: ReactNode;
};

const InputBlockGroupLayout = ({ children }: LayoutProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  // const { gid, group } = useParams<{ gid: string; group: string }>();
  // console.log('InputBlockGroupLayout', gid, group);

  const handleBackToProject = () => {
    if (flow && projectId) {
      router.push(`/project/select_data?flow=${flow}&projectId=${projectId}`);
    }
  };

  return (
    <InputBlockGroupDataProvider>
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackToProject}
      />
      <main className="mx-auto px-4 sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
        {children}
      </main>
    </InputBlockGroupDataProvider>
  );
};

export default InputBlockGroupLayout;
