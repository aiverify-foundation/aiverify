import React from 'react';
import { ReactNode } from 'react';
import '../globals.css';
import LayoutHeader from './components/LayoutHeader';

type LayoutProps = {
  children: ReactNode;
};

const ResultsLayout = ({ children }: LayoutProps) => {
  return (
    <div>
        <LayoutHeader />
        <main className="mx-auto px-4 pt-[64px] sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
        {children}
        </main>
    </div>
  );
};

export default ResultsLayout;