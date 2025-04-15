'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ReactNode } from 'react';
import { FairnessTreeProvider } from '@/app/inputs/[gid]/[cid]/context/FairnessTreeContext';
import LayoutHeader from '@/app/inputs/components/LayoutHeader';

type LayoutProps = {
  children: ReactNode;
};

// A single layout that provides all necessary providers for any type of input block
const InputBlockLayout = ({ children }: LayoutProps) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* FairnessTreeProvider is shared between different plugins */}
        <FairnessTreeProvider>
          <div>
            <LayoutHeader />
            <main>{children}</main>
          </div>
        </FairnessTreeProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
};

export default InputBlockLayout;
