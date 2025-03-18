'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ReactNode } from 'react';
import LayoutHeader from '@/app/inputs/components/LayoutHeader';

type LayoutProps = {
  children: ReactNode;
};

const ResultsLayout = ({ children }: LayoutProps) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <LayoutHeader />
        <main>{children}</main>
      </div>
    </QueryClientProvider>
  );
};

export default ResultsLayout;
