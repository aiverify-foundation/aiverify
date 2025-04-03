'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import '@/app/globals.css';

const queryClient = new QueryClient();

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <main>{children}</main>
      </div>
    </QueryClientProvider>
  );
};

export default Layout;
