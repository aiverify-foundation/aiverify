'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Create the QueryClient instance
const queryClient = new QueryClient();

// Define the layout component with children prop type
const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <main>
      <QueryClientProvider client={queryClient}>
        {children} {/* Renders the page content */}
      </QueryClientProvider>
    </main>
  );
};

export default Layout;
