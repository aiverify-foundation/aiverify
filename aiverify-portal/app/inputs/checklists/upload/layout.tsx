import React from 'react';
import { ReactNode } from 'react';
import { ChecklistsProvider } from '@/app/inputs/checklists/upload/context/ChecklistsContext';
import LayoutHeader from '@/app/inputs/components/LayoutHeader';

type LayoutProps = {
  children: ReactNode;
};

const ResultsLayout = ({ children }: LayoutProps) => {
  return (
    <ChecklistsProvider>
      <div>
        <LayoutHeader />
        <main className="mx-auto px-4 sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
          {children}
        </main>
      </div>
    </ChecklistsProvider>
  );
};

export default ResultsLayout;
