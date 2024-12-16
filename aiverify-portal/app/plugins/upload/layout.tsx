'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UploadPage from './page';  // Adjust the import as needed

// Create the QueryClient instance
const queryClient = new QueryClient();

// Define the layout component with children prop type
const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <main className="mx-auto px-4 pt-10 sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
        <QueryClientProvider client={queryClient}>  
            {children} {/* Renders the page content */}      
        </QueryClientProvider>
    </main>
  );
};

export default Layout;
